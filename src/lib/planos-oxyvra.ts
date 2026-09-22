// Matriz de planos, add-on de insumos e feature flags do Oxyvra Conformidade.
// Puro: pode ser importado no cliente e no servidor.

export type PlanoId = "CONSULTORIO" | "CLINICA";
export type CicloCobranca = "MONTHLY" | "ANNUAL";
export type StatusAssinatura = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";

export type RecursoOxyvra =
  | "rdc_1002"
  | "autoclave"
  | "teste_biologico"
  | "checklist_gps"
  | "alertas_whatsapp"
  | "dossie_pdf"
  | "selo_publico"
  | "multi_salas"
  | "offline_sync"
  | "assinatura_hash"
  | "suporte_prioritario";

export type Plano = {
  id: PlanoId;
  nome: string;
  resumo: string;
  unidadesPermitidas: number;
  precoMensal: number;
  /** Valor equivalente por mês no plano anual. */
  precoAnualMensalizado: number;
  /** Cobrança anual à vista. */
  precoAnualTotal: number;
  priceIdMensal: string;
  priceIdAnual: string;
  recursos: RecursoOxyvra[];
  destaques: string[];
};

export const PLANOS: Plano[] = [
  {
    id: "CONSULTORIO",
    nome: "Oxyvra Conformidade",
    resumo: "1 cadeira / 1 unidade",
    unidadesPermitidas: 1,
    precoMensal: 134,
    precoAnualMensalizado: 1340 / 12,
    precoAnualTotal: 1340,
    priceIdMensal: "oxyvra_conformidade_mensal",
    priceIdAnual: "oxyvra_conformidade_anual",
    recursos: [
      "rdc_1002",
      "autoclave",
      "teste_biologico",
      "checklist_gps",
      "alertas_whatsapp",
      "dossie_pdf",
      "selo_publico",
    ],
    destaques: [
      "Desenvolvido com base nos requisitos aplicáveis da RDC Anvisa nº 1.002/2025",
      "Gestão de autoclaves com os 7 campos obrigatórios",
      "Testes biológicos semanais com foto",
      "Checklists diários com foto e GPS",
      "Alertas automáticos no WhatsApp",
      "Dossiê “Pasta da Vigilância” em PDF sem marca d’água",
      "Selo digital com QR Code público",
    ],
  },
  {
    id: "CLINICA",
    nome: "Oxyvra Clínica",
    resumo: "até 4 cadeiras / multi-equipe",
    unidadesPermitidas: 4,
    precoMensal: 188,
    precoAnualMensalizado: 1880 / 12,
    precoAnualTotal: 1880,
    priceIdMensal: "oxyvra_clinica_plano_mensal",
    priceIdAnual: "oxyvra_clinica_plano_anual",
    recursos: [
      "rdc_1002",
      "autoclave",
      "teste_biologico",
      "checklist_gps",
      "alertas_whatsapp",
      "dossie_pdf",
      "selo_publico",
      "multi_salas",
      "offline_sync",
      "assinatura_hash",
      "suporte_prioritario",
    ],
    destaques: [
      "Tudo do plano Conformidade",
      "Até 4 cadeiras / equipos com QR individual",
      "Modo offline com sincronização em segundo plano",
      "Assinatura digital do PDF com hash SHA-256",
      "Verificação pública de integridade do dossiê",
      "Suporte prioritário",
    ],
  },
];

/** Add-on opcional marcado no checkout: kit mensal de insumos odontológicos.
 *  O valor final é calculado por cadeira/equipo odontológico (chairsCount). */
export const ADDON_INSUMOS = {
  nome: "Kit Mensal de Insumos Hospitalares para Odontologia",
  precoPorCadeiraMensal: 260,
  precoPorCadeiraAnualMensalizado: 220,
  precoPorCadeiraAnualTotal: 2640,
  priceIdMensal: "oxyvra_kit_insumos_mensal",
  priceIdAnual: "oxyvra_kit_insumos_anual",
  itens: [
    {
      nome: "Desinfetante de Superfícies",
      detalhe: "Alto nível, ação virucida e bactericida",
    },
    {
      nome: "Detergente Enzimático",
      detalhe: "Limpeza e remoção de matéria orgânica",
    },
    {
      nome: "Indicadores Químicos (Classe 5/6)",
      detalhe: "Tiras integradoras para autoclave",
    },
    {
      nome: "Indicadores Biológicos",
      detalhe: "Ampolas de Geobacillus stearothermophilus",
    },
    {
      nome: "Wipes Desinfetantes",
      detalhe: "Lenços umedecidos hospitalares de pronto uso",
    },
  ],
} as const;

/** Valor total do add-on de insumos para a quantidade de cadeiras informada. */
export function valorAddonInsumos(ciclo: CicloCobranca, cadeiras: number): number {
  const qtd = Math.max(1, Math.round(cadeiras || 1));
  return ciclo === "ANNUAL"
    ? ADDON_INSUMOS.precoPorCadeiraAnualMensalizado * qtd
    : ADDON_INSUMOS.precoPorCadeiraMensal * qtd;
}

