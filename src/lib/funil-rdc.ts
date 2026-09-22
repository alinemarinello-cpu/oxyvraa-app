// Diagnóstico público simplificado da RDC Anvisa nº 1.002/2025.
// Serve ao funil de aquisição: visitante responde, vê o índice e as pendências,
// e só então conhece os planos. Nenhum dado de paciente é coletado.
import { supabase } from "@/integrations/supabase/client";

export const AVISO_FUNIL =
  "Ferramenta de apoio à gestão da adequação, baseada na RDC Anvisa nº 1.002/2025. " +
  "Não representa aprovação, certificação ou garantia perante a Anvisa ou a vigilância sanitária local.";

export type PerguntaFunil = {
  chave: string;
  categoria: string;
  texto: string;
  ajuda: string;
  /** Referência normativa exibida no resultado. */
  referencia: string;
  peso: number;
  pendencia: string;
};

export const PERGUNTAS_FUNIL: PerguntaFunil[] = [
  {
    chave: "pop",
    categoria: "Documentação",
    texto: "A clínica tem POPs escritos e atualizados (limpeza, esterilização, resíduos)?",
    ajuda: "Procedimentos Operacionais Padrão datados, assinados pelo responsável técnico e acessíveis à equipe.",
    referencia: "RDC 1.002/2025 — Documentação e POPs",
    peso: 2,
    pendencia: "Elaborar e manter POPs atualizados e acessíveis à equipe.",
  },
  {
    chave: "responsavel_tecnico",
    categoria: "Documentação",
    texto: "Existe responsável técnico formalmente designado e documentado?",
    ajuda: "Registro no conselho de classe e designação por escrito.",
    referencia: "RDC 1.002/2025 — Responsabilidade técnica",
    peso: 2,
    pendencia: "Formalizar a designação do responsável técnico.",
  },
  {
    chave: "autoclave_registro",
    categoria: "Processamento/Esterilização",
    texto: "Cada ciclo de autoclave é registrado com lote, parâmetros e indicador químico?",
    ajuda: "Registro por ciclo com data, equipamento, temperatura, tempo, pressão e resultado do integrador.",
    referencia: "RDC 1.002/2025 — Processamento de produtos para saúde",
    peso: 3,
    pendencia: "Registrar todos os ciclos de autoclave com parâmetros e indicadores.",
  },
  {
    chave: "teste_biologico",
    categoria: "Processamento/Esterilização",
    texto: "O teste biológico é realizado na periodicidade definida e registrado?",
    ajuda: "Ampolas de Geobacillus stearothermophilus com registro de resultado e ação corretiva.",
    referencia: "RDC 1.002/2025 — Monitoramento da esterilização",
    peso: 3,
    pendencia: "Implantar rotina de teste biológico com registro e ação corretiva.",
  },
  {
    chave: "rastreabilidade",
    categoria: "Segurança do Paciente",
    texto: "É possível rastrear qual carga esterilizada foi usada em cada atendimento?",
    ajuda: "Identificação do lote nos pacotes e vínculo com o procedimento.",
    referencia: "RDC 1.002/2025 — Rastreabilidade",
    peso: 2,
    pendencia: "Implantar rastreabilidade de lotes esterilizados.",
  },
  {
    chave: "pgrss",
    categoria: "Resíduos/PGRSS",
    texto: "A clínica tem PGRSS implantado com comprovantes de coleta?",
    ajuda: "Plano de gerenciamento de resíduos e manifestos da empresa coletora.",
    referencia: "RDC 1.002/2025 — Gerenciamento de resíduos",
    peso: 2,
    pendencia: "Implantar o PGRSS e arquivar os comprovantes de coleta.",
  },
  {
    chave: "higiene_maos",
    categoria: "Higiene das Mãos",
    texto: "Há insumos e registro de treinamento de higiene das mãos?",
    ajuda: "Dispensadores abastecidos, técnica afixada e equipe treinada.",
    referencia: "RDC 1.002/2025 — Higiene das mãos",
    peso: 1,
    pendencia: "Padronizar e treinar a higiene das mãos.",
  },
  {
    chave: "treinamentos",
    categoria: "Treinamentos",
    texto: "Os treinamentos de biossegurança da equipe estão registrados e em dia?",
    ajuda: "Lista de presença, conteúdo e data de cada capacitação.",
    referencia: "RDC 1.002/2025 — Capacitação de pessoal",
    peso: 2,
    pendencia: "Registrar e manter em dia os treinamentos da equipe.",
  },
  {
    chave: "licencas",
    categoria: "Documentação",
    texto: "Alvará sanitário e licenças estão válidos e com renovação controlada?",
    ajuda: "Alvará, licença de funcionamento e, quando aplicável, laudo de radiologia.",
    referencia: "RDC 1.002/2025 — Licenciamento",
    peso: 2,
    pendencia: "Controlar prazos e renovações de alvarás e licenças.",
  },
  {
    chave: "nao_conformidades",
    categoria: "Gerenciamento de Riscos",
    texto: "Não conformidades e incidentes são registrados com plano de ação?",
    ajuda: "Registro do evento, causa, ação corretiva, responsável e prazo.",
    referencia: "RDC 1.002/2025 — Gestão de riscos e eventos adversos",
    peso: 2,
    pendencia: "Criar rotina de registro de não conformidades com plano de ação.",
  },
  {
    chave: "evidencias",
    categoria: "Documentação",
    texto: "As evidências (fotos, laudos, planilhas) estão organizadas para a fiscalização?",
    ajuda: "Pasta única, atualizada, pronta para apresentar à vigilância sanitária.",
    referencia: "RDC 1.002/2025 — Comprovação documental",
    peso: 2,
    pendencia: "Centralizar as evidências em uma pasta única e atualizada.",
  },
  {
    chave: "checklist_diario",
    categoria: "Biossegurança",
    texto: "Existe checklist diário de biossegurança preenchido pela equipe?",
    ajuda: "Rotina de conferência de superfícies, EPIs, insumos e equipamentos.",
    referencia: "RDC 1.002/2025 — Boas práticas de biossegurança",
    peso: 1,
    pendencia: "Implantar checklist diário de biossegurança com comprovação.",
  },
];

