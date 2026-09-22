import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { foraDoLimite, type ExecucaoPayload } from "@/lib/compliance-types";

type Db = SupabaseClient<Database>;

export type OrganizacaoInfo = {
  id: string;
  nome: string;
  plano: string;
  status: string;
  trial_expira_em: string;
};

/** Devolve a organização do usuário, criando uma com trial de 7 dias na primeira vez. */
export async function garantirOrganizacao(
  userId: string,
  nome: string,
  supabase: Db,
): Promise<OrganizacaoInfo> {
  const { data: membro } = await supabase
    .from("organizacao_membros")
    .select("organizacao_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();

  if (membro?.organizacao_id) {
    const { data: org, error } = await supabase
      .from("organizacoes")
      .select("id, nome, plano, status, trial_expira_em")
      .eq("id", membro.organizacao_id)
      .single();
    if (error) throw error;
    return org as OrganizacaoInfo;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Bootstrap master: a primeira conta confirmada do sistema vira "master"
  // (ADM geral, enxerga todas as organizações). As seguintes viram só gestor.
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "master");
  const ehPrimeiroMaster = (count ?? 0) === 0;

  const { data: org, error } = await supabaseAdmin
    .from("organizacoes")
    .insert({ nome: nome.trim() || "Minha organização" })
    .select("id, nome, plano, status, trial_expira_em")
    .single();
  if (error) throw error;

  await supabaseAdmin
    .from("organizacao_membros")
    .insert({ organizacao_id: org.id, user_id: userId });

  await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "gestor" });
  if (ehPrimeiroMaster) {
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "master" })
      .select("id")
      .maybeSingle();
  }

  return org as OrganizacaoInfo;
}

function prazoPadrao(critico: boolean): string {
  const d = new Date();
  d.setDate(d.getDate() + (critico ? 2 : 7));
  return d.toISOString().slice(0, 10);
}

