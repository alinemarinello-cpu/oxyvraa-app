import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Criar nova senha — Oxyvra" },
      {
        name: "description",
        content: "Defina uma nova senha para acessar sua conta Oxyvra com segurança.",
      },
      { property: "og:title", content: "Criar nova senha — Oxyvra" },
      { property: "og:description", content: "Defina uma nova senha da sua conta Oxyvra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaSenha,
});

function NovaSenha() {
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) setPronto(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      setOk(true);
    } catch (e2) {
      setErro(e2 instanceof Error ? e2.message : "Não foi possível alterar a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-secondary px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <h1 className="text-center text-2xl font-black text-navy">Criar nova senha</h1>

        {ok ? (
          <div className="space-y-3 rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy">
            <p className="font-black">Senha alterada com sucesso.</p>
            <Link
              to="/auth"
              className="inline-flex rounded-xl bg-navy px-4 py-2.5 text-sm font-black text-gold"
            >
              Entrar agora
            </Link>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-navy/10 bg-white p-6">
            {!pronto && (
              <p className="text-xs font-bold text-navy/60">
                Abra esta página pelo link que enviamos no seu e-mail para poder trocar a senha.
              </p>
            )}
            <label className="block text-xs font-bold text-navy/70">
              Nova senha
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm font-normal"
              />
            </label>

            {erro && <p className="text-xs font-bold text-red-600">{erro}</p>}

            <button
              type="submit"
              disabled={enviando || !pronto}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-black text-gold disabled:opacity-50"
            >
              <KeyRound className="h-4 w-4" />
              Salvar nova senha
            </button>
          </form>
        )}

        <div className="text-center">
          <Link to="/auth" className="text-xs font-bold text-navy/60 underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    </main>
  );
}
