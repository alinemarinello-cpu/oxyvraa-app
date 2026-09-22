// Sincronização com o backend (Lovable Cloud).
// Os registros locais (localStorage) são espelhados no banco usando `legacy_id`
// como chave de idempotência. Fotos em dataURL sobem para o bucket "evidencias".
import { supabase } from "@/integrations/supabase/client";
import {
  getPrefeituras,
  getUnits,
  getCleanings,
  getColaboradoras,
  getIncidentes,
  getPagamentos,
  getDespesas,
  getPresencas,
  savePrefeitura,
  saveUnit,
  saveColaboradora,
  addCleaning,
  addIncidente,
  savePagamento,
  saveDespesa,
  type Cleaning,
  type Prefeitura,
  type Unit,
  type Colaboradora,
} from "@/lib/oxyvra-store";
import { getNaoConformidades } from "@/lib/oxyvra-industrial";


const BUCKET = "evidencias";

export type SyncResult = {
  enviados: number;
  recebidos: number;
  fotos: number;
  erro?: string;
};

function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) return null;
  const [, mime, b64, payload] = m;
  if (b64) {
    const bin = atob(payload!);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(payload!)], { type: mime });
}

async function subirFoto(path: string, dataUrl: string): Promise<string | null> {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return null;
  const ext = blob.type.includes("png") ? "png" : blob.type.includes("svg") ? "svg" : "jpg";
  const full = `${path}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(full, blob, { upsert: true, contentType: blob.type });
  if (error && !error.message.includes("exists")) return null;
  return full;
}

/** URL temporária para exibir uma foto guardada na nuvem. */
export async function urlFotoAssinada(path: string, segundos = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, segundos);
  return data?.signedUrl ?? null;
}

function iso(ms: number | undefined): string {
  return new Date(ms ?? Date.now()).toISOString();
}

/** Envia tudo o que existe no aparelho para a nuvem e traz o que ainda não existe aqui. */
export async function sincronizarNuvem(): Promise<SyncResult> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { enviados: 0, recebidos: 0, fotos: 0, erro: "Sem sessão ativa." };

  let enviados = 0;
  let recebidos = 0;
  let fotos = 0;

  try {
    // Organização do usuário: exigida pela RLS de prefeituras/unidades.
    const { data: orgId } = await supabase.rpc("minha_organizacao", {
      _user_id: auth.user.id,
    });

    // ---------- PREFEITURAS ----------
    // Preserva cidade/UF já cadastrados no painel: o aparelho não guarda esses campos.
    const { data: prefExistentes } = await supabase
      .from("prefeituras")
      .select("legacy_id, cidade, uf");
    const prefAtual = new Map<string, { cidade: string; uf: string }>();
    for (const r of prefExistentes ?? [])
      if (r.legacy_id) prefAtual.set(r.legacy_id, { cidade: r.cidade ?? "", uf: r.uf ?? "SP" });

    const prefs = getPrefeituras();
    if (prefs.length && orgId) {
      const { error } = await supabase.from("prefeituras").upsert(
        prefs.map((p) => ({
          legacy_id: p.id,
          organizacao_id: orgId,
          cidade: prefAtual.get(p.id)?.cidade ?? "",
          nome: p.nome,
          uf: p.uf,
          vertical: p.vertical ?? "educacional",
          vertical_type: p.verticalType ?? null,
          responsavel_qa: p.responsavelQa ?? null,
          responsavel_tecnico: p.responsavelTecnico ?? null,
          registro_rt: p.registroRt ?? null,
          valor_mensal: p.valorMensal ?? null,
          dia_vencimento: p.diaVencimento ?? null,
          inicio_contrato: p.inicioContrato ?? null,
          fim_contrato: p.fimContrato ?? null,
          numero_contrato: p.numeroContrato ?? null,
          observacoes: p.observacoes ?? null,
        })),
        { onConflict: "legacy_id" },
      );
      if (error) throw error;
      enviados += prefs.length;
    }

    const { data: prefRows } = await supabase.from("prefeituras").select("*");
    const prefIdPorLegacy = new Map<string, string>();
    for (const r of prefRows ?? []) if (r.legacy_id) prefIdPorLegacy.set(r.legacy_id, r.id);


    // ---------- UNIDADES ----------
    // Também preserva cidade/UF já cadastrados no painel para cada unidade.
    const { data: unitExistentes } = await supabase.from("units").select("legacy_id, cidade, uf");
    const unitAtual = new Map<string, { cidade: string; uf: string | null }>();
    for (const r of unitExistentes ?? [])
      if (r.legacy_id) unitAtual.set(r.legacy_id, { cidade: r.cidade ?? "", uf: r.uf ?? null });

    const units = getUnits();
    const unitsValidas = units.filter((u) => prefIdPorLegacy.has(u.prefeituraId));
    if (unitsValidas.length) {
      const { error } = await supabase.from("units").upsert(
        unitsValidas.map((u) => ({
          legacy_id: u.id,
          prefeitura_id: prefIdPorLegacy.get(u.prefeituraId)!,
          tipo: u.tipo,
          nome: u.nome,
          bairro: u.bairro,
          cidade: unitAtual.get(u.id)?.cidade ?? "",
          uf:
            prefs.find((p) => p.id === u.prefeituraId)?.uf ??
            unitAtual.get(u.id)?.uf ??
            prefAtual.get(u.prefeituraId)?.uf ??
            "SP",

          pin: u.pin,
          responsavel: u.responsavel,
          nome_completo: u.nomeCompleto ?? null,
          endereco: u.endereco ?? null,
          foto_fachada: u.fotoFachada ?? null,
          qtd_alunos: u.qtdAlunos ?? null,
          qtd_colaboradores: u.qtdColaboradores ?? null,
          lat: u.lat ?? null,
          lng: u.lng ?? null,
          raio_metros: u.raioMetros ?? 150,
          ambientes: u.ambientes ?? [],
          locais: u.locais ?? [],
          ambientes_custom: u.ambientesCustom ?? {},
          produtos: u.produtos ?? [],
        })),
        { onConflict: "legacy_id" },
      );
      if (error) throw error;
      enviados += unitsValidas.length;
    }

    const { data: unitRows } = await supabase.from("units").select("*");
    const unitIdPorLegacy = new Map<string, string>();
    for (const r of unitRows ?? []) if (r.legacy_id) unitIdPorLegacy.set(r.legacy_id, r.id);

    // ---------- COLABORADORAS ----------
    const colabs = getColaboradoras().filter((c) => unitIdPorLegacy.has(c.unitId));
    if (colabs.length) {
      const { error } = await supabase.from("colaboradoras").upsert(
        colabs.map((c) => ({
          legacy_id: c.id,
          unit_id: unitIdPorLegacy.get(c.unitId)!,
          nome: c.nome,
          cpf: c.cpf ?? null,
          telefone: c.telefone ?? null,
          pin: c.pin ?? null,
          turnos: c.turnos ?? [],
          ativo: c.ativo,
        })),
        { onConflict: "legacy_id" },
      );
      if (error) throw error;
      enviados += colabs.length;
    }

    // ---------- LIMPEZAS (+ fotos) ----------
    // Consulta apenas os registros locais candidatos (em blocos), em vez de baixar
    // a lista inteira de limpezas já enviadas — isso mantém a sincronização leve
    // mesmo com dezenas de milhares de registros na nuvem.
    const candidatas = getCleanings().filter(
      (c) => unitIdPorLegacy.has(c.unitId) && prefIdPorLegacy.has(c.prefeituraId),
    );
    const enviadasSet = new Set<string>();
    for (let i = 0; i < candidatas.length; i += 200) {
      const bloco = candidatas.slice(i, i + 200).map((c) => c.id);
      const { data: ja } = await supabase
        .from("cleanings")
        .select("legacy_id")
        .in("legacy_id", bloco);
      for (const r of ja ?? []) if (r.legacy_id) enviadasSet.add(r.legacy_id);
    }
    const pendentes = candidatas.filter((c) => !enviadasSet.has(c.id));

    for (const c of pendentes) {
      let fotoAntes = c.fotoAntes ?? null;
      let fotoDepois = c.fotoDepois ?? null;
      if (fotoAntes?.startsWith("data:")) {
        const p = await subirFoto(`${c.unitId}/${c.id}-antes`, fotoAntes);
        if (p) {
          fotoAntes = p;
          fotos++;
        }
      }
      if (fotoDepois?.startsWith("data:")) {
        const p = await subirFoto(`${c.unitId}/${c.id}-depois`, fotoDepois);
        if (p) {
          fotoDepois = p;
          fotos++;
        }
      }
      const { error } = await supabase.from("cleanings").insert({
        legacy_id: c.id,
        unit_id: unitIdPorLegacy.get(c.unitId)!,
        prefeitura_id: prefIdPorLegacy.get(c.prefeituraId)!,
        registrado_por: auth.user.id,
        ambiente: c.ambiente,
        local_id: c.localId ?? null,
        servente: c.servente,
        executado_em: iso(c.timestamp),
        lat: c.lat ?? null,
        lng: c.lng ?? null,
        distancia_metros: c.distanciaMetros ?? null,
        fora_da_area: c.foraDaArea ?? false,
        foto_antes: fotoAntes,
        foto_depois: fotoDepois,
        duracao_seg: c.duracaoSeg ?? null,
        itens_feitos: c.itensFeitos ?? [],
        status: c.status ?? "pendente",
        motivo_reprovacao: c.motivoReprovacao ?? null,
        revisado_por: c.revisadoPor ?? null,
        revisado_em: c.revisadoEm ? iso(c.revisadoEm) : null,
        refaz_de: c.refazDe ?? null,
        qr_validado: c.qrValidado ?? false,
        nfc_validado: c.nfcValidado ?? false,
        pin_operadora: c.pinOperadora ?? null,
        colaboradora_id: c.colaboradoraId ?? null,
        colaboradora_nome: c.colaboradoraNome ?? null,
        tipo_limpeza: c.tipoLimpeza ?? null,
        cor_kit: c.corKit ?? null,
        alergenos_zona: c.alergenosZona ?? [],
        alerta_alergeno: c.alertaAlergeno ?? null,
        dwell_cancelado_seg: c.dwellCanceladoSeg ?? null,
        nc_id: c.ncId ?? null,
      });
      if (!error) enviados++;
    }

    // ---------- INTERCORRÊNCIAS ----------
    const { data: incRows0 } = await supabase.from("incidentes").select("legacy_id");
    const incSet = new Set((incRows0 ?? []).map((i) => i.legacy_id));
    const incs = getIncidentes().filter(
      (i) => !incSet.has(i.id) && unitIdPorLegacy.has(i.unitId) && prefIdPorLegacy.has(i.prefeituraId),
    );
    if (incs.length) {
      const { error } = await supabase.from("incidentes").insert(
        incs.map((i) => ({
          legacy_id: i.id,
          unit_id: unitIdPorLegacy.get(i.unitId)!,
          prefeitura_id: prefIdPorLegacy.get(i.prefeituraId)!,
          tipo: i.tipo,
          quantidade: i.quantidade,
          descricao: i.descricao,
          reportado_por: i.reportadoPor,
          ocorrido_em: iso(i.timestamp),
          lat: i.lat ?? null,
          lng: i.lng ?? null,
        })),
      );
      if (!error) enviados += incs.length;
    }

    // ---------- NÃO CONFORMIDADES ----------
    const { data: ncRows0 } = await supabase.from("nao_conformidades").select("legacy_id");
    const ncSet = new Set((ncRows0 ?? []).map((n) => n.legacy_id));
    const ncs = getNaoConformidades().filter(
      (n) => !ncSet.has(n.id) && unitIdPorLegacy.has(n.unitId),
    );
    if (ncs.length) {
      const { error } = await supabase.from("nao_conformidades").insert(
        ncs.map((n) => ({
          legacy_id: n.id,
          unit_id: unitIdPorLegacy.get(n.unitId)!,
          prefeitura_id: prefIdPorLegacy.get(n.prefeituraId) ?? null,
          local_id: n.localId ?? null,
          origem: n.origem,
          status: n.status,
          descricao: n.descricao,
          acao_corretiva: n.acaoCorretiva ?? null,
          responsavel: n.responsavelQa ?? null,
          aberta_em: iso(n.abertaEm),
          liberada_em: n.liberadaEm ? iso(n.liberadaEm) : null,
          dados: { localNome: n.localNome, cleaningId: n.cleaningId ?? null },
        })),
      );
      if (!error) enviados += ncs.length;
    }


    // ---------- PRESENÇAS ----------
    const { data: colabRows } = await supabase.from("colaboradoras").select("id, legacy_id");
    const colabIdPorLegacy = new Map<string, string>();
    for (const r of colabRows ?? []) if (r.legacy_id) colabIdPorLegacy.set(r.legacy_id, r.id);
    const presencas = getPresencas().filter(
      (p) => colabIdPorLegacy.has(p.colaboradoraId) && unitIdPorLegacy.has(p.unitId),
    );
    if (presencas.length) {
      const { error } = await supabase.from("presencas").upsert(
        presencas.map((p) => ({
          legacy_id: p.id,
          colaboradora_id: colabIdPorLegacy.get(p.colaboradoraId)!,
          unit_id: unitIdPorLegacy.get(p.unitId)!,
          data: p.data,
          turno: p.turno,
          checkin: p.checkin ? iso(p.checkin) : null,
          checkout: p.checkout ? iso(p.checkout) : null,
        })),
        { onConflict: "legacy_id" },
      );
      if (!error) enviados += presencas.length;
    }

    // ---------- FINANCEIRO (somente admin) ----------
    const pags = getPagamentos().filter((p) => prefIdPorLegacy.has(p.prefeituraId));
    if (pags.length) {
      await supabase.from("pagamentos").upsert(
        pags.map((p) => ({
          legacy_id: p.id,
          prefeitura_id: prefIdPorLegacy.get(p.prefeituraId)!,
          competencia: p.competencia,
          valor: p.valor,
          vencimento: p.vencimento,
          pago_em: p.pagoEm ?? null,
          metodo: p.metodo ?? null,
          observacao: p.observacao ?? null,
        })),
        { onConflict: "legacy_id" },
      );
    }
    const desps = getDespesas().filter((d) => prefIdPorLegacy.has(d.prefeituraId));
    if (desps.length) {
      await supabase.from("despesas").upsert(
        desps.map((d) => ({
          legacy_id: d.id,
          prefeitura_id: prefIdPorLegacy.get(d.prefeituraId)!,
          data: d.data,
          categoria: d.categoria,
          descricao: d.descricao,
          valor: d.valor,
          quantidade: d.quantidade ?? null,
          unidade: d.unidade ?? null,
        })),
        { onConflict: "legacy_id" },
      );
    }

    // ---------- PULL: traz para o aparelho o que veio de outros dispositivos ----------
    recebidos = await puxarDaNuvem(prefRows ?? [], unitRows ?? []);
  } catch (e) {
    return { enviados, recebidos, fotos, erro: e instanceof Error ? e.message : "Falha na sincronização." };
  }

  return { enviados, recebidos, fotos };
}

type PrefRow = { id: string; legacy_id: string | null; [k: string]: unknown };
type UnitRow = { id: string; legacy_id: string | null; [k: string]: unknown };

async function puxarDaNuvem(prefRows: PrefRow[], unitRows: UnitRow[]): Promise<number> {
  let recebidos = 0;
  const locaisPrefs = new Set(getPrefeituras().map((p) => p.id));
  const legacyPorPrefUuid = new Map<string, string>();

  for (const r of prefRows) {
    const legacy = r.legacy_id ?? `pref-${r.id.slice(0, 8)}`;
    legacyPorPrefUuid.set(r.id, legacy);
    if (locaisPrefs.has(legacy)) continue;
    const p: Prefeitura = {
      id: legacy,
      nome: String(r["nome"] ?? ""),
      uf: String(r["uf"] ?? "SP"),
      vertical: (r["vertical"] as Prefeitura["vertical"]) ?? "educacional",
      verticalType: (r["vertical_type"] as string) ?? undefined,
      responsavelTecnico: (r["responsavel_tecnico"] as string) ?? undefined,
      registroRt: (r["registro_rt"] as string) ?? undefined,
    };
    savePrefeitura(p);
    recebidos++;
  }

  const locaisUnits = new Set(getUnits().map((u) => u.id));
  const legacyPorUnitUuid = new Map<string, string>();
  for (const r of unitRows) {
    const legacy = r.legacy_id ?? `unit-${r.id.slice(0, 8)}`;
    legacyPorUnitUuid.set(r.id, legacy);
    if (locaisUnits.has(legacy)) continue;
    const u: Unit = {
      id: legacy,
      prefeituraId: legacyPorPrefUuid.get(String(r["prefeitura_id"])) ?? "",
      tipo: (r["tipo"] as Unit["tipo"]) ?? "escola",
      nome: String(r["nome"] ?? ""),
      bairro: String(r["bairro"] ?? ""),
      pin: String(r["pin"] ?? ""),
      responsavel: String(r["responsavel"] ?? ""),
      ambientes: (r["ambientes"] as string[]) ?? [],
      locais: (r["locais"] as Unit["locais"]) ?? [],
      ambientesCustom: (r["ambientes_custom"] as Unit["ambientesCustom"]) ?? {},
      produtos: (r["produtos"] as Unit["produtos"]) ?? [],
      nomeCompleto: (r["nome_completo"] as string) ?? undefined,
      endereco: (r["endereco"] as string) ?? undefined,
      lat: (r["lat"] as number) ?? undefined,
      lng: (r["lng"] as number) ?? undefined,
      raioMetros: (r["raio_metros"] as number) ?? 150,
    };
    saveUnit(u);
    recebidos++;
  }

  // Colaboradoras
  const { data: colabRows } = await supabase.from("colaboradoras").select("*");
  const locaisColabs = new Set(getColaboradoras().map((c) => c.id));
  for (const r of colabRows ?? []) {
    const legacy = r.legacy_id ?? `colab-${r.id.slice(0, 8)}`;
    if (locaisColabs.has(legacy)) continue;
    const unitLegacy = legacyPorUnitUuid.get(r.unit_id);
    if (!unitLegacy) continue;
    const c: Colaboradora = {
      id: legacy,
      unitId: unitLegacy,
      nome: r.nome,
      cpf: r.cpf ?? undefined,
      telefone: r.telefone ?? undefined,
      pin: r.pin ?? undefined,
      turnos: (r.turnos as Colaboradora["turnos"]) ?? [],
      ativo: r.ativo,
    };
    saveColaboradora(c);
    recebidos++;
  }

  // Limpezas
  const { data: cleanRows } = await supabase
    .from("cleanings")
    .select("*")
    .order("executado_em", { ascending: false })
    .limit(500);
  const locaisCleanings = new Set(getCleanings().map((c) => c.id));
  for (const r of cleanRows ?? []) {
    const legacy = r.legacy_id ?? `cl-${r.id.slice(0, 8)}`;
    if (locaisCleanings.has(legacy)) continue;
    const unitLegacy = legacyPorUnitUuid.get(r.unit_id);
    if (!unitLegacy) continue;
    addCleaning({
      unitId: unitLegacy,
      ambiente: r.ambiente,
      localId: r.local_id ?? undefined,
      servente: r.servente,
      timestamp: new Date(r.executado_em).getTime(),
      lat: r.lat ?? undefined,
      lng: r.lng ?? undefined,
      distanciaMetros: r.distancia_metros ?? undefined,
      foraDaArea: r.fora_da_area,
      duracaoSeg: r.duracao_seg ?? undefined,
      itensFeitos: (r.itens_feitos as string[]) ?? [],
      status: (r.status as Cleaning["status"]) ?? "pendente",
      qrValidado: r.qr_validado,
      nfcValidado: r.nfc_validado,
      colaboradoraNome: r.colaboradora_nome ?? undefined,
    });
    recebidos++;
  }

  // Intercorrências
  const { data: incRows } = await supabase.from("incidentes").select("*").limit(500);
  const locaisIncs = new Set(getIncidentes().map((i) => i.id));
  for (const r of incRows ?? []) {
    const legacy = r.legacy_id ?? `inc-${r.id.slice(0, 8)}`;
    if (locaisIncs.has(legacy)) continue;
    const unitLegacy = legacyPorUnitUuid.get(r.unit_id);
    if (!unitLegacy) continue;
    addIncidente({
      unitId: unitLegacy,
      tipo: r.tipo as Parameters<typeof addIncidente>[0]["tipo"],
      quantidade: r.quantidade,
      descricao: r.descricao,
      reportadoPor: r.reportado_por,
    });
    recebidos++;
  }

  // Financeiro (só chega se o usuário for admin — RLS bloqueia os demais)
  const { data: pagRows } = await supabase.from("pagamentos").select("*");
  const locaisPags = new Set(getPagamentos().map((p) => p.id));
  for (const r of pagRows ?? []) {
    const legacy = r.legacy_id ?? `pag-${r.id.slice(0, 8)}`;
    if (locaisPags.has(legacy)) continue;
    const prefLegacy = legacyPorPrefUuid.get(r.prefeitura_id);
    if (!prefLegacy) continue;
    savePagamento({
      id: legacy,
      prefeituraId: prefLegacy,
      competencia: r.competencia,
      valor: Number(r.valor),
      vencimento: r.vencimento,
      pagoEm: r.pago_em ?? undefined,
      metodo: r.metodo ?? undefined,
      observacao: r.observacao ?? undefined,
    });
    recebidos++;
  }

  const { data: despRows } = await supabase.from("despesas").select("*");
  const locaisDesps = new Set(getDespesas().map((d) => d.id));
  for (const r of despRows ?? []) {
    const legacy = r.legacy_id ?? `desp-${r.id.slice(0, 8)}`;
    if (locaisDesps.has(legacy)) continue;
    const prefLegacy = legacyPorPrefUuid.get(r.prefeitura_id);
    if (!prefLegacy) continue;
    saveDespesa({
      id: legacy,
      prefeituraId: prefLegacy,
      data: r.data,
      categoria: r.categoria as Parameters<typeof saveDespesa>[0]["categoria"],
      descricao: r.descricao,
      valor: Number(r.valor),
      quantidade: r.quantidade ? Number(r.quantidade) : undefined,
      unidade: r.unidade ?? undefined,
    });
    recebidos++;
  }

  return recebidos;
}
