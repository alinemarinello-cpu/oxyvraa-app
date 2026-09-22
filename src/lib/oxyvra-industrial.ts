// Oxyvra — Módulo Multi-Vertical B2G/B2B Industrial (PPOH, alérgenos, não-conformidade).
// Persistência local (localStorage), compatível com o núcleo em oxyvra-store.ts.

import { useSyncExternalStore } from "react";
import type { CorLimpeza, Prefeitura, Unit, UnitTipo, Vertical } from "./oxyvra-store";

// ============================================================
// 1. VerticalType — hierarquia flexível B2G / B2B
// ============================================================

export type VerticalType =
  | "B2G_EDUCATION"
  | "B2G_HEALTH"
  | "B2B_FOOD_INDUSTRY"
  | "B2B_PHARMA"
  | "B2B_GENERAL";

export type HierarquiaLabels = {
  n1: string; // Organização
  n2: string; // Município / Planta
  n3: string; // Unidade / Linha de produção
  n4: string; // Setor / Equipamento-Zona
};

export type VerticalMeta = {
  id: VerticalType;
  label: string;
  descricao: string;
  emoji: string;
  contexto: "B2G" | "B2B";
  ppoh: boolean; // habilita módulo PPOH + alérgenos
  hierarquia: HierarquiaLabels;
  verticalLegado: Vertical;
};

export const VERTICAL_TYPE_META: Record<VerticalType, VerticalMeta> = {
  B2G_EDUCATION: {
    id: "B2G_EDUCATION",
    label: "Rede Educacional (B2G)",
    descricao: "Escolas, creches e berçários municipais",
    emoji: "🏫",
    contexto: "B2G",
    ppoh: false,
    hierarquia: { n1: "Organização", n2: "Município", n3: "Unidade", n4: "Setor" },
    verticalLegado: "educacional",
  },
  B2G_HEALTH: {
    id: "B2G_HEALTH",
    label: "Rede de Saúde (B2G)",
    descricao: "UBS, clínicas e prontos-atendimentos públicos",
    emoji: "🏥",
    contexto: "B2G",
    ppoh: false,
    hierarquia: { n1: "Organização", n2: "Município", n3: "Unidade (UBS)", n4: "Setor" },
    verticalLegado: "educacional",
  },
  B2B_FOOD_INDUSTRY: {
    id: "B2B_FOOD_INDUSTRY",
    label: "Indústria Alimentícia (B2B)",
    descricao: "Frigoríficos e plantas de alimentos — padrão SIF/MAPA",
    emoji: "🏭",
    contexto: "B2B",
    ppoh: true,
    hierarquia: {
      n1: "Organização",
      n2: "Planta / Fábrica",
      n3: "Linha de Produção",
      n4: "Equipamento / Zona PPOH",
    },
    verticalLegado: "industria_alimenticia",
  },
  B2B_PHARMA: {
    id: "B2B_PHARMA",
    label: "Indústria Farmacêutica (B2B)",
    descricao: "Salas limpas e áreas classificadas — padrão ANVISA/BPF",
    emoji: "💊",
    contexto: "B2B",
    ppoh: true,
    hierarquia: {
      n1: "Organização",
      n2: "Planta / Fábrica",
      n3: "Linha de Produção",
      n4: "Equipamento / Sala Classificada",
    },
    verticalLegado: "industria_alimenticia",
  },
  B2B_GENERAL: {
    id: "B2B_GENERAL",
    label: "Indústria Geral / Corporativo (B2B)",
    descricao: "Plantas industriais e ambientes corporativos",
    emoji: "🏢",
    contexto: "B2B",
    ppoh: true,
    hierarquia: {
      n1: "Organização",
      n2: "Planta / Unidade",
      n3: "Área Operacional",
      n4: "Equipamento / Zona",
    },
    verticalLegado: "industria_alimenticia",
  },
};

export const VERTICAL_TYPES: VerticalType[] = [
  "B2G_EDUCATION",
  "B2G_HEALTH",
  "B2B_FOOD_INDUSTRY",
  "B2B_PHARMA",
  "B2B_GENERAL",
];

