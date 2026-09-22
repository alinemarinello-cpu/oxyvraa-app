import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, UserPlus, LogOut, ShieldCheck } from "lucide-react";
import { resetSenha, signInEmail, signOut, useAuth } from "@/lib/oxyvra-auth";
import { NuvemSync } from "@/components/NuvemSync";

function caminhoSeguro(v: unknown): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const n = caminhoSeguro(s.next);
    return n ? { next: n } : {};
  },

  head: () => ({
    meta: [
      { title: "Acesso à Nuvem — Oxyvra Biossegurança" },
      {
        name: "description",
        content:
          "Entre na conta Oxyvra para sincronizar unidades, limpezas e evidências fotográficas com o banco de dados seguro.",
      },
      { property: "og:title", content: "Acesso à Nuvem — Oxyvra Biossegurança" },
      {
        property: "og:description",
        content: "Login seguro para sincronizar registros de biossegurança da Oxyvra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, isAdmin, roles, loading } = useAuth();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [recado, setRecado] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function esqueciSenha() {
    setErro("");
    setRecado("");
    if (!email) {
      setErro("Digite seu e-mail acima para receber o link de nova senha.");
      return;
    }
    try {
      await resetSenha(email);
      setRecado("Enviamos um link para o seu e-mail para criar uma nova senha.");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar o link.");
    }
  }

  useEffect(() => {
    if (user && next) window.location.href = next;
  }, [user, next]);



  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    
    setEnviando(true);
    try {
      await signInEmail(email, senha);
    } catch (e2) {
      setErro(e2 instanceof Error ? e2.message : "Não foi possível concluir.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-secondary px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-black text-navy">Acesso à Nuvem Oxyvra</h1>
          <p className="text-sm text-navy/60 mt-1">
            Sincronize os registros de biossegurança com o banco de dados seguro.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy/60">
            Carregando…
          </div>
        ) : user ? (
          <>
            <div className="rounded-2xl border border-navy/10 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-black text-navy">{user.email}</p>
                  <p className="text-xs text-navy/60">
                    Perfil: {isAdmin ? "Administrador" : "Operador"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {roles.includes("master") && (
                  <Link
                    to="/superadmin/complice"
                    className="rounded-xl bg-navy text-gold font-black px-4 py-2.5 text-sm"
                  >
                    Visão global (Complice)
                  </Link>
                )}
                <Link
                  to="/painel"
                  className="rounded-xl bg-navy text-gold font-black px-4 py-2.5 text-sm"
                >
                  Abrir painel de compliance
                </Link>
                <Link
                  to="/gestor"
                  className="rounded-xl border-2 border-navy/15 text-navy font-bold px-4 py-2.5 text-sm"
                >
                  Painel do gestor da empresa
                </Link>
                <Link
                  to="/checklist"
                  className="rounded-xl border-2 border-navy/15 text-navy font-bold px-4 py-2.5 text-sm"
                >
                  Executar checklist
                </Link>
                <button
                  onClick={() => void signOut()}
                  className="rounded-xl border-2 border-navy/15 text-navy font-bold px-4 py-2.5 text-sm flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            </div>
            <NuvemSync />
          </>
        ) : (
          <form onSubmit={enviar} className="rounded-2xl border border-navy/10 bg-white p-6 space-y-4">
            <label className="block text-xs font-bold text-navy/70">

              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-navy/15 px-3 py-2.5 text-sm font-normal"
              />
            </label>

            <label className="block text-xs font-bold text-navy/70">
              Senha
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
            {recado && <p className="text-xs font-bold text-emerald-700">{recado}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-navy text-gold font-black px-4 py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </button>

            <button
              type="button"
              onClick={() => void esqueciSenha()}
              className="w-full text-center text-xs font-bold text-navy/70 underline underline-offset-2"
            >
              Esqueci minha senha
            </button>

            <div className="rounded-xl border-2 border-teal/30 bg-teal/5 p-4 text-center">
              <p className="text-xs font-bold text-navy/70">É seu primeiro acesso?</p>
              <Link
                to="/auth/register"
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground"
              >
                <UserPlus className="w-4 h-4" /> Criar conta com e-mail e senha
              </Link>
            </div>
          </form>
        )}

        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-sm font-black text-navy">É da equipe (ASB/TSB)?</p>
          <p className="mt-1 text-xs text-navy/60">
            A equipe entra com o PIN de 4 dígitos e faz apenas checklists, fotos e testes da
            autoclave — sem acesso a plano ou financeiro.
          </p>
          <a
            href="/app/operador"
            className="mt-3 inline-flex rounded-xl bg-gold px-4 py-2.5 text-sm font-black text-navy"
          >
            Entrar com PIN da equipe
          </a>
        </div>

        <div className="text-center">
          <Link to="/" className="text-xs font-bold text-navy/60 underline">
            Voltar ao início
          </Link>
        </div>

      </div>
    </main>
  );
}
