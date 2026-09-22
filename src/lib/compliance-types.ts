// Tipos e regras puras do módulo de Compliance (biblioteca, checklists, execução, CAPA).
export type TipoResposta = "conforme" | "temperatura" | "numero" | "texto" | "escolha";

export const TIPOS_RESPOSTA: { valor: TipoResposta; label: string }[] = [
  { valor: "conforme", label: "Conforme / Não conforme" },
  { valor: "temperatura", label: "Temperatura (°C)" },
  { valor: "numero", label: "Número / medição" },
  { valor: "texto", label: "Texto livre" },
  { valor: "escolha", label: "Múltipla escolha" },
];

export type ItemChecklist = {
  id?: string;
  ordem: number;
  pergunta: string;
  tipo: TipoResposta;
  critico: boolean;
  foto_obrigatoria: boolean;
  valor_min: number | null;
  valor_max: number | null;
  unidade_medida: string | null;
  opcoes: string[];
  ajuda: string | null;
  /** Trava sanitária: tempo mínimo de contato/recirculação antes de marcar como conforme. */
  dwell_segundos?: number | null;
};

export type RespostaPayload = {
  itemId: string | null;
  pergunta: string;
  tipo: TipoResposta;
  critico: boolean;
  conforme: boolean | null;
  valorNumero: number | null;
  valorTexto: string | null;
  foto: string | null;
  observacao: string | null;
  registradoEm: string;
  lat: number | null;
  lng: number | null;
};

export type ExecucaoPayload = {
  idempotencyKey: string;
  checklistId: string;
  unitId: string;
  executorNome: string;
  iniciadaEm: string;
  lat: number | null;
  lng: number | null;
  dispositivo: string | null;
  assinatura: string | null;
  /** Suíte escaneada por QR Code (motéis / alta rotatividade). */
  suiteId?: string | null;
  qrValidado?: boolean;
  respostas: RespostaPayload[];
};

export function foraDoLimite(
  item: Pick<ItemChecklist, "tipo" | "valor_min" | "valor_max">,
  valor: number | null,
): boolean {
  if (valor === null || Number.isNaN(valor)) return false;
  if (item.tipo !== "temperatura" && item.tipo !== "numero") return false;
  if (item.valor_min !== null && valor < item.valor_min) return true;
  if (item.valor_max !== null && valor > item.valor_max) return true;
  return false;
}

/** Uma resposta é exceção quando reprova item crítico ou sai da faixa aceitável. */
export function ehExcecao(r: RespostaPayload, fora: boolean): boolean {
  if (fora) return true;
  return r.conforme === false;
}

export function exigeFoto(item: ItemChecklist, conforme: boolean | null): boolean {
  return item.foto_obrigatoria || conforme === false;
}

export function novaChaveIdempotencia(): string {
  const rnd = Math.random().toString(36).slice(2, 10);
  return `exec-${Date.now()}-${rnd}`;
}

export function faixaTexto(item: Pick<ItemChecklist, "valor_min" | "valor_max" | "unidade_medida">) {
  const u = item.unidade_medida ?? "";
  if (item.valor_min !== null && item.valor_max !== null)
    return `Faixa aceitável: ${item.valor_min} a ${item.valor_max} ${u}`.trim();
  if (item.valor_min !== null) return `Mínimo: ${item.valor_min} ${u}`.trim();
  if (item.valor_max !== null) return `Máximo: ${item.valor_max} ${u}`.trim();
  return "";
}

export const STATUS_ORG: Record<string, { label: string; liberado: boolean }> = {
  trial: { label: "Período de teste", liberado: true },
  ativo: { label: "Assinatura ativa", liberado: true },
  inadimplente: { label: "Pagamento em atraso", liberado: false },
  bloqueado: { label: "Acesso bloqueado", liberado: false },
  cancelado: { label: "Assinatura cancelada", liberado: false },
};

export function diasRestantesTrial(trialExpiraEm: string): number {
  const ms = new Date(trialExpiraEm).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function organizacaoLiberada(org: { status: string; trial_expira_em: string }): boolean {
  if (org.status === "trial") return diasRestantesTrial(org.trial_expira_em) > 0;
  return STATUS_ORG[org.status]?.liberado ?? false;
}

/** Formata o tempo de trava sanitária de um item (mm:ss). */
export function formatarDwell(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