/** Migra o campo legado `vertical` para o novo `VerticalType`. */
export function verticalTypeFromLegacy(v: Vertical | undefined, tipo?: UnitTipo): VerticalType {
  if (v === "industria_alimenticia") return "B2B_FOOD_INDUSTRY";
  if (tipo === "clinica") return "B2G_HEALTH";
  if (tipo === "industria") return "B2B_FOOD_INDUSTRY";
  return "B2G_EDUCATION";
}

/** VerticalType efetivo de uma unidade (prefeitura/organização tem precedência). */
export function getVerticalType(
  unit?: Unit | null,
  prefeitura?: Prefeitura | null,
): VerticalType {
  const explicito = (prefeitura as { verticalType?: VerticalType } | null | undefined)?.verticalType;
  if (explicito && VERTICAL_TYPE_META[explicito]) return explicito;
  return verticalTypeFromLegacy(prefeitura?.vertical, unit?.tipo);
}

export function isPpoh(vt: VerticalType): boolean {
  return VERTICAL_TYPE_META[vt].ppoh;
}

export function labelsDe(vt: VerticalType): HierarquiaLabels {
  return VERTICAL_TYPE_META[vt].hierarquia;
}

// ============================================================
// 2. PPOH — tipos de limpeza
// ============================================================

export type TipoLimpeza = "pre_operacional" | "troca_lote" | "pos_operacional" | "cip" | "cop";

export type TipoLimpezaMeta = {
  id: TipoLimpeza;
  label: string;
  descricao: string;
  emoji: string;
  dwellSeg: number; // tempo de contato microbiológico obrigatório
  checklist: string[];
};

export const TIPO_LIMPEZA_META: Record<TipoLimpeza, TipoLimpezaMeta> = {
  pre_operacional: {
    id: "pre_operacional",
    label: "Pré-operacional",
    descricao: "Liberação de turno / linha antes da produção",
    emoji: "🟢",
    dwellSeg: 300,
    checklist: [
      "Remover resíduos visíveis do equipamento",
      "Enxágue inicial com água potável",
      "Aplicar sanificante na diluição correta",
      "Inspeção visual de superfícies de contato",
      "Registro de liberação da linha",
    ],
  },
  troca_lote: {
    id: "troca_lote",
    label: "Troca de Lote / Sabor",
    descricao: "Sanitização entre lotes para evitar contaminação cruzada",
    emoji: "🔄",
    dwellSeg: 420,
    checklist: [
      "Retirar totalmente o produto do lote anterior",
      "Verificar tags de alérgenos da zona",
      "Higienizar com kit de cor compatível",
      "Enxágue e teste de resíduo de alérgeno (swab)",
      "Liberar troca com registro fotográfico",
    ],
  },
  pos_operacional: {
    id: "pos_operacional",
    label: "Pós-operacional",
    descricao: "Higienização profunda no final do turno",
    emoji: "🌙",
    dwellSeg: 600,
    checklist: [
      "Desmontar partes removíveis do equipamento",
      "Limpeza mecânica com detergente alcalino",
      "Aplicar sanificante (ácido peracético / quaternário)",
      "Respeitar tempo de contato integral",
      "Secagem e remontagem sanitária",
    ],
  },
  cip: {
    id: "cip",
    label: "CIP (Clean-in-Place)",
    descricao: "Circuito fechado sem desmontagem",
    emoji: "🔁",
    dwellSeg: 900,
    checklist: [
      "Conferir circuito e válvulas fechadas",
      "Pré-enxágue com água a temperatura definida",
      "Circulação de solução alcalina",
      "Circulação de sanificante e tempo de contato",
      "Enxágue final e registro de condutividade",
    ],
  },
  cop: {
    id: "cop",
    label: "COP (Clean-out-of-Place)",
    descricao: "Peças desmontadas higienizadas em tanque",
    emoji: "🧴",
    dwellSeg: 720,
    checklist: [
      "Desmontar e identificar as peças",
      "Imersão em tanque com detergente",
      "Escovação mecânica das superfícies",
      "Imersão em sanificante pelo tempo de contato",
      "Secagem e armazenagem sanitária",
    ],
  },
};

