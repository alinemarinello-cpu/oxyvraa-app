import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { Delete, GraduationCap, Mail, HelpCircle, ArrowLeft, ClipboardCheck, Building2 } from "lucide-react";
import { getUnitByPin, saveUnit, setCurrentUnit, setPinAtual, type UnitTipo } from "@/lib/oxyvra-store";
import { entrarComPin } from "@/lib/campo.functions";
import { loginRevisor } from "@/lib/oxyvra-revisor";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Acesso da equipe — Oxyvra" },
      { name: "description", content: "Acesso por PIN para equipes operacionais Oxyvra." },
      { property: "og:title", content: "Acesso da equipe — Oxyvra" },
      { property: "og:description", content: "Acesso por PIN para equipes operacionais Oxyvra." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginScreen,
});

type Modo = "pin" | "email";

function LoginScreen() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>("pin");
  const [ajuda, setAjuda] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erroEmail, setErroEmail] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const resolverPin = useServerFn(entrarComPin);

  const entrarEmail = () => {
    const r = loginRevisor(email, senha);
    if (!r.ok) {
      setErroEmail(r.erro);
      return;
    }
    setErroEmail(null);
    navigate({ to: "/menu" });
  };

  const press = (n: string) => {
    setErro(null);
    setPin((p) => (p.length < 4 ? p + n : p));
  };
  const clear = () => {
    setErro(null);
    setPin("");
  };
  const back = () => {
    setErro(null);
    setPin((p) => p.slice(0, -1));
  };

  const enter = async () => {
    if (pin.length !== 4 || entrando) return;
    setEntrando(true);
    try {
      const remota = await resolverPin({ data: { pin } });
      if (remota) {
        // Espelha a unidade no aparelho para o app continuar funcionando offline.
        saveUnit({
          id: remota.id,
          prefeituraId: remota.prefeituraNome,
          tipo: remota.tipo as UnitTipo,
          nome: remota.nome,
          bairro: remota.bairro,
          pin,
          responsavel: remota.responsavel,
          ambientes: remota.ambientes,
          locais: remota.locais as never,
          ambientesCustom: remota.ambientesCustom,
          lat: remota.lat ?? undefined,
          lng: remota.lng ?? undefined,
          raioMetros: remota.raioMetros,
        });
        setCurrentUnit(remota.id);
        setPinAtual({ nome: remota.pinNome, papel: remota.papel });
        navigate({ to: "/menu" });
        return;
      }
    } catch {
      // Sem internet: cai no cache local do aparelho.
    }
    const cache = getUnitByPin(pin);
    if (!cache) {
      setErro("PIN não encontrado. Confira com sua supervisora.");
      setPin("");
      setEntrando(false);
      return;
    }
    setCurrentUnit(cache.id);
    navigate({ to: "/menu" });
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      <section className="w-full max-w-sm flex flex-col items-center">
        <div className="flex flex-col items-center gap-3 mb-6">
          <OxyvraLogo size={110} />
          <div className="text-center">
            <h1 className="text-xl font-black text-navy tracking-[0.15em] uppercase">Oxyvra</h1>
            <p className="text-base font-semibold text-gold tracking-wide">Biossegurança</p>
          </div>
        </div>

        {modo === "email" ? (
          <div className="w-full flex flex-col">
            <button
              onClick={() => setModo("pin")}
              className="self-start h-9 px-3 -ml-1 rounded-xl text-navy/70 font-bold inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h2 className="text-xl font-bold text-navy text-center mt-2">Entrar com e-mail</h2>
            <p className="text-center text-navy/60 mt-1 text-sm">Para gestores e contas de demonstração</p>

            <div className="mt-6 flex flex-col gap-3">
              <label className="text-sm font-bold text-navy/70">
                E-mail
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErroEmail(null);
                  }}
                  placeholder="voce@empresa.com"
                  className="mt-1 w-full h-11 rounded-2xl border-2 border-navy/15 px-4 text-base font-normal text-navy"
                />
              </label>
              <label className="text-sm font-bold text-navy/70">
                Senha
                <input
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErroEmail(null);
                  }}
                  placeholder="••••••••"
                  className="mt-1 w-full h-11 rounded-2xl border-2 border-navy/15 px-4 text-base font-normal text-navy"
                />
              </label>
              {erroEmail && <p className="text-center text-destructive font-bold">{erroEmail}</p>}
              <button
                onClick={entrarEmail}
                disabled={!email || !senha}
                className="h-11 rounded-2xl bg-navy text-white text-base font-black tracking-widest shadow-elevated disabled:opacity-40 active:scale-[0.98] transition"
              >
                ENTRAR
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="rounded-2xl bg-secondary px-4 py-2.5 text-center w-full">
              <h2 className="text-base font-black text-navy">
                Digite o PIN de 4 números da sua unidade
              </h2>
            </div>

            <div className="flex justify-center gap-2.5 my-5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-lg font-black bg-white ${
                    erro
                      ? "border-destructive text-destructive"
                      : pin[i]
                        ? "border-gold text-navy shadow-card"
                        : "border-navy/20 text-navy/30"
                  }`}
                >
                  {pin[i] ? "●" : ""}
                </div>
              ))}
            </div>

            {erro && (
              <p className="text-center text-destructive font-bold -mt-2 mb-2 text-sm">{erro}</p>
            )}

            <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
                <button
                  key={n}
                  onClick={() => press(n)}
                  className="h-10 rounded-xl bg-white border-2 border-navy/15 text-lg font-black text-navy active:bg-navy/5 active:border-gold shadow-card transition"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={clear}
                className="h-10 rounded-xl bg-white border-2 border-navy/15 text-xs font-bold text-navy/70 active:bg-navy/5 shadow-card"
              >
                Limpar
              </button>
              <button
                onClick={() => press("0")}
                className="h-10 rounded-xl bg-white border-2 border-navy/15 text-lg font-black text-navy active:bg-navy/5 active:border-gold shadow-card transition"
              >
                0
              </button>
              <button
                onClick={back}
                className="h-10 rounded-xl bg-white border-2 border-navy/15 flex items-center justify-center text-navy/70 active:bg-navy/5 shadow-card"
                aria-label="Apagar"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={enter}
              disabled={pin.length !== 4}
              className="mt-3 h-10 rounded-xl bg-navy text-white text-sm font-black tracking-widest shadow-elevated disabled:opacity-40 active:scale-[0.98] transition w-full max-w-[280px]"
            >
              ENTRAR
            </button>

            <button
              onClick={() => setAjuda((v) => !v)}
              className="mt-2 h-9 text-xs font-bold text-navy/70 inline-flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Esqueci o PIN da unidade
            </button>

            {ajuda && (
              <div className="rounded-2xl bg-secondary border border-navy/10 p-3 text-xs text-navy/80 leading-relaxed w-full max-w-[280px]">
                <p className="font-black text-navy mb-1">Como recuperar o PIN</p>
                <p>
                  O PIN é definido pelo gestor no <b>Painel de Compliance</b>, em
                  <b> Unidades → editar unidade</b>. Peça o número à sua supervisora ou ao
                  responsável pelo contrato.
                </p>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-navy/10 flex flex-col gap-2 w-full max-w-[280px]">
              <p className="text-center text-[10px] font-black tracking-widest text-navy/40 uppercase">
                Sou gestor
              </p>
              <a
                href="/auth?next=/painel"
                className="h-11 rounded-2xl bg-teal text-teal-foreground font-black flex items-center justify-center gap-2 active:opacity-90 text-sm"
              >
                <ClipboardCheck className="w-4 h-4" /> Painel de Compliance
              </a>
              <a
                href="/diagnostico"
                className="min-h-10 py-1.5 px-4 rounded-2xl border-2 border-gold text-xs font-black text-navy flex items-center justify-start gap-2"
              >
                <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span>Diagnóstico RDC 1002/2025</span>
                  <span className="text-[9px] font-bold tracking-widest uppercase text-gold">Risco Sanitário</span>
                </span>
              </a>
              <a
                href="/diagnostico-ilpi"
                className="min-h-10 py-1.5 px-4 rounded-2xl border-2 border-gold text-xs font-black text-navy flex items-center justify-start gap-2"
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span>Diagnóstico ILPIs</span>
                  <span className="text-[9px] font-bold tracking-widest uppercase text-gold">Risco Sanitário</span>
                </span>
              </a>
              <a
                href="/diagnostico-escola"
                className="min-h-10 py-1.5 px-4 rounded-2xl border-2 border-gold text-xs font-black text-navy flex items-center justify-start gap-2"
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span className="flex flex-col items-start leading-tight">
                  <span>Diagnóstico Escolas e Creches</span>
                  <span className="text-[9px] font-bold tracking-widest uppercase text-gold">Risco Sanitário</span>
                </span>
              </a>
              <button
                onClick={() => setModo("email")}
                className="h-10 rounded-2xl text-xs font-bold text-navy/70 flex items-center justify-center gap-2 underline underline-offset-4"
              >
                <Mail className="w-3.5 h-3.5" /> Entrar com e-mail e senha
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
