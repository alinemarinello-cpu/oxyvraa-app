// Orquestra o funcionamento offline: tudo é gravado no aparelho e a fila
// dispara a sincronização completa com a nuvem assim que houver internet.
import {
  configurarEnviador,
  iniciarSincronizacaoAutomatica,
  estaOnline,
  listarFila,
} from "@/lib/oxyvra-offline";
import { sincronizarNuvem } from "@/lib/oxyvra-cloud";

let ultimaExecucao = 0;
let emAndamento: Promise<void> | null = null;

/**
 * Qualquer item pendente aciona a mesma rotina: o envio completo do que existe
 * no aparelho (unidades, equipes, limpezas, fotos, intercorrências, financeiro).
 * A promessa é compartilhada para não subir os mesmos dados várias vezes.
 */
async function enviarTudo(): Promise<void> {
  if (emAndamento) return emAndamento;
  emAndamento = (async () => {
    const r = await sincronizarNuvem();
    if (r.erro) throw new Error(r.erro);
    ultimaExecucao = Date.now();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("oxyvra:ultima-sync", new Date().toLocaleString("pt-BR"));
    }
  })().finally(() => {
    emAndamento = null;
  });
  return emAndamento;
}

/** Chamar uma vez no root. Liga a fila offline ao backend. */
export function iniciarOffline() {
  if (typeof window === "undefined") return;
  configurarEnviador(async () => {
    await enviarTudo();
  });
  iniciarSincronizacaoAutomatica();
}

/** Sincroniza sob demanda (botão "enviar agora"). */
export async function enviarAgora(): Promise<{ ok: boolean; erro?: string }> {
  if (!estaOnline()) return { ok: false, erro: "Sem internet no momento." };
  try {
    await enviarTudo();
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Falha ao enviar." };
  }
}

export async function contarPendentes(): Promise<number> {
  return (await listarFila()).length;
}

export function ultimaSincronizacao(): number {
  return ultimaExecucao;
}
