import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, CheckCircle2, QrCode, Send, Timer, XCircle } from "lucide-react";
import { QrScanner } from "@/components/QrScanner";
import { lerQrSuite, listarSuites, type Suite } from "@/lib/suites-db";
import { listarChecklists, listarItens, listarUnidades } from "@/lib/compliance-db";
import { submeterExecucao } from "@/lib/compliance.functions";
import { enfileirarExecucao } from "@/lib/compliance-fila";
import {
  exigeFoto,
  faixaTexto,
  formatarDwell,
  foraDoLimite,
  novaChaveIdempotencia,
  type ExecucaoPayload,
  type ItemChecklist,
  type RespostaPayload,
} from "@/lib/compliance-types";

export const Route = createFileRoute("/_authenticated/checklist/$id")({
  component: ExecutarChecklist,
});

type Resp = {
  conforme: boolean | null;
  valor: string;
  texto: string;
  foto: string | null;
  observacao: string;
};

const RESP_VAZIA: Resp = { conforme: null, valor: "", texto: "", foto: null, observacao: "" };

async function lerFoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

function ExecutarChecklist() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const enviar = useServerFn(submeterExecucao);

  const [iniciadaEm] = useState(() => new Date().toISOString());
  const [chave] = useState(novaChaveIdempotencia);
  const [executor, setExecutor] = useState("");
  const [unitId, setUnitId] = useState("");
  const [respostas, setRespostas] = useState<Record<number, Resp>>({});
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [erro, setErro] = useState("");
  const [suiteId, setSuiteId] = useState("");
  const [qrValidado, setQrValidado] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [travas, setTravas] = useState<Record<number, number>>({});
  const [agora, setAgora] = useState(() => Date.now());
  const [enviandoAgora, setEnviandoAgora] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["execucao-checklist", id],
    queryFn: async () => {
      const [itens, checklists, unidades] = await Promise.all([
        listarItens(id),
        listarChecklists(),
        listarUnidades(),
      ]);
      return { itens, checklist: checklists.find((c) => c.id === id) ?? null, unidades };
    },
  });

  useEffect(() => {
    if (data?.unidades.length && !unitId) setUnitId(data.unidades[0].id);
  }, [data, unitId]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoord({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setCoord(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    if (!unitId) return setSuites([]);
    let vivo = true;
    listarSuites(unitId)
      .then((s) => vivo && setSuites(s.filter((x) => x.ativo)))
      .catch(() => vivo && setSuites([]));
    return () => {
      vivo = false;
    };
  }, [unitId]);

  useEffect(() => {
    if (!Object.keys(travas).length) return;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [travas]);

  const itens = useMemo(() => data?.itens ?? [], [data]);

  /** Segundos restantes da trava sanitária do item (0 = liberado, null = sem trava). */
  function restanteTrava(item: ItemChecklist, idx: number): number | null {
    const total = item.dwell_segundos ?? 0;
    if (!total) return null;
    const inicio = travas[idx];
    if (!inicio) return total;
    return Math.max(0, total - Math.floor((agora - inicio) / 1000));
  }
  const r = (i: number) => respostas[i] ?? RESP_VAZIA;
  const set = (i: number, campos: Partial<Resp>) =>
    setRespostas((p) => ({ ...p, [i]: { ...(p[i] ?? RESP_VAZIA), ...campos } }));

  function pendencia(item: ItemChecklist, idx: number): string | null {
    const resp = r(idx);
    const numero = resp.valor === "" ? null : Number(resp.valor);
    if (item.tipo === "conforme" && resp.conforme === null) return "Responda conforme ou não";
    const restante = restanteTrava(item, idx);
    if (resp.conforme === true && restante !== null && restante > 0)
      return `Aguarde o tempo mínimo de contato (${formatarDwell(restante)})`;
    if ((item.tipo === "temperatura" || item.tipo === "numero") && numero === null)
      return "Informe a medição";
    if (item.tipo === "texto" && !resp.texto.trim()) return "Preencha a resposta";
    const fora = foraDoLimite(item, numero);
    const conforme = item.tipo === "conforme" ? resp.conforme : !fora;
    if (exigeFoto(item, conforme) && !resp.foto) return "Foto obrigatória neste item";
    return null;
  }

  async function submeter() {
    setErro("");
    if (!executor.trim()) return setErro("Informe quem está executando o checklist.");
    if (!unitId) return setErro("Selecione a unidade.");
    for (let i = 0; i < itens.length; i++) {
      const p = pendencia(itens[i], i);
      if (p) return setErro(`Item ${i + 1}: ${p}`);
    }

    const payload: ExecucaoPayload = {
      idempotencyKey: chave,
      checklistId: id,
      unitId,
      executorNome: executor.trim(),
      iniciadaEm,
      lat: coord?.lat ?? null,
      lng: coord?.lng ?? null,
      dispositivo: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
      assinatura: executor.trim(),
      suiteId: suiteId || null,
      qrValidado,
      respostas: itens.map((item, idx): RespostaPayload => {
        const resp = r(idx);
        const numero = resp.valor === "" ? null : Number(resp.valor);
        const fora = foraDoLimite(item, numero);
        return {
          itemId: item.id ?? null,
          pergunta: item.pergunta,
          tipo: item.tipo,
          critico: item.critico,
          conforme: item.tipo === "conforme" ? resp.conforme : !fora,
          valorNumero: numero,
          valorTexto: resp.texto || resp.observacao || null,
          foto: resp.foto,
          observacao: resp.observacao || null,
          registradoEm: new Date().toISOString(),
          lat: coord?.lat ?? null,
          lng: coord?.lng ?? null,
        };
      }),
    };

    setEnviandoAgora(true);
    try {
      await enviar({ data: payload });
    } catch {
      enfileirarExecucao(payload);
    } finally {
      setEnviandoAgora(false);
    }
    void navigate({ to: "/checklist" });
  }

  if (isLoading || !data) return <p className="p-6 text-sm text-muted-foreground">Carregando…</p>;

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <header>
          <h1 className="text-xl font-black text-foreground">
            {data.checklist?.titulo ?? "Checklist"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {data.checklist?.norma} · data, hora, GPS e responsável são carimbados
            automaticamente.
          </p>
        </header>

        <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
          <label className="text-xs font-bold text-muted-foreground">
            Quem está executando
            <input
              value={executor}
              onChange={(e) => setExecutor(e.target.value)}
              placeholder="Nome completo"
              className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="text-xs font-bold text-muted-foreground">
            Unidade
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm font-normal"
            >
              {data.unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {suites.length > 0 && (
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
              Suíte / unidade habitacional
            </p>
            <div className="flex gap-2">
              <select
                value={suiteId}
                onChange={(e) => {
                  setSuiteId(e.target.value);
                  setQrValidado(false);
                }}
                className="min-w-0 flex-1 rounded-lg border border-input px-3 py-2 text-sm"
              >
                <option value="">Sem suíte vinculada</option>
                {suites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.identificacao}
                    {s.bloco ? ` · ${s.bloco}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setScanner(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
              >
                <QrCode className="h-4 w-4" /> Escanear QR
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {qrValidado
                ? "QR da suíte validado — entrada registrada."
                : "Escaneie o QR fixado no hall de serviço para registrar entrada e saída."}
            </p>
          </div>
        )}

        {scanner && (
          <QrScanner
            onClose={() => setScanner(false)}
            onDetected={(raw) => {
              const lido = lerQrSuite(raw);
              const achou = lido ? suites.find((s) => s.id === lido.suiteId) : undefined;
              if (achou) {
                setSuiteId(achou.id);
                setQrValidado(true);
                setErro("");
              } else {
                setErro("QR Code não corresponde a nenhuma suíte desta unidade.");
              }
              setScanner(false);
            }}
          />
        )}

        <ol className="space-y-3">
          {itens.map((item, idx) => {
            const resp = r(idx);
            const numero = resp.valor === "" ? null : Number(resp.valor);
            const fora = foraDoLimite(item, numero);
            return (
              <li key={item.id ?? idx} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-bold text-foreground">
                  {idx + 1}. {item.pergunta}
                  {item.critico && (
                    <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-destructive">
                      crítico
                    </span>
                  )}
                </p>
                {faixaTexto(item) && (
                  <p className="mt-1 text-xs text-muted-foreground">{faixaTexto(item)}</p>
                )}

                {(() => {
                  const restante = restanteTrava(item, idx);
                  if (restante === null) return null;
                  const rodando = travas[idx] !== undefined;
                  return (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
                      <Timer className="h-4 w-4 text-teal" />
                      <span className="text-xs font-bold text-foreground">
                        Trava sanitária: {formatarDwell(restante)}
                        {restante === 0 ? " · liberado" : ""}
                      </span>
                      {!rodando && (
                        <button
                          type="button"
                          onClick={() => setTravas((p) => ({ ...p, [idx]: Date.now() }))}
                          className="ml-auto rounded-lg bg-teal px-3 py-1.5 text-xs font-black text-teal-foreground"
                        >
                          Iniciar tempo
                        </button>
                      )}
                    </div>
                  );
                })()}

                {item.tipo === "conforme" && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      disabled={(restanteTrava(item, idx) ?? 0) > 0}
                      onClick={() => set(idx, { conforme: true })}
                      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black ${
                        resp.conforme === true
                          ? "bg-teal text-teal-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Conforme
                    </button>
                    <button
                      onClick={() => set(idx, { conforme: false })}
                      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black ${
                        resp.conforme === false
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <XCircle className="h-4 w-4" /> Não conforme
                    </button>
                  </div>
                )}

                {(item.tipo === "temperatura" || item.tipo === "numero") && (
                  <input
                    type="number"
                    inputMode="decimal"
                    value={resp.valor}
                    onChange={(e) => set(idx, { valor: e.target.value })}
                    placeholder={item.unidade_medida ?? "valor medido"}
                    className="mt-3 w-full rounded-xl border border-input px-3 py-3 text-lg font-bold"
                  />
                )}

                {item.tipo === "texto" && (
                  <textarea
                    value={resp.texto}
                    onChange={(e) => set(idx, { texto: e.target.value })}
                    placeholder="Descreva"
                    className="mt-3 w-full rounded-xl border border-input px-3 py-2 text-sm"
                  />
                )}

                {item.tipo === "escolha" && (
                  <select
                    value={resp.texto}
                    onChange={(e) => set(idx, { texto: e.target.value })}
                    className="mt-3 w-full rounded-xl border border-input px-3 py-3 text-sm"
                  >
                    <option value="">Selecione…</option>
                    {item.opcoes.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}

                {fora && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Fora do limite — abre alerta e plano de
                    ação.
                  </p>
                )}

                {exigeFoto(item, item.tipo === "conforme" ? resp.conforme : !fora) && (
                  <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl bg-secondary px-3 py-3 text-xs font-black text-foreground">
                    <Camera className="h-4 w-4 text-teal" />
                    {resp.foto ? "Foto anexada — trocar" : "Anexar foto (obrigatória)"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) set(idx, { foto: await lerFoto(f) });
                      }}
                    />
                  </label>
                )}

                {resp.foto && (
                  <img
                    src={resp.foto}
                    alt={`Evidência do item ${idx + 1}`}
                    className="mt-2 h-32 w-full rounded-xl object-cover"
                  />
                )}

                <input
                  value={resp.observacao}
                  onChange={(e) => set(idx, { observacao: e.target.value })}
                  placeholder="Observação (opcional)"
                  className="mt-2 w-full rounded-lg border border-input px-3 py-2 text-xs"
                />
              </li>
            );
          })}
        </ol>

        {erro && <p className="text-sm font-bold text-destructive">{erro}</p>}

        <button
          onClick={() => void submeter()}
          disabled={enviandoAgora}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal px-4 py-4 text-sm font-black text-teal-foreground disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {enviandoAgora ? "Enviando…" : "Finalizar e enviar checklist"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Sem internet? O checklist fica salvo no aparelho e sobe sozinho depois.
        </p>
      </div>
    </main>
  );
}
