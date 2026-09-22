// Fila offline das execuções de checklist: grava no aparelho e envia quando houver internet.
import type { ExecucaoPayload } from "@/lib/compliance-types";

const CHAVE = "oxyvra:execucoes-pendentes";

function ler(): ExecucaoPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAVE);
    return raw ? (JSON.parse(raw) as ExecucaoPayload[]) : [];
  } catch {
    return [];
  }
}

function gravar(lista: ExecucaoPayload[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify(lista));
}

export function enfileirarExecucao(p: ExecucaoPayload) {
  gravar([...ler().filter((x) => x.idempotencyKey !== p.idempotencyKey), p]);
}

export function pendentes(): ExecucaoPayload[] {
  return ler();
}

export function contarPendentesExecucao(): number {
  return ler().length;
}

/** Reenvia tudo o que ficou pendente. `enviar` deve ser idempotente. */
export async function reenviarPendentes(
  enviar: (p: ExecucaoPayload) => Promise<unknown>,
): Promise<number> {
  if (typeof window === "undefined" || navigator.onLine === false) return 0;
  let ok = 0;
  for (const item of ler()) {
    try {
      await enviar(item);
      gravar(ler().filter((x) => x.idempotencyKey !== item.idempotencyKey));
      ok++;
    } catch {
      break;
    }
  }
  return ok;
}
