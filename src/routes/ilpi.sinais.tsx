import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, NotebookPen, Save } from "lucide-react";
import { BarraStatus, Cartao, NavInferior } from "@/components/ilpi/IlpiUI";
import {
  formatarHora,
  novoId,
  novoLog,
  useConectividade,
  useIlpi,
} from "@/lib/ilpi-store";

export const Route = createFileRoute("/ilpi/sinais")({
  head: () => ({
    meta: [
      { title: "Sinais vitais e ocorrências — Oxyvra ILPI" },
      {
        name: "description",
        content:
          "Registro rápido de pressão arterial, glicemia, peso e temperatura do residente, além de anotações de intercorrências de saúde e comportamento.",
      },
      { property: "og:title", content: "Sinais vitais e ocorrências — Oxyvra ILPI" },
      {
        property: "og:description",
        content: "Formulário ágil de sinais vitais e anotações do turno no lar de idosos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SinaisOcorrencias,
});

function campoNumero(v: string) {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && v.trim() !== "" ? n : undefined;
}

function SinaisOcorrencias() {
  const { estado, atualizar } = useIlpi();
  const pendentesSync = estado?.logs.filter((l) => !l.sincronizado).length ?? 0;
  const { online } = useConectividade(pendentesSync);

  const [residenteId, setResidenteId] = useState("");
  const [pas, setPas] = useState("");
  const [pad, setPad] = useState("");
  const [glicemia, setGlicemia] = useState("");
  const [peso, setPeso] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [observacao, setObservacao] = useState("");
  const [ocorrencia, setOcorrencia] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  if (!estado) return <main className="min-h-screen bg-background" aria-busy="true" />;

  const alvo = residenteId || estado.residentes[0]?.id || "";

  function salvarSinais() {
    const dados = {
      pas: campoNumero(pas),
      pad: campoNumero(pad),
      glicemia: campoNumero(glicemia),
      peso: campoNumero(peso),
      temperatura: campoNumero(temperatura),
    };
    if (Object.values(dados).every((v) => v === undefined)) {
      setAviso("Preencha ao menos uma medição.");
      return;
    }
    atualizar((e) => {
      const r = e.residentes.find((x) => x.id === alvo);
      const registro = {
        id: novoId(),
        residenteId: alvo,
        ...dados,
        observacao: observacao.trim() || undefined,
        quando: Date.now(),
        profissional: e.profissional,
      };
      const resumo = [
        dados.pas && dados.pad ? `PA ${dados.pas}/${dados.pad} mmHg` : null,
        dados.glicemia ? `glicemia ${dados.glicemia} mg/dL` : null,
        dados.peso ? `peso ${dados.peso} kg` : null,
        dados.temperatura ? `temp ${dados.temperatura} °C` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return novoLog(
        { ...e, sinais: [registro, ...e.sinais] },
        "Sinais vitais registrados",
        `${r?.nome} — ${resumo}`,
        online,
      );
    });
    setPas("");
    setPad("");
    setGlicemia("");
    setPeso("");
    setTemperatura("");
    setObservacao("");
    setAviso("Medições registradas no turno.");
  }

  function salvarOcorrencia() {
    if (ocorrencia.trim().length < 5) {
      setAviso("Descreva a ocorrência com mais detalhes.");
      return;
    }
    atualizar((e) => {
      const r = e.residentes.find((x) => x.id === alvo);
      const registro = {
        id: novoId(),
        residenteId: alvo,
        texto: ocorrencia.trim(),
        quando: Date.now(),
        profissional: e.profissional,
      };
      return novoLog(
        { ...e, ocorrencias: [registro, ...e.ocorrencias] },
        "Ocorrência registrada",
        `${r?.nome} — ${ocorrencia.trim()}`,
        online,
      );
    });
    setOcorrencia("");
    setAviso("Ocorrência registrada no histórico do turno.");
  }

  const entrada =
    "mt-1 w-full rounded-xl border border-input px-3 py-3 text-base tabular-nums";

  return (
    <main className="min-h-screen bg-background pb-24">
      <BarraStatus
        online={online}
        pendentes={pendentesSync}
        titulo="Sinais vitais e ocorrências"
        subtitulo={estado.turno}
      />

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        <Cartao>
          <label className="text-sm font-black text-navy" htmlFor="residente">
            Residente
          </label>
          <select
            id="residente"
            value={alvo}
            onChange={(e) => setResidenteId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-input px-3 py-3 text-base"
          >
            {estado.residentes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome} — quarto {r.quarto}
              </option>
            ))}
          </select>
        </Cartao>

        <Cartao>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal" aria-hidden />
            <h2 className="font-black text-navy">Medições</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground" htmlFor="pas">
                PA sistólica (mmHg)
              </label>
              <input id="pas" inputMode="numeric" value={pas} onChange={(e) => setPas(e.target.value)} className={entrada} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground" htmlFor="pad">
                PA diastólica (mmHg)
              </label>
              <input id="pad" inputMode="numeric" value={pad} onChange={(e) => setPad(e.target.value)} className={entrada} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground" htmlFor="glicemia">
                Glicemia (mg/dL)
              </label>
              <input id="glicemia" inputMode="numeric" value={glicemia} onChange={(e) => setGlicemia(e.target.value)} className={entrada} />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground" htmlFor="temperatura">
                Temperatura (°C)
              </label>
              <input id="temperatura" inputMode="decimal" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} className={entrada} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-muted-foreground" htmlFor="peso">
                Peso (kg)
              </label>
              <input id="peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} className={entrada} />
            </div>
          </div>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="Observação da medição (opcional)"
            className="mt-3 w-full rounded-xl border border-input p-3 text-base"
          />
          <button
            onClick={salvarSinais}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-teal font-black text-teal-foreground"
          >
            <Save className="h-5 w-5" aria-hidden /> Salvar medições
          </button>
        </Cartao>

        <Cartao>
          <div className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-navy" aria-hidden />
            <h2 className="font-black text-navy">Intercorrência ou observação</h2>
          </div>
          <textarea
            value={ocorrencia}
            onChange={(e) => setOcorrencia(e.target.value)}
            rows={3}
            maxLength={800}
            placeholder="Ex.: residente apresentou episódio de agitação após o almoço; equipe técnica comunicada."
            className="mt-3 w-full rounded-xl border border-input p-3 text-base"
          />
          <button
            onClick={salvarOcorrencia}
            className="mt-3 min-h-[52px] w-full rounded-2xl bg-navy font-black text-primary-foreground"
          >
            Registrar ocorrência
          </button>
        </Cartao>

        {aviso && (
          <p className="rounded-xl bg-secondary px-3 py-2 text-sm font-bold text-navy" role="status">
            {aviso}
          </p>
        )}

        <Cartao>
          <h2 className="font-black text-navy">Registros recentes do turno</h2>
          <ul className="mt-3 space-y-2">
            {estado.sinais.length === 0 && estado.ocorrencias.length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhum registro ainda.</li>
            )}
            {estado.sinais.map((s) => (
              <li key={s.id} className="rounded-xl bg-secondary p-3 text-sm">
                <span className="font-bold text-navy">
                  {estado.residentes.find((r) => r.id === s.residenteId)?.nome}
                </span>{" "}
                <span className="text-muted-foreground">
                  {formatarHora(s.quando)} ·{" "}
                  {[
                    s.pas && s.pad ? `PA ${s.pas}/${s.pad}` : null,
                    s.glicemia ? `glicemia ${s.glicemia}` : null,
                    s.peso ? `peso ${s.peso} kg` : null,
                    s.temperatura ? `${s.temperatura} °C` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
            {estado.ocorrencias.map((o) => (
              <li key={o.id} className="rounded-xl bg-warning/10 p-3 text-sm">
                <span className="font-bold text-navy">
                  {estado.residentes.find((r) => r.id === o.residenteId)?.nome}
                </span>{" "}
                <span className="text-muted-foreground">
                  {formatarHora(o.quando)} · {o.texto}
                </span>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      <NavInferior />
    </main>
  );
}