export type RespostaFunil = "SIM" | "PARCIAL" | "NAO";

export const VALOR_RESPOSTA: Record<RespostaFunil, number> = {
  SIM: 1,
  PARCIAL: 0.5,
  NAO: 0,
};

export type ResultadoFunil = {
  score: number;
  aplicaveis: number;
  pendencias: { categoria: string; texto: string; referencia: string }[];
  categorias: { categoria: string; score: number }[];
  faixa: { rotulo: string; descricao: string; classe: string };
};

export function faixaFunil(score: number) {
  if (score >= 85)
    return {
      rotulo: "Adequação avançada",
      descricao: "Sua clínica está bem posicionada. O desafio agora é manter e comprovar.",
      classe: "text-emerald-600",
    };
  if (score >= 60)
    return {
      rotulo: "Em adequação",
      descricao: "Boa base, mas há pontos que a fiscalização costuma cobrar.",
      classe: "text-sky-600",
    };
  if (score >= 35)
    return {
      rotulo: "Atenção",
      descricao: "Existem lacunas relevantes de comprovação documental.",
      classe: "text-amber-600",
    };
  return {
    rotulo: "Situação crítica",
    descricao: "A clínica tem pouca comprovação organizada dos requisitos.",
    classe: "text-destructive",
  };
}