export const TIPOS_LIMPEZA: TipoLimpeza[] = [
  "pre_operacional",
  "troca_lote",
  "pos_operacional",
  "cip",
  "cop",
];

// ============================================================
// 3. Alérgenos e trava de contaminação cruzada
// ============================================================

export type Alergeno =
  | "gluten"
  | "lactose"
  | "amendoim"
  | "ovos"
  | "soja"
  | "castanhas"
  | "frutos_do_mar";

export const ALERGENO_META: Record<Alergeno, { label: string; emoji: string }> = {
  gluten: { label: "Glúten", emoji: "🌾" },
  lactose: { label: "Lactose", emoji: "🥛" },
  amendoim: { label: "Amendoim", emoji: "🥜" },
  ovos: { label: "Ovos", emoji: "🥚" },
  soja: { label: "Soja", emoji: "🫘" },
  castanhas: { label: "Castanhas", emoji: "🌰" },
  frutos_do_mar: { label: "Frutos do Mar", emoji: "🦐" },
};

export const ALERGENOS: Alergeno[] = [
  "gluten",
  "lactose",
  "amendoim",
  "ovos",
  "soja",
  "castanhas",
  "frutos_do_mar",
];

/**
 * Kits (cor) dedicados a zonas de alérgeno. Um kit só pode entrar numa zona
 * quando cobre todos os alérgenos declarados naquele equipamento.
 */
export const KIT_ALERGENOS: Record<CorLimpeza, Alergeno[]> = {
  azul: [], // kit livre de alérgenos — áreas sem contato com alérgeno
  verde: ["gluten", "soja"],
  vermelho: ["lactose", "ovos"],
  amarelo: ["amendoim", "castanhas", "frutos_do_mar"],
  branco: [], // kit de lavatório / barreira sanitária
};

export type ChecagemAlergeno = {
  bloqueado: boolean;
  faltantes: Alergeno[];
  mensagem: string;
};

/** Verifica compatibilidade entre o kit escaneado e a zona de alérgenos. */
export function checarAlergenos(
  corKit: CorLimpeza | undefined,
  alergenosZona: Alergeno[] | undefined,
): ChecagemAlergeno {
  const zona = alergenosZona ?? [];
  if (zona.length === 0) {
    return { bloqueado: false, faltantes: [], mensagem: "Zona sem alérgenos declarados." };
  }
  if (!corKit) {
    return {
      bloqueado: true,
      faltantes: zona,
      mensagem: "Kit de higienização não identificado para uma zona com alérgenos.",
    };
  }
  const cobertos = KIT_ALERGENOS[corKit] ?? [];
  const faltantes = zona.filter((a) => !cobertos.includes(a));
  if (faltantes.length === 0) {
    return { bloqueado: false, faltantes: [], mensagem: "Kit compatível com a zona." };
  }
  return {
    bloqueado: true,
    faltantes,
    mensagem: `RISCO DE CONTAMINAÇÃO CRUZADA: o kit ${corKit.toUpperCase()} não é liberado para ${faltantes
      .map((a) => ALERGENO_META[a].label)
      .join(", ")}.`,
  };
}

// ============================================================
// 4. Não-conformidade / Linha bloqueada / Ação corretiva
// ============================================================

export type NcOrigem =
  | "dwell_cancelado"
  | "foto_reprovada"
  | "checklist_falhou"
  | "alergeno_incompativel"
  | "manual";

export const NC_ORIGEM_META: Record<NcOrigem, { label: string; emoji: string }> = {
  dwell_cancelado: { label: "Dwell-time cancelado", emoji: "⏱️" },
  foto_reprovada: { label: "Foto reprovada pelo supervisor", emoji: "📷" },
  checklist_falhou: { label: "Checklist não concluído", emoji: "📋" },
  alergeno_incompativel: { label: "Kit incompatível com alérgeno", emoji: "☣️" },
  manual: { label: "Abertura manual (QA)", emoji: "✍️" },
};

export type NcStatus = "bloqueada" | "em_acao" | "liberada";

