import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, Building2, GraduationCap, Stethoscope, UserPlus } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { signInEmail, signUpEmail } from "@/lib/oxyvra-auth";
import { waLinkOxyvra } from "@/lib/whatsapp-oxyvra";

export const Route = createFileRoute("/auth_/register")({
  validateSearch: (s: Record<string, unknown>): { segmento?: Segmento } => {
    return s.segmento === "odonto" || s.segmento === "escola" || s.segmento === "ilpi"
      ? { segmento: s.segmento }
      : {};
  },
  head: () => ({
    meta: [
      { title: "Criar conta — Oxyvra Conformidade" },
      {
        name: "description",
        content:
          "Crie sua conta em menos de um minuto e comece o teste grátis de 7 dias da conformidade sanitária Oxyvra.",
      },
      { property: "og:title", content: "Criar conta — Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Cadastro rápido: segmento, nome, WhatsApp, e-mail e senha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Registro,
});

type Segmento = "odonto" | "escola" | "ilpi";

const SEGMENTOS: Array<{
  valor: Segmento;
  titulo: string;
  sub: string;
  Icone: typeof Stethoscope;
}> = [
  {
    valor: "odonto",
    titulo: "Odontologia",
    sub: "Clínicas e consultórios odontológicos",
    Icone: Stethoscope,
  },
  {
    valor: "escola",
    titulo: "Escola / Creche",
    sub: "Escolas infantis, creches e berçários",
    Icone: GraduationCap,
  },
  {
    valor: "ilpi",
    titulo: "ILPI / Lar de Idosos",
    sub: "Instituições de longa permanência",
    Icone: Building2,
  },
];

const FRASE_SEGMENTO: Record<Segmento, string> = {
  odonto: "Conformidade odontológica RDC 1.002/2025.",
  escola: "Biossegurança e rotinas sanitárias para escolas e creches.",
  ilpi: "Biossegurança e rotinas sanitárias para lares de idosos (ILPIs).",
};

/** Mensagem de visita técnica exibida ao selecionar um segmento com app dedicado. */
const CONVITE_VISITA: Partial<Record<Segmento, string>> = {
  escola:
    "Olá! Quero conhecer o app de gestão para escolas e creches e agendar uma visita técnica.",
  ilpi: "Olá! Quero conhecer o app de gestão para lares de idosos (ILPIs) e agendar uma visita técnica.",
};

/** Máscara de WhatsApp no formato brasileiro. */
function mascaraWhatsapp(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const campo =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-normal text-foreground";
const rotulo = "block text-xs font-bold text-muted-foreground";

function Registro() {
  const navigate = useNavigate();
  const busca = Route.useSearch();
  const [segmento, setSegmento] = useState<Segmento | "">(busca.segmento ?? "");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");
    if (!segmento) {
      setErro("Escolha o segmento da sua instituição.");
      return;
    }
    setEnviando(true);
    try {
      await signUpEmail(email, senha, nome);
      // Guarda o WhatsApp e o segmento para preencher o perfil assim que a sessão existir.
      try {
        window.localStorage.setItem("oxyvra_cadastro_whatsapp", whatsapp);
        window.localStorage.setItem("oxyvra_cadastro_nome", nome);
        window.localStorage.setItem("oxyvra_cadastro_segmento", segmento);
      } catch {
        /* armazenamento indisponível */
      }
      try {
        await signInEmail(email, senha);
        navigate({ to: "/onboarding/setup" });
        return;
      } catch {
        setAviso("Conta criada. Confirme o e-mail que enviamos para continuar.");
      }
    } catch (e2) {
      setErro(e2 instanceof Error ? e2.message : "Não foi possível criar a conta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-secondary px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <OxyvraLogo size={120} />
          <h1 className="text-2xl font-black text-foreground">Crie sua conta Oxyvra</h1>
          <p className="text-sm text-muted-foreground">
            {segmento === "odonto" && <>7 dias grátis, sem cartão. </>}
            {segmento
              ? FRASE_SEGMENTO[segmento]
              : "Escolha seu segmento abaixo."}
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div>
            <p className={rotulo}>Qual é o seu segmento?</p>
            <div className="mt-2 space-y-2">
              {SEGMENTOS.map(({ valor, titulo, sub, Icone }) => {
                const ativo = segmento === valor;
                const convite = CONVITE_VISITA[valor];
                return (
                  <div key={valor}>
                    <button
                      type="button"
                      onClick={() => setSegmento(valor)}
                      aria-pressed={ativo}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors ${
                        ativo
                          ? "border-teal bg-teal/5"
                          : "border-border bg-background hover:border-muted-foreground/40"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          ativo ? "bg-teal/15" : "bg-secondary"
                        }`}
                      >
                        <Icone className={`h-5 w-5 ${ativo ? "text-teal" : "text-muted-foreground"}`} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-foreground">{titulo}</span>
                        <span className="block text-xs text-muted-foreground">{sub}</span>
                      </span>
                    </button>
                    {ativo && convite && (
                      <a
                        href={waLinkOxyvra(convite)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 flex items-center gap-1.5 pl-12 text-[11px] font-bold text-teal underline underline-offset-2"
                      >
                        Conheça o app de gestão — agende uma visita técnica
                        <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <label className={rotulo}>
            Nome completo
            <input value={nome} onChange={(e) => setNome(e.target.value)} required className={campo} />
          </label>
          <label className={rotulo}>
            WhatsApp
            <input
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(mascaraWhatsapp(e.target.value))}
              placeholder="(11) 91234-5678"
              required
              className={campo}
            />
          </label>
          <label className={rotulo}>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={campo}
            />
          </label>
          <label className={rotulo}>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className={campo}
            />
          </label>

          {erro && <p className="text-xs font-bold text-destructive">{erro}</p>}
          {aviso && <p className="text-xs font-bold text-teal">{aviso}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {enviando ? "Criando…" : "Criar conta e começar"}
          </button>
        </form>

        <p className="text-center text-xs font-bold text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/auth" search={{ next: "/dashboard" }} className="underline">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