export function calcularFunil(respostas: Record<string, RespostaFunil>): ResultadoFunil {
  const respondidas = PERGUNTAS_FUNIL.filter((p) => respostas[p.chave]);
  const pesoTotal = respondidas.reduce((s, p) => s + p.peso, 0);
  const obtido = respondidas.reduce(
    (s, p) => s + p.peso * VALOR_RESPOSTA[respostas[p.chave] as RespostaFunil],
    0,
  );
  const score = pesoTotal ? Math.round((obtido / pesoTotal) * 100) : 0;

  const porCat = new Map<string, { peso: number; obtido: number }>();
  for (const p of respondidas) {
    const atual = porCat.get(p.categoria) ?? { peso: 0, obtido: 0 };
    atual.peso += p.peso;
    atual.obtido += p.peso * VALOR_RESPOSTA[respostas[p.chave] as RespostaFunil];
    porCat.set(p.categoria, atual);
  }

  return {
    score,
    aplicaveis: respondidas.length,
    pendencias: respondidas
      .filter((p) => respostas[p.chave] !== "SIM")
      .map((p) => ({ categoria: p.categoria, texto: p.pendencia, referencia: p.referencia })),
    categorias: [...porCat.entries()]
      .map(([categoria, v]) => ({
        categoria,
        score: Math.round((v.obtido / v.peso) * 100),
      }))
      .sort((a, b) => a.score - b.score),
    faixa: faixaFunil(score),
  };
}

/* ------------------------------------------------------------------ */
/* Persistência do lead (visitante)                                    */
/* ------------------------------------------------------------------ */

export type ContatoLead = {
  nome: string;
  clinica: string;
  email: string;
  whatsapp: string;
  cidade?: string;
  uf?: string;
};

/**
 * Grava o lead do diagnóstico público.
 * O id é gerado aqui e enviado no insert: o visitante é anônimo e não tem
 * permissão de leitura na tabela, então pedir o registro de volta (`.select`)
 * faz o banco recusar a gravação inteira.
 */
export async function salvarDiagnosticoPublico(
  contato: ContatoLead,
  respostas: Record<string, RespostaFunil>,
  resultado: ResultadoFunil,
  utm: Record<string, string>,
): Promise<string | null> {
  const id = novoIdLead();
  const { error } = await supabase.from("rdc_leads").insert({
    id,
    nome: contato.nome || null,
    clinica: contato.clinica || null,
    email: contato.email || null,
    whatsapp: contato.whatsapp || null,
    cidade: contato.cidade || null,
    uf: contato.uf || null,
    respostas,
    score: resultado.score,
    aplicaveis: resultado.aplicaveis,
    pendencias: resultado.pendencias.length,
    categorias: resultado.categorias,
    origem: typeof document !== "undefined" ? document.referrer.slice(0, 200) : null,
    utm,
    etapa: "DIAGNOSTICO_CONCLUIDO",
  });
  if (error) {
    console.warn("Diagnóstico não pôde ser salvo:", error.message);
    return null;
  }
  return id;
}

/** Identificador do lead gerado no navegador (com alternativa quando não há crypto). */
export function novoIdLead(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16);
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function marcarEtapaLead(
  leadId: string | null,
  etapa: "PLANOS_VISTOS" | "CHECKOUT_INICIADO" | "CONVERTIDO",
  planoEscolhido?: string,
): Promise<void> {
  if (!leadId) return;
  await supabase
    .from("rdc_leads")
    .update({
      etapa,
      plano_escolhido: planoEscolhido ?? null,
      convertido_em: etapa === "CONVERTIDO" ? new Date().toISOString() : null,
    })
    .eq("id", leadId);
}

const CHAVE_LEAD = "oxyvra_lead_diagnostico";

export function guardarLeadLocal(id: string, resultado: ResultadoFunil): void {
  try {
    localStorage.setItem(CHAVE_LEAD, JSON.stringify({ id, resultado }));
  } catch {
    /* armazenamento indisponível */
  }
}

export function lerLeadLocal(): { id: string; resultado: ResultadoFunil } | null {
  try {
    const bruto = localStorage.getItem(CHAVE_LEAD);
    return bruto ? (JSON.parse(bruto) as { id: string; resultado: ResultadoFunil }) : null;
  } catch {
    return null;
  }
}
