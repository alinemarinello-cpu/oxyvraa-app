import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, Droplets, Timer } from "lucide-react";
import {
  brl,
  calcularPrecificacao,
  formatarDwell,
  perfisPorSegmento,
  SEGMENTOS,
  unidadeDoPerfil,
  type SegmentoPrecificacao,
} from "@/lib/precificacao-spartan";
import { CORES_LIMPEZA } from "@/lib/oxyvra-store";

export const Route = createFileRoute("/_authenticated/painel/precificacao")({
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [
      { title: "Precificação e dosagem Spartan — Oxyvra" },
      {
        name: "description",
        content:
          "Calcule produto Spartan indicado, diluição, dwell time, volume por aplicação e custo mensal de químicos por ambiente.",
      },
      { property: "og:title", content: "Precificação e dosagem Spartan — Oxyvra" },
      {
        property: "og:description",
        content:
          "Motor de cálculo de dosagem e custo operacional de insumos químicos por ambiente.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrecificacaoPage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

function PrecificacaoPage() {
  const [segmento, setSegmento] = useState<SegmentoPrecificacao>("educacional");
  const perfis = useMemo(() => perfisPorSegmento(segmento), [segmento]);
  const [perfilId, setPerfilId] = useState(perfis[0]!.id);
  const perfil = perfis.find((p) => p.id === perfilId) ?? perfis[0]!;

  const [nome, setNome] = useState("Consultório 01");
  const [tamanho, setTamanho] = useState("30");
  const [frequencia, setFrequencia] = useState("8");
  const [dias, setDias] = useState("30");
  const [preco, setPreco] = useState(String(perfil.precoPadraoLitro));
  const [obs, setObs] = useState("");

  const trocarSegmento = (s: SegmentoPrecificacao) => {
    setSegmento(s);
    const primeiro = perfisPorSegmento(s)[0]!;
    setPerfilId(primeiro.id);
    setPreco(String(primeiro.precoPadraoLitro));
  };

  const resultado = calcularPrecificacao({
    perfil,
    nomeAmbiente: nome,
    tamanho: Number(tamanho) || 0,
    frequenciaDiaria: Number(frequencia) || 0,
    diasNoMes: Number(dias) || 0,
    precoLitroConcentrado: Number(preco) || 0,
    observacoes: obs,
  });

  const cor = CORES_LIMPEZA[perfil.corKit];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-black text-foreground">Precificação e dosagem de químicos</h2>
        <p className="text-sm text-muted-foreground">
          Informe o ambiente e o preço pago no litro concentrado. O motor Spartan devolve produto,
          diluição, tempo de contato, volume por aplicação e custo mensal estimado.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-black text-foreground">Dados do ambiente</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className={rotulo}>
            Segmento
            <select
              className={campo}
              value={segmento}
              onChange={(e) => trocarSegmento(e.target.value as SegmentoPrecificacao)}
            >
              {SEGMENTOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className={rotulo}>
            Tipo de ambiente
            <select
              className={campo}
              value={perfil.id}
              onChange={(e) => {
                setPerfilId(e.target.value);
                const p = perfis.find((x) => x.id === e.target.value);
                if (p) setPreco(String(p.precoPadraoLitro));
              }}
            >
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className={rotulo}>
            Nome do ambiente
            <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label className={rotulo}>
            Tamanho / unidades ({unidadeDoPerfil(perfil)})
            <input
              type="number"
              className={campo}
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
            />
          </label>
          <label className={rotulo}>
            Frequência (aplicações/giros por dia)
            <input
              type="number"
              className={campo}
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value)}
            />
          </label>
          <label className={rotulo}>
            Dias no mês
            <input
              type="number"
              className={campo}
              value={dias}
              onChange={(e) => setDias(e.target.value)}
            />
          </label>
          <label className={rotulo}>
            Preço do litro concentrado (R$)
            <input
              type="number"
              step="0.01"
              className={campo}
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
            />
          </label>
          <label className={`${rotulo} sm:col-span-2`}>
            Observações
            <input
              className={campo}
              placeholder="Ex.: alto fluxo de sangue / gordura pesada / uso de EPI"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
          <Calculator className="h-4 w-4 text-teal" /> Relatório de precificação e dosagem
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Dados do ambiente
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              <li>
                Local: <b>{nome || perfil.label}</b>
              </li>
              <li>
                Tamanho registrado:{" "}
                <b>
                  {tamanho || 0} {unidadeDoPerfil(perfil)}
                </b>
              </li>
              <li>
                Produto Spartan recomendado: <b>{perfil.produto}</b>
              </li>
              <li className="flex items-center gap-2">
                Cor do kit exigida:
                <span
                  className="inline-block h-3 w-3 rounded-full border border-border"
                  style={{ background: cor?.hex }}
                />
                <b>{cor?.label ?? perfil.corKit}</b>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Parâmetros operacionais
            </p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              <li>
                Fator de diluição: <b>{perfil.diluicaoLabel}</b>
              </li>
              <li className="flex items-center gap-1">
                <Timer className="h-3.5 w-3.5 text-teal" /> Tempo de contato obrigatório:{" "}
                <b>{formatarDwell(perfil.dwellSegundos)}</b>
              </li>
              <li>
                Custo do litro pronto uso: <b>{brl(resultado.custoLitroPronto)}</b> / L
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border p-3 sm:col-span-2">
            <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" /> Consumo e custos
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-4">
              <Kpi
                titulo="Volume por aplicação"
                valor={`${resultado.volumeSolucaoLitros.toLocaleString("pt-BR")} L`}
                nota={resultado.prontoUso ? "pronto uso" : "solução pronta"}
              />
              <Kpi
                titulo="Custo por aplicação"
                valor={brl(resultado.custoPorAplicacao)}
                nota={`${resultado.aplicacoesMes} aplicações/mês`}
              />
              <Kpi
                titulo="Concentrado por mês"
                valor={`${resultado.litrosConcentradoMensal.toLocaleString("pt-BR")} L`}
                nota="galão concentrado"
              />
              <Kpi
                titulo="Custo total mensal"
                valor={brl(resultado.custoMensal)}
                nota="estimado"
                destaque
              />
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-teal/40 bg-teal/10 p-3 text-sm text-foreground">
          <p className="font-black">Recomendações para o operador</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              Respeitar o cronômetro de <b>{formatarDwell(perfil.dwellSegundos)}</b> no aplicativo
              antes de liberar a área.
            </li>
            <li>
              Utilizar estritamente o kit de balde/pano na cor <b>{cor?.label ?? perfil.corKit}</b>{" "}
              para evitar contaminação cruzada.
            </li>
            {obs.trim() && <li>Observação do gestor: {obs.trim()}</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  titulo,
  valor,
  nota,
  destaque,
}: {
  titulo: string;
  valor: string;
  nota: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${destaque ? "border-teal bg-teal/10" : "border-border"}`}
    >
      <p className="text-xs font-bold text-muted-foreground">{titulo}</p>
      <p className="text-lg font-black text-foreground">{valor}</p>
      <p className="text-[11px] text-muted-foreground">{nota}</p>
    </div>
  );
}
