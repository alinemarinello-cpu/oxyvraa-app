// Eventos de conversão do funil Oxyvra (Google Ads / GA4 / Meta).
// Não coleta dados de paciente. Só dispara no navegador.

export type EventoFunil =
  | "page_view"
  | "diagnostic_started"
  | "diagnostic_completed"
  | "pricing_viewed"
  | "checkout_started"
  | "purchase";

/** Nome equivalente no Meta Pixel (quando existe evento padrão). */
const META_PADRAO: Partial<Record<EventoFunil, string>> = {
  page_view: "PageView",
  diagnostic_started: "Lead",
  diagnostic_completed: "CompleteRegistration",
  pricing_viewed: "ViewContent",
  checkout_started: "InitiateCheckout",
  purchase: "Purchase",
};

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function evento(nome: EventoFunil, params: Params = {}): void {
  if (typeof window === "undefined") return;
  const dados = { evento: nome, ...params };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: nome, ...params });

  window.gtag?.("event", nome, params);

  const meta = META_PADRAO[nome];
  if (meta) window.fbq?.("track", meta, params);
  else window.fbq?.("trackCustom", nome, params);

  if (import.meta.env.DEV) console.debug("[funil]", dados);
}

/** Parâmetros de campanha da URL atual (utm_*, gclid, fbclid). */
export function capturarUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const saida: Record<string, string> = {};
  for (const chave of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "fbclid",
  ]) {
    const v = p.get(chave);
    if (v) saida[chave] = v.slice(0, 120);
  }
  return saida;
}
