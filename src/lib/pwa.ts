// Registro único e protegido do service worker (offline no app publicado/nativo).
// Nunca registra em dev, iframe ou previews da Lovable.

const SW_URL = "/sw.js";

function hostBloqueado(host: string): boolean {
  return (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

async function desregistrar() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").includes(SW_URL))
      .map((r) => r.unregister()),
  );
}

/** Chamar uma única vez, no root, dentro de useEffect. */
export function registrarServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const emIframe = window.self !== window.top;
  const swOff = new URLSearchParams(window.location.search).get("sw") === "off";
  const bloqueado =
    !import.meta.env.PROD || emIframe || swOff || hostBloqueado(window.location.hostname);

  if (bloqueado) {
    void desregistrar();
    return;
  }

  void navigator.serviceWorker.register(SW_URL, { scope: "/" }).catch(() => {
    /* offline continua funcionando com os dados locais */
  });
}
