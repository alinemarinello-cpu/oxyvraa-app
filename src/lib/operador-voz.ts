// Voz para o módulo de campo: leitura das tarefas (TTS) e ditado de problemas (STT).
// Tudo roda no aparelho, sem depender de internet.

export function suporteFala(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function falar(texto: string) {
  if (!suporteFala() || !texto.trim()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {
    /* leitura em voz é opcional */
  }
}

export function pararFala() {
  if (!suporteFala()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function ctorReconhecimento(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function suporteDitado(): boolean {
  return ctorReconhecimento() !== null;
}

export type Ditado = { parar: () => void };

/** Inicia o ditado em pt-BR. Retorna null quando o aparelho não suporta. */
export function iniciarDitado(handlers: {
  onTexto: (texto: string) => void;
  onErro?: (msg: string) => void;
  onFim?: () => void;
}): Ditado | null {
  const Ctor = ctorReconhecimento();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "pt-BR";
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = (e) => {
    let texto = "";
    for (let i = 0; i < e.results.length; i++) texto += `${e.results[i][0].transcript} `;
    handlers.onTexto(texto.trim());
  };
  rec.onerror = (e) =>
    handlers.onErro?.(
      e.error === "not-allowed"
        ? "Permissão de microfone negada. Libere o microfone e tente de novo."
        : "Não consegui ouvir. Fale novamente ou escreva o problema.",
    );
  rec.onend = () => handlers.onFim?.();
  try {
    rec.start();
  } catch {
    return null;
  }
  return { parar: () => rec.stop() };
}