/** Valor anual total do add-on (12x) para a quantidade de cadeiras informada. */
export function valorAddonAnualTotal(cadeiras: number): number {
  const qtd = Math.max(1, Math.round(cadeiras || 1));
  return ADDON_INSUMOS.precoPorCadeiraAnualTotal * qtd;
}

export function planoPorId(id: string | null | undefined): Plano {
  return PLANOS.find((p) => p.id === id) ?? PLANOS[0]!;
}

export function priceIdDoPlano(id: PlanoId, ciclo: CicloCobranca): string {
  const p = planoPorId(id);
  return ciclo === "ANNUAL" ? p.priceIdAnual : p.priceIdMensal;
}

export function priceIdDoAddon(ciclo: CicloCobranca): string {
  return ciclo === "ANNUAL" ? ADDON_INSUMOS.priceIdAnual : ADDON_INSUMOS.priceIdMensal;
}

/** Todos os price IDs conhecidos → plano, ciclo e se é o add-on. */
export const MAPA_PRECOS: Record<
  string,
  { plano?: PlanoId; ciclo: CicloCobranca; addon?: boolean }
> = {
  oxyvra_conformidade_mensal: { plano: "CONSULTORIO", ciclo: "MONTHLY" },
  oxyvra_conformidade_anual: { plano: "CONSULTORIO", ciclo: "ANNUAL" },
  // Preços anteriores mantidos para assinaturas já existentes.
  oxyvra_consultorio_mensal: { plano: "CONSULTORIO", ciclo: "MONTHLY" },
  oxyvra_consultorio_anual: { plano: "CONSULTORIO", ciclo: "ANNUAL" },
  oxyvra_clinica_plano_mensal: { plano: "CLINICA", ciclo: "MONTHLY" },
  oxyvra_clinica_plano_anual: { plano: "CLINICA", ciclo: "ANNUAL" },
  oxyvra_kit_insumos_mensal: { addon: true, ciclo: "MONTHLY" },
  oxyvra_kit_insumos_anual: { addon: true, ciclo: "ANNUAL" },
};

export const STATUS_LABEL: Record<StatusAssinatura, string> = {
  TRIALING: "Período de teste",
  ACTIVE: "Assinatura ativa",
  PAST_DUE: "Pagamento em atraso",
  CANCELED: "Assinatura cancelada",
};

export type AssinaturaResumo = {
  plano: PlanoId;
  status: StatusAssinatura;
  ciclo: CicloCobranca;
  kit_insumos: boolean;
  unidades_permitidas: number;
  cadeiras: number;
  trial_fim: string;
  periodo_fim: string | null;
};

export function diasRestantes(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** Trial válido = status de teste e prazo não vencido. */
export function trialAtivo(a: Pick<AssinaturaResumo, "status" | "trial_fim">): boolean {
  return a.status === "TRIALING" && diasRestantes(a.trial_fim) > 0;
}

/** Conta liberada para operar (teste válido ou assinatura paga). */
export function contaLiberada(a: AssinaturaResumo | null): boolean {
  if (!a) return false;
  if (a.status === "ACTIVE") return true;
  if (a.status === "PAST_DUE") return true; // acesso mantido durante a régua de cobrança
  return trialAtivo(a);
}

/** PDFs saem com a marca d'água de teste enquanto não houver assinatura paga. */
export function exigeMarcaDaguaTeste(a: AssinaturaResumo | null): boolean {
  if (!a) return true;
  return a.status !== "ACTIVE";
}

/** Selo digital público só é ativado com assinatura ACTIVE. */
export function seloPublicoAtivo(a: AssinaturaResumo | null): boolean {
  return a?.status === "ACTIVE";
}

/** Feature gating: recurso liberado pelo plano (liberado por completo no trial). */
export function recursoLiberado(a: AssinaturaResumo | null, recurso: RecursoOxyvra): boolean {
  if (!a) return false;
  if (trialAtivo(a)) return true; // trial dá acesso completo ao Consultório + avaliação
  if (a.status !== "ACTIVE" && a.status !== "PAST_DUE") return false;
  return planoPorId(a.plano).recursos.includes(recurso);
}

export function limiteUnidades(a: AssinaturaResumo | null): number {
  if (!a) return 1;
  return a.unidades_permitidas || planoPorId(a.plano).unidadesPermitidas;
}

export function brl(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ------------------------------------------------------------------ */
/* Serviços complementares (arquitetura preparada para venda futura)   */
/* Os itens vivem na tabela servicos_catalogo e podem ser ativados     */
/* pelo administrador sem alteração de código.                         */
/* ------------------------------------------------------------------ */

export type ServicoCatalogo = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  tipo: "SERVICO" | "ADDON" | string;
  preco: number | null;
  unidade_cobranca: string;
  price_id: string | null;
  ativo: boolean;
  ordem: number;
};

export const UNIDADES_COBRANCA = ["PROJETO", "HORA", "TURMA", "UNIDADE", "MES"] as const;
