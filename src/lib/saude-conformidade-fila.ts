// Fila offline do módulo Saúde e Estética: o checklist é gravado no aparelho e
// sobe sozinho quando a internet voltar (consultórios com sinal fraco).
import { registrarChecklist, type EntradaChecklist } from "@/lib/saude-conformidade-db";

const CHAVE = "oxyvra:saude-pendentes";

type Pendente = EntradaChecklist & { fila_id: string };

function ler(): Pendente[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAVE);
    return raw ? (JSON.parse(raw) as Pendente[]) : [];
  } catch {
    return [];
  }
}

function gravar(lista: Pendente[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify(lista));
  ouvintes.forEach((o) => o());
}

const ouvintes = new Set<() => void>();

export function aoMudarFilaSaude(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function enfileirarChecklist(e: EntradaChecklist) {
  gravar([...ler(), { ...e, fila_id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }]);
}

export function contarPendentesSaude(): number {
  return ler().length;
}

/** Salva na nuvem; se falhar (offline), guarda no aparelho. */
export async function salvarChecklistComFila(e: EntradaChecklist): Promise<"nuvem" | "aparelho"> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    enfileirarChecklist(e);
    return "aparelho";
  }
  try {
    await registrarChecklist(e);
    return "nuvem";
  } catch {
    enfileirarChecklist(e);
    return "aparelho";
  }
}

export async function reenviarPendentesSaude(): Promise<number> {
  if (typeof window === "undefined" || navigator.onLine === false) return 0;
  let ok = 0;
  for (const item of ler()) {
    try {
      const { fila_id, ...payload } = item;
      await registrarChecklist(payload);
      gravar(ler().filter((x) => x.fila_id !== fila_id));
      ok++;
    } catch {
      break;
    }
  }
  return ok;
}