export type NaoConformidade = {
  id: string;
  unitId: string;
  prefeituraId: string;
  localId?: string;
  localNome: string;
  origem: NcOrigem;
  descricao: string;
  cleaningId?: string;
  status: NcStatus;
  abertaEm: number;
  responsavelQa?: string;
  acaoCorretiva?: string;
  rehigienizacaoCleaningId?: string;
  liberadaEm?: number;
  liberadaPorPin?: string;
  notificacaoQa?: { destino: string; enviadaEm: number; canal: "email" | "painel" };
};

const NC_KEY = "oxyvra:v3:naoConformidades";

function isBrowser() {
  return typeof window !== "undefined";
}

const listeners = new Set<() => void>();

function emit() {
  if (!isBrowser()) return;
  listeners.forEach((l) => l());
  window.dispatchEvent(new Event("oxyvra:update"));
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (isBrowser()) window.addEventListener("oxyvra:update", l);
  return () => {
    listeners.delete(l);
    if (isBrowser()) window.removeEventListener("oxyvra:update", l);
  };
}

function readNcs(): NaoConformidade[] {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(NC_KEY) ?? "[]") as NaoConformidade[];
  } catch {
    return [];
  }
}

function writeNcs(list: NaoConformidade[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(NC_KEY, JSON.stringify(list));
  emit();
}

export function getNaoConformidades(unitId?: string): NaoConformidade[] {
  const all = readNcs().sort((a, b) => b.abertaEm - a.abertaEm);
  return unitId ? all.filter((n) => n.unitId === unitId) : all;
}

export function abrirNaoConformidade(input: {
  unitId: string;
  prefeituraId: string;
  localId?: string;
  localNome: string;
  origem: NcOrigem;
  descricao: string;
  cleaningId?: string;
  responsavelQa?: string;
}): NaoConformidade {
  const nc: NaoConformidade = {
    id: `nc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: "bloqueada",
    abertaEm: Date.now(),
    acaoCorretiva: "Re-higienização completa obrigatória para liberação da linha.",
    notificacaoQa: input.responsavelQa
      ? { destino: input.responsavelQa, enviadaEm: Date.now(), canal: "painel" }
      : { destino: "QA / QC", enviadaEm: Date.now(), canal: "painel" },
    ...input,
  };
  writeNcs([...readNcs(), nc]);
  return nc;
}

export function atualizarNaoConformidade(id: string, patch: Partial<NaoConformidade>) {
  writeNcs(readNcs().map((n) => (n.id === id ? { ...n, ...patch } : n)));
}

export function iniciarAcaoCorretiva(id: string, acao: string, responsavel?: string) {
  atualizarNaoConformidade(id, { status: "em_acao", acaoCorretiva: acao, responsavelQa: responsavel });
}

export function liberarLinha(id: string, pin: string, cleaningId?: string) {
  atualizarNaoConformidade(id, {
    status: "liberada",
    liberadaEm: Date.now(),
    liberadaPorPin: pin,
    rehigienizacaoCleaningId: cleaningId,
  });
}

export function deleteNaoConformidade(id: string) {
  writeNcs(readNcs().filter((n) => n.id !== id));
}

/** Linha/equipamento está bloqueado quando existe NC aberta para ele. */
export function isLocalBloqueado(localId: string | undefined): NaoConformidade | null {
  if (!localId) return null;
  return (
    readNcs().find((n) => n.localId === localId && n.status !== "liberada") ?? null
  );
}

// Cache de snapshot: useSyncExternalStore exige referência estável.
const snapCache = new Map<string, { raw: string; value: NaoConformidade[] }>();

function snapshot(unitId?: string): NaoConformidade[] {
  const key = unitId ?? "__all__";
  const raw = isBrowser() ? window.localStorage.getItem(NC_KEY) ?? "[]" : "[]";
  const cached = snapCache.get(key);
  if (cached && cached.raw === raw) return cached.value;
  const value = getNaoConformidades(unitId);
  snapCache.set(key, { raw, value });
  return value;
}

const EMPTY_NCS: NaoConformidade[] = [];

export function useNaoConformidades(unitId?: string): NaoConformidade[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(unitId),
    () => EMPTY_NCS,
  );
}
