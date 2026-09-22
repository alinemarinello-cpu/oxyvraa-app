import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/oxyvra-auth";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, Globe, KeyRound, Minus, Plus } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import { salvarPorteClinica } from "@/lib/assinatura.functions";
import { salvarResponsavelConta } from "@/lib/compliance.functions";
import {
  criarPrimeiraUnidade,
  dadosOnboardingPin,
  lerSegmentoConta,
  salvarSegmentoConta,
} from "@/lib/onboarding.functions";

type SegmentoConta = "odonto" | "escola" | "ilpi";
const VALORES_SEGMENTO: string[] = ["odonto", "escola", "ilpi"];
import { campoCls, rotuloCls } from "@/components/OnboardingPassos";
import { useAssinatura } from "@/hooks/useAssinatura";
import { ADDON_INSUMOS, brl } from "@/lib/planos-oxyvra";

export const Route = createFileRoute("/_authenticated/onboarding/setup")({
  head: () => ({
    meta: [
      { title: "Perfil rápido — Oxyvra Conformidade" },
      {
        name: "description",
        content:
          "Duas perguntas rápidas para dimensionar as rotinas de biossegurança e liberar o painel em segundos.",
      },
      { property: "og:title", content: "Perfil rápido — Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Duas perguntas rápidas para dimensionar as rotinas de biossegurança.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilRapido,
});

function Contador({
  titulo,
  descricao,
  valor,
  minimo,
  onChange,
}: {
  titulo: string;
  descricao: string;
  valor: number;
  minimo: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-black text-foreground">{titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>
      <div className="mt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={`Diminuir ${titulo}`}
          onClick={() => onChange(Math.max(minimo, valor - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-border text-foreground"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="min-w-16 text-center text-4xl font-black text-foreground">{valor}</span>
        <button
          type="button"
          aria-label={`Aumentar ${titulo}`}
          onClick={() => onChange(Math.min(200, valor + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-teal text-teal-foreground"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/** Conta mestre não precisa escolher segmento: atalho direto para a visão global. */
function AtalhoMestre() {
  const { roles } = useAuth();
  if (!roles.includes("master")) return null;
  return (
    <Link
      to="/superadmin/complice"
      className="flex items-center gap-3 rounded-2xl bg-navy p-4 text-left shadow-card transition active:scale-[0.98]"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/20">
        <Globe className="h-5 w-5 text-gold" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-gold">Visão global (Complice)</p>
        <p className="text-xs text-gold/70">Pular esta etapa e abrir a administração completa</p>
      </div>
    </Link>
  );
}

function PerfilRapido() {
  const navigate = useNavigate();
  const { assinatura } = useAssinatura();
  const gravarResponsavel = useServerFn(salvarResponsavelConta);
  const gravarSegmento = useServerFn(salvarSegmentoConta);
  const lerDadosPin = useServerFn(dadosOnboardingPin);
  const lerSegmento = useServerFn(lerSegmentoConta);
  const [cadeiras, setCadeiras] = useState(1);
  const [autoclaves, setAutoclaves] = useState(1);
  const [alunos, setAlunos] = useState(50);
  const [salas, setSalas] = useState(3);
  const [residentes, setResidentes] = useState(20);
  const [alas, setAlas] = useState(2);
  const [segmento, setSegmento] = useState<SegmentoConta>("odonto");
  // Etapas internas: porte → pin (se não houver unidade) → sucesso.
  const [etapa, setEtapa] = useState<"porte" | "pin" | "sucesso">("porte");
  const [nomeUnidade, setNomeUnidade] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirmacao, setPinConfirmacao] = useState("");
  const [pinCriado, setPinCriado] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (assinatura && segmento === "odonto") setCadeiras(Math.max(1, assinatura.cadeiras ?? 1));
  }, [assinatura, segmento]);

  // Segmento: usa o escolhido na criação da conta e, se já estiver gravado na
  // organização, lê de lá — assim um recarregamento não volta para odontologia.
  useEffect(() => {
    let cancelado = false;
    let local: string | null = null;
    try {
      local = window.localStorage.getItem("oxyvra_cadastro_segmento");
    } catch {
      local = null;
    }
    const valido = local && VALORES_SEGMENTO.includes(local) ? (local as SegmentoConta) : null;
    if (valido) {
      setSegmento(valido);
      void gravarSegmento({ data: { segmento: valido } })
        .then(() => {
          try {
            window.localStorage.removeItem("oxyvra_cadastro_segmento");
          } catch {
            /* armazenamento indisponível */
          }
        })
        .catch(() => undefined);
      return;
    }
    void lerSegmento()
      .then((r) => {
        if (cancelado || !r?.segmento || !VALORES_SEGMENTO.includes(r.segmento)) return;
        setSegmento(r.segmento as SegmentoConta);
        const p = r.porte ?? {};
        if (p.alunos) setAlunos(p.alunos);
        if (p.salas) setSalas(p.salas);
        if (p.residentes) setResidentes(p.residentes);
        if (p.alas) setAlas(p.alas);
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [gravarSegmento, lerSegmento]);

  // Completa o cadastro com o WhatsApp informado na criação da conta.
  useEffect(() => {
    let nome: string | null = null;
    let whatsapp: string | null = null;
    try {
      nome = window.localStorage.getItem("oxyvra_cadastro_nome");
      whatsapp = window.localStorage.getItem("oxyvra_cadastro_whatsapp");
    } catch {
      return;
    }
    if (!nome && !whatsapp) return;
    void gravarResponsavel({
      data: { responsavel_nome: nome, responsavel_telefone: whatsapp },
    })
      .then(() => {
        window.localStorage.removeItem("oxyvra_cadastro_nome");
        window.localStorage.removeItem("oxyvra_cadastro_whatsapp");
      })
      .catch(() => undefined);
  }, [gravarResponsavel]);

  const aposPorte = async () => {
    // Se a conta ainda não tem unidade, pede o PIN de acesso da equipe.
    try {
      const dados = await lerDadosPin();
      if (!dados.temUnidade) {
        setNomeUnidade((v) => v || dados.nomeClinica || "Unidade principal");
        setEtapa("pin");
        return;
      }
    } catch {
      // Falha ao verificar unidades não deve travar o onboarding.
    }
    navigate({ to: "/dashboard" });
  };

  const salvar = useMutation({
    mutationFn: salvarPorteClinica,
    onSuccess: aposPorte,
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar o porte da clínica."),
  });

  // Escolas e ILPIs não têm porte de cadeiras/autoclaves: grava o segmento e segue.
  const avancarSemPorte = async () => {
    const porte =
      segmento === "escola" ? { alunos, salas } : { residentes, alas };
    try {
      await gravarSegmento({ data: { segmento, porte } });
    } catch (e) {
      toast.error(
        (e as Error)?.message || "Não foi possível salvar os dados informados. Tente novamente.",
      );
      return;
    }
    await aposPorte();
  };

  const criarUnidade = useMutation({
    mutationFn: () =>
      criarPrimeiraUnidade({ data: { nome: nomeUnidade.trim(), pin } }),
    onSuccess: () => {
      setPinCriado(pin);
      setEtapa("sucesso");
    },
    onError: (e: Error) => toast.error(e.message || "Não foi possível criar a unidade."),
  });

  const confirmarPin = () => {
    if (nomeUnidade.trim().length < 3) return toast.error("Informe o nome da unidade.");
    if (!/^\d{4}$/.test(pin)) return toast.error("O PIN deve ter exatamente 4 números.");
    if (pin !== pinConfirmacao) return toast.error("Os PINs não conferem. Digite novamente.");
    criarUnidade.mutate();
  };

  const copiarPin = async () => {
    try {
      await navigator.clipboard.writeText(pinCriado);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Anote o PIN manualmente.");
    }
  };

  if (etapa === "sucesso") {
    return (
      <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
        <OxyvraLogo size={90} />
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/15">
            <Check className="h-7 w-7 text-teal" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-foreground">Tudo pronto!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este é o PIN de acesso da equipe à unidade <strong>{nomeUnidade}</strong>. Compartilhe
            com quem vai registrar os checklists no app de campo:
          </p>
          <button
            type="button"
            onClick={copiarPin}
            className="mx-auto mt-5 flex items-center gap-3 rounded-2xl border-2 border-dashed border-teal bg-teal/5 px-8 py-4"
            aria-label="Copiar PIN"
          >
            <span className="text-4xl font-black tracking-[0.4em] text-foreground">{pinCriado}</span>
            {copiado ? (
              <Check className="h-5 w-5 text-teal" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            {copiado ? "PIN copiado!" : "Toque no PIN para copiar."}
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground"
        >
          Abrir meu painel <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (etapa === "pin") {
    return (
      <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
        <OxyvraLogo size={90} />
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15">
            <KeyRound className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Crie o PIN de acesso da equipe</h1>
            <p className="text-sm text-muted-foreground">
              É com esse PIN que sua equipe entra no app de campo para registrar checklists e fotos.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className={rotuloCls}>Nome da unidade</label>
            <input
              className={campoCls}
              value={nomeUnidade}
              onChange={(e) => setNomeUnidade(e.target.value)}
              placeholder="Ex.: Unidade Centro"
            />
          </div>
          <div>
            <label className={rotuloCls}>PIN de acesso (4 números)</label>
            <input
              className={campoCls}
              inputMode="numeric"
              maxLength={4}
              placeholder="Ex.: 5821"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
          <div>
            <label className={rotuloCls}>Confirme o PIN</label>
            <input
              className={campoCls}
              inputMode="numeric"
              maxLength={4}
              value={pinConfirmacao}
              onChange={(e) => setPinConfirmacao(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Evite sequências óbvias como 1234 ou 0000. Você poderá criar PINs extras por turno depois,
            em Painel → Unidades.
          </p>
          <button
            onClick={confirmarPin}
            disabled={criarUnidade.isPending}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground disabled:opacity-60"
          >
            {criarUnidade.isPending ? "Criando…" : "Concluir e abrir meu painel"}{" "}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const tituloPorte =
    segmento === "escola"
      ? "Conte o porte da sua escola"
      : segmento === "ilpi"
        ? "Conte o porte da sua casa"
        : "Conte o porte da sua clínica";

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <OxyvraLogo size={90} />
      <AtalhoMestre />
      <h1 className="text-2xl font-black text-foreground">{tituloPorte}</h1>
      <p className="text-sm text-muted-foreground">
        Duas perguntas rápidas e o painel já abre com tudo dimensionado.
      </p>

      {segmento === "odonto" ? (
        <>
          <Contador
            titulo="Quantas cadeiras / equipos sua clínica possui?"
            descricao="Cada cadeira recebe um QR Code próprio e entra no cálculo do kit de insumos."
            valor={cadeiras}
            minimo={1}
            onChange={setCadeiras}
          />
          <Contador
            titulo="Quantas autoclaves estão em uso?"
            descricao="Cada autoclave terá o registro dos 7 campos obrigatórios e o teste biológico semanal."
            valor={autoclaves}
            minimo={0}
            onChange={setAutoclaves}
          />
          <p className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Com <strong>{cadeiras}</strong> cadeira(s), o kit mensal de insumos sai por{" "}
            <strong>{brl(ADDON_INSUMOS.precoPorCadeiraMensal * cadeiras)}/mês</strong> (opcional).
          </p>
          <button
            onClick={() => salvar.mutate({ data: { cadeiras, autoclaves } })}
            disabled={salvar.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground disabled:opacity-60"
          >
            {salvar.isPending ? "Salvando…" : "Abrir meu painel"} <ArrowRight className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          {segmento === "escola" ? (
            <>
              <Contador
                titulo="Quantos alunos a instituição atende?"
                descricao="Dimensiona as rotinas de higienização e os kits por ambiente."
                valor={alunos}
                minimo={1}
                onChange={setAlunos}
              />
              <Contador
                titulo="Quantas salas/ambientes são higienizados?"
                descricao="Salas, berçário, banheiros e áreas comuns recebem checklists próprios."
                valor={salas}
                minimo={1}
                onChange={setSalas}
              />
            </>
          ) : (
            <>
              <Contador
                titulo="Quantos residentes a casa atende?"
                descricao="Dimensiona as rotinas de higienização e os kits por ambiente."
                valor={residentes}
                minimo={1}
                onChange={setResidentes}
              />
              <Contador
                titulo="Quantas alas/ambientes são higienizados?"
                descricao="Alas, quartos, banheiros e áreas comuns recebem checklists próprios."
                valor={alas}
                minimo={1}
                onChange={setAlas}
              />
            </>
          )}
          <button
            onClick={() => void avancarSemPorte()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground"
          >
            Abrir meu painel <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
