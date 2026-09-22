import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OAuthDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
  denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: Error | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Requisição de autorização inválida.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(id);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <p className="text-sm font-bold text-red-600">
        Não foi possível carregar esta autorização: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nome = details?.client?.name ?? "um aplicativo";

  async function decidir(aprovar: boolean) {
    setBusy(true);
    setErro(null);
    const api = oauthApi();
    const { data, error } = aprovar
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setErro(error.message);
      return;
    }
    const destino = data?.redirect_url ?? data?.redirect_to;
    if (!destino) {
      setBusy(false);
      setErro("O servidor de autorização não retornou um redirecionamento.");
      return;
    }
    window.location.href = destino;
  }

  return (
    <main className="min-h-screen bg-secondary flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-black text-navy">Conectar {nome}</h1>
        </div>
        <p className="text-sm text-navy/70">
          Ao aprovar, {nome} poderá usar as ferramentas Oxyvra em seu nome, com as mesmas permissões
          da sua conta.
        </p>
        {erro && <p className="text-xs font-bold text-red-600">{erro}</p>}
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => void decidir(true)}
            className="flex-1 rounded-xl bg-navy text-gold font-black px-4 py-3 text-sm disabled:opacity-50"
          >
            Aprovar
          </button>
          <button
            disabled={busy}
            onClick={() => void decidir(false)}
            className="flex-1 rounded-xl border-2 border-navy/15 text-navy font-black px-4 py-3 text-sm disabled:opacity-50"
          >
            Recusar
          </button>
        </div>
      </div>
    </main>
  );
}