/** Grava execução + respostas de forma idempotente e abre alertas/CAPA das exceções. */
export async function gravarExecucao(payload: ExecucaoPayload, userId: string, supabase: Db) {
  const existente = await supabase
    .from("execucoes")
    .select("id")
    .eq("idempotency_key", payload.idempotencyKey)
    .maybeSingle();
  if (existente.data?.id) return { id: existente.data.id, duplicada: true, excecoes: 0 };

  const { data: membro } = await supabase
    .from("organizacao_membros")
    .select("organizacao_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();

  const { data: itens } = await supabase
    .from("checklist_itens")
    .select("id, valor_min, valor_max, tipo, critico, pergunta")
    .eq("checklist_id", payload.checklistId);

  const porItem = new Map((itens ?? []).map((i) => [i.id, i]));

  const { data: execucao, error: errExec } = await supabase
    .from("execucoes")
    .insert({
      idempotency_key: payload.idempotencyKey,
      checklist_id: payload.checklistId,
      unit_id: payload.unitId,
      organizacao_id: membro?.organizacao_id ?? null,
      executado_por: userId,
      executor_nome: payload.executorNome ?? "",
      iniciada_em: payload.iniciadaEm,
      lat: payload.lat,
      lng: payload.lng,
      dispositivo: payload.dispositivo,
      assinatura: payload.assinatura,
    })
    .select("id")
    .single();
  if (errExec) throw errExec;

  let conformes = 0;
  let naoConformes = 0;
  const excecoes: {
    pergunta: string;
    critico: boolean;
    temperatura: boolean;
    lactario: boolean;
    motivo: string;
    respostaId: string;
  }[] = [];

  for (const r of payload.respostas) {
    const item = r.itemId ? porItem.get(r.itemId) : undefined;
    const fora = foraDoLimite(
      {
        tipo: r.tipo,
        valor_min: item?.valor_min ?? null,
        valor_max: item?.valor_max ?? null,
      },
      r.valorNumero,
    );
    const critico = item?.critico ?? r.critico;
    if (r.conforme === true && !fora) conformes++;
    if (r.conforme === false || fora) naoConformes++;

    const { data: resp, error } = await supabase
      .from("respostas")
      .insert({
        execucao_id: execucao.id,
        item_id: r.itemId,
        pergunta: r.pergunta,
        tipo: r.tipo,
        critico,
        valor_texto: r.valorTexto,
        valor_numero: r.valorNumero,
        conforme: r.conforme,
        foto: r.foto,
        observacao: r.observacao,
        fora_do_limite: fora,
        registrado_em: r.registradoEm,
        registrado_por: userId,
        lat: r.lat,
        lng: r.lng,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (fora || r.conforme === false) {
      // Lactário (berçários/creches): leite materno e fórmulas devem ficar entre 2 °C e 4 °C.
      const lactario =
        r.tipo === "temperatura" &&
        fora &&
        /lactario|lactário|leite materno|f[óo]rmula|mamadeira/i.test(r.pergunta);
      excecoes.push({
        pergunta: r.pergunta,
        critico,
        temperatura: fora && r.tipo === "temperatura",
        lactario,
        motivo: lactario
          ? `Temperatura do lactário fora da faixa de 2 °C a 4 °C (${r.valorNumero ?? "—"} °C). Descartar/isolar o leite exposto e acionar a coordenação imediatamente (RDC 216/2004).`
          : fora
            ? r.tipo === "temperatura"
              ? `Temperatura fora do limite (${r.valorNumero ?? "—"} °C). Acionar imediatamente a equipe de Alimentos & Bebidas.`
              : `Valor fora da faixa aceitável (${r.valorNumero ?? "—"}).`
            : "Item registrado como Não Conforme.",
        respostaId: resp.id,
      });
    }
  }

  await supabase
    .from("execucoes")
    .update({
      concluida_em: new Date().toISOString(),
      total_itens: payload.respostas.length,
      total_conformes: conformes,
      total_nao_conformes: naoConformes,
    })
    .eq("id", execucao.id);

  for (const ex of excecoes) {
    await supabase.from("alertas").insert({
      organizacao_id: membro?.organizacao_id ?? null,
      unit_id: payload.unitId,
      execucao_id: execucao.id,
      tipo: ex.lactario ? "lactario" : ex.temperatura ? "temperatura" : "nao_conformidade",
      severidade: ex.critico || ex.temperatura ? "critica" : "alta",
      titulo: ex.lactario ? `Lactário: ${ex.pergunta}`.slice(0, 120) : ex.pergunta.slice(0, 120),
      mensagem: ex.motivo,
    });
    await supabase.from("planos_acao").insert({
      organizacao_id: membro?.organizacao_id ?? null,
      unit_id: payload.unitId,
      execucao_id: execucao.id,
      resposta_id: ex.respostaId,
      titulo: ex.pergunta.slice(0, 160),
      descricao: ex.motivo,
      criticidade: ex.critico || ex.temperatura || ex.lactario ? "alta" : "media",
      responsavel: payload.executorNome ?? "",
      prazo: prazoPadrao(ex.critico || ex.lactario),
    });
  }

  // Fluxo de suítes (motéis / alta rotatividade): fecha o giro escaneado por QR Code
  // e sincroniza o status da suíte no painel do gestor.
  if (payload.suiteId) {
    const bloqueada = excecoes.some((e) => e.critico);
    const hidro = payload.respostas.find((r) => /hidro|jacuzzi|recircula/i.test(r.pergunta));
    const cloro = payload.respostas.find(
      (r) => /cloro/i.test(r.pergunta) && r.valorNumero !== null,
    );

    await supabase.from("suite_higienizacoes").insert({
      organizacao_id: membro?.organizacao_id ?? null,
      suite_id: payload.suiteId,
      unit_id: payload.unitId,
      execucao_id: execucao.id,
      colaboradora_nome: payload.executorNome ?? "",
      qr_validado: payload.qrValidado ?? false,
      iniciada_em: payload.iniciadaEm,
      concluida_em: new Date().toISOString(),
      hidro_sanitizada: hidro?.conforme === true,
      cloro_residual: cloro?.valorNumero ?? null,
      lat: payload.lat,
      lng: payload.lng,
      status_final: bloqueada ? "bloqueada" : "disponivel",
    });

    const agora = new Date().toISOString();
    await supabase
      .from("suites")
      .update({
        status: bloqueada ? "bloqueada" : "disponivel",
        status_atualizado_em: agora,
        ultima_higienizacao: agora,
        ...(hidro?.conforme === true ? { ultima_sanitizacao_hidro: agora } : {}),
      })
      .eq("id", payload.suiteId);

    if (hidro && hidro.conforme !== true) {
      await supabase.from("alertas").insert({
        organizacao_id: membro?.organizacao_id ?? null,
        unit_id: payload.unitId,
        execucao_id: execucao.id,
        tipo: "hidromassagem",
        severidade: "critica",
        titulo: "Hidromassagem sem sanitização registrada",
        mensagem:
          "A suíte foi encerrada sem confirmação da sanitização/recirculação da hidro. Bloquear o uso até nova desinfecção (Portaria MS 888/2021).",
      });
    }
  }

  return { id: execucao.id, duplicada: false, excecoes: excecoes.length };
}

// ---------------- Responsável pela conta (dados do assinante) ----------------

export type ResponsavelConta = {
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  responsavel_cpf: string | null;
  responsavel_observacoes: string | null;
  cnpj: string | null;
  email_contato: string | null;
};

export type Assinante = OrganizacaoInfo &
  ResponsavelConta & {
    created_at: string;
    membros: { nome: string | null; email: string | null }[];
    unidades: number;
  };

const CAMPOS_RESP =
  "responsavel_nome, responsavel_cargo, responsavel_email, responsavel_telefone, responsavel_cpf, responsavel_observacoes, cnpj, email_contato";

/** Dados do responsável pela conta da organização do usuário logado. */
export async function lerResponsavel(userId: string, supabase: Db) {
  const { data: membro } = await supabase
    .from("organizacao_membros")
    .select("organizacao_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!membro?.organizacao_id) return null;
  const { data, error } = await supabase
    .from("organizacoes")
    .select(CAMPOS_RESP)
    .eq("id", membro.organizacao_id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ResponsavelConta | null;
}

export async function gravarResponsavel(
  userId: string,
  dados: Partial<ResponsavelConta>,
  supabase: Db,
) {
  const { data: membro } = await supabase
    .from("organizacao_membros")
    .select("organizacao_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  // Conta nova ainda sem organização: cria na hora em vez de falhar.
  const organizacaoId =
    membro?.organizacao_id ??
    (await garantirOrganizacao(userId, dados.responsavel_nome || "Minha organização", supabase)).id;
  const { error } = await supabase
    .from("organizacoes")
    .update({
      responsavel_nome: dados.responsavel_nome ?? null,
      responsavel_cargo: dados.responsavel_cargo ?? null,
      responsavel_email: dados.responsavel_email ?? null,
      responsavel_telefone: dados.responsavel_telefone ?? null,
      responsavel_cpf: dados.responsavel_cpf ?? null,
      responsavel_observacoes: dados.responsavel_observacoes ?? null,
      cnpj: dados.cnpj ?? null,
      email_contato: dados.email_contato ?? null,
    })
    .eq("id", organizacaoId);
  if (error) throw error;
  return { ok: true };
}

/** Lista todos os assinantes com o responsável de cada conta. Apenas conta master. */
export async function listarAssinantes(
  userId: string,
  supabase: Db,
  opcoes: { busca?: string; pagina?: number; porPagina?: number } = {},
): Promise<{ itens: Assinante[]; total: number; pagina: number; porPagina: number }> {
  const { data: ehMaster, error: errRole } = await supabase.rpc("is_master", { _user_id: userId });
  if (errRole) throw errRole;
  if (!ehMaster) throw new Error("Acesso restrito à conta administradora geral.");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const pagina = Math.max(1, Math.round(opcoes.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(5, Math.round(opcoes.porPagina ?? 25)));
  const de = (pagina - 1) * porPagina;
  const termo = String(opcoes.busca ?? "")
    .replace(/[%,()]/g, " ")
    .trim();

  let consulta = supabaseAdmin
    .from("organizacoes")
    .select(`id, nome, plano, status, trial_expira_em, created_at, ${CAMPOS_RESP}`, {
      count: "exact",
    });
  if (termo) {
    const like = `%${termo}%`;
    consulta = consulta.or(
      `nome.ilike.${like},cnpj.ilike.${like},responsavel_nome.ilike.${like},responsavel_email.ilike.${like},responsavel_telefone.ilike.${like}`,
    );
  }

  const {
    data: orgs,
    error,
    count,
  } = await consulta.order("created_at", { ascending: false }).range(de, de + porPagina - 1);
  if (error) throw error;

  const ids = (orgs ?? []).map((o) => o.id);
  const { data: membros } = await supabaseAdmin
    .from("organizacao_membros")
    .select("organizacao_id, user_id")
    .in("organizacao_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const userIds = Array.from(new Set((membros ?? []).map((m) => m.user_id)));
  const { data: perfis } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, email")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const perfilPorId = new Map((perfis ?? []).map((p) => [p.id, p]));

  const { data: prefs } = await supabaseAdmin
    .from("prefeituras")
    .select("id, organizacao_id")
    .in("organizacao_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const prefIds = new Map<string, string>();
  (prefs ?? []).forEach((p) => {
    if (p.organizacao_id) prefIds.set(p.id, p.organizacao_id);
  });
  const listaPrefs = Array.from(prefIds.keys());
  const { data: units } = await supabaseAdmin
    .from("units")
    .select("id, prefeitura_id")
    .in("prefeitura_id", listaPrefs.length ? listaPrefs : ["00000000-0000-0000-0000-000000000000"]);
  const unidadesPorOrg = new Map<string, number>();
  (units ?? []).forEach((u) => {
    const org = u.prefeitura_id ? prefIds.get(u.prefeitura_id) : undefined;
    if (org) unidadesPorOrg.set(org, (unidadesPorOrg.get(org) ?? 0) + 1);
  });

  const itens = (orgs ?? []).map((o) => ({
    ...(o as unknown as OrganizacaoInfo & ResponsavelConta & { created_at: string }),
    membros: (membros ?? [])
      .filter((m) => m.organizacao_id === o.id)
      .map((m) => ({
        nome: perfilPorId.get(m.user_id)?.nome ?? null,
        email: perfilPorId.get(m.user_id)?.email ?? null,
      })),
    unidades: unidadesPorOrg.get(o.id) ?? 0,
  }));

  return { itens, total: count ?? itens.length, pagina, porPagina };
}
