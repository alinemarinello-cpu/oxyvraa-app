import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, KeyRound, Plus, Printer, ShieldCheck, Trash2, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  carregarUnidade,
  excluirColaboradora,
  excluirDespesa,
  excluirPagamento,
  excluirPin,
  listarColaboradoras,
  listarDespesas,
  listarPagamentos,
  listarPins,
  salvarColaboradora,
  salvarDespesa,
  salvarLocais,
  salvarPagamento,
  salvarPin,
  salvarUnidade,
  type Unidade,
} from "@/lib/painel-db";
import { alertaAlvara, enviarArquivo, urlAssinada } from "@/lib/biosseguranca-db";
import {
  AMBIENTES_ALL,
  CORES_LIMPEZA,
  CORES_LIMPEZA_LIST,
  TURNOS,
  TURNO_META,
  getAmbienteMeta,
  type CorLimpeza,
  type LocalAmbiente,
} from "@/lib/oxyvra-store";

export const Route = createFileRoute("/_authenticated/painel/unidades/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da unidade — Oxyvra" },
      {
        name: "description",
        content: "Ambientes, QR Codes, equipe e contrato de uma unidade monitorada.",
      },
      { property: "og:title", content: "Detalhe da unidade — Oxyvra" },
      {
        property: "og:description",
        content: "Ambientes, QR Codes, equipe e contrato de uma unidade monitorada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnidadeDetalhe,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

/** Alvará sanitário e responsável técnico da unidade, com aviso de vencimento. */
function LicencaSanitaria({ unidade, aoSalvar }: { unidade: Unidade; aoSalvar: () => void }) {
  const [numero, setNumero] = useState(unidade.alvara_sanitario_numero ?? "");
  const [expira, setExpira] = useState(unidade.alvara_sanitario_expiracao ?? "");
  const [rt, setRt] = useState(unidade.responsavel_tecnico ?? "");
  const [conselho, setConselho] = useState(unidade.conselho_rt ?? "");
  const aviso = alertaAlvara(expira || null);

  const gravar = async () => {
    try {
      await salvarUnidade({
        ...unidade,
        alvara_sanitario_numero: numero || null,
        alvara_sanitario_expiracao: expira || null,
        responsavel_tecnico: rt || null,
        conselho_rt: conselho || null,
      });
      aoSalvar();
      toast.success("Licenciamento sanitário atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar o alvará.");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-black text-foreground">
          <ShieldCheck className="mr-1 inline h-4 w-4 text-teal" /> Licenciamento sanitário
        </h3>
        <p className="text-xs text-muted-foreground">
          Alvará da Vigilância Sanitária e responsável técnico. O painel avisa aos 60, 30 e 15 dias
          do vencimento.
        </p>
      </div>
      {aviso && (
        <p className={`mb-3 text-xs font-bold ${aviso.tom}`}>
          <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
          {aviso.label}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className={rotulo}>
          Número do alvará
          <input className={campo} value={numero} onChange={(e) => setNumero(e.target.value)} />
        </label>
        <label className={rotulo}>
          Vencimento do alvará
          <input
            type="date"
            className={campo}
            value={expira}
            onChange={(e) => setExpira(e.target.value)}
          />
        </label>
        <label className={rotulo}>
          Responsável técnico
          <input
            className={campo}
            value={rt}
            onChange={(e) => setRt(e.target.value)}
            placeholder="Biomédica, esteticista ou enfermeira RT"
          />
        </label>
        <label className={rotulo}>
          Registro no conselho
          <input
            className={campo}
            value={conselho}
            onChange={(e) => setConselho(e.target.value)}
            placeholder="CRBM / COREN / CRO"
          />
        </label>
      </div>
      <button
        onClick={() => void gravar()}
        className="mt-3 rounded-xl bg-teal px-3 py-2 text-xs font-black text-teal-foreground"
      >
        Salvar licenciamento
      </button>
    </section>
  );
}

/** PINs de 4 dígitos por turno/equipe, com papel de operador ou supervisor. */
function PinsAcesso({ unitId }: { unitId: string }) {
  const pins = useQuery({
    queryKey: ["unit-pins", unitId],
    queryFn: () => listarPins(unitId),
  });
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [papel, setPapel] = useState<"operador" | "supervisor">("operador");

  const adicionar = async () => {
    try {
      await salvarPin({ unit_id: unitId, nome, pin, papel, ativo: true });
      setNome("");
      setPin("");
      setPapel("operador");
      void pins.refetch();
      toast.success("PIN criado. Passe o número à equipe.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar o PIN.");
    }
  };

  const alternar = async (p: NonNullable<typeof pins.data>[number]) => {
    try {
      await salvarPin({ ...p, ativo: !p.ativo });
      void pins.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar o PIN.");
    }
  };

  const remover = async (pinId: string) => {
    try {
      await excluirPin(pinId);
      void pins.refetch();
      toast.success("PIN removido.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover o PIN.");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-black text-foreground">
          <KeyRound className="mr-1 inline h-4 w-4 text-teal" /> PINs de acesso por turno
        </h3>
        <p className="text-xs text-muted-foreground">
          Crie um PIN de 4 números para cada turno ou equipe. O PIN de supervisor também aprova e
          reprova as limpezas no app de campo.
        </p>
      </div>

      <div className="grid items-end gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <label className={rotulo}>
          Nome do turno/equipe
          <input
            className={campo}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Manhã, Tarde, Equipe Ana"
          />
        </label>
        <label className={rotulo}>
          PIN (4 números)
          <input
            className={campo}
            value={pin}
            inputMode="numeric"
            maxLength={4}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="0000"
          />
        </label>
        <label className={rotulo}>
          Papel
          <select
            className={campo}
            value={papel}
            onChange={(e) => setPapel(e.target.value as "operador" | "supervisor")}
          >
            <option value="operador">Equipe (operador)</option>
            <option value="supervisor">Supervisor do turno</option>
          </select>
        </label>
        <button
          onClick={() => void adicionar()}
          disabled={!nome.trim() || pin.length !== 4}
          className="h-10 rounded-xl bg-teal px-3 text-xs font-black text-teal-foreground disabled:opacity-40"
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" /> Criar PIN
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {(pins.data ?? []).map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2"
          >
            <span className="rounded-lg bg-secondary px-2 py-1 text-sm font-black tracking-widest text-foreground">
              {p.pin}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{p.nome}</p>
              <p className="text-xs text-muted-foreground">
                {p.papel === "supervisor" ? "Supervisor" : "Equipe"}
                {!p.ativo && " · desativado"}
              </p>
            </div>
            <button
              onClick={() => void alternar(p)}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              {p.ativo ? "Desativar" : "Reativar"}
            </button>
            <button
              onClick={() => void remover(p.id)}
              className="rounded-xl border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive"
              aria-label={`Remover PIN ${p.nome}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {pins.data && pins.data.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhum PIN extra ainda — o PIN principal da unidade continua valendo.
          </p>
        )}
      </div>
    </section>
  );
}

function UnidadeDetalhe() {
  const { id } = Route.useParams();
  const unidade = useQuery({ queryKey: ["unidade", id], queryFn: () => carregarUnidade(id) });
  const equipe = useQuery({ queryKey: ["equipe", id], queryFn: () => listarColaboradoras(id) });
  const prefId = unidade.data?.prefeitura_id;
  const pagamentos = useQuery({
    queryKey: ["pagamentos", prefId],
    queryFn: () => listarPagamentos(prefId!),
    enabled: !!prefId,
  });
  const despesas = useQuery({
    queryKey: ["despesas", prefId],
    queryFn: () => listarDespesas(prefId!),
    enabled: !!prefId,
  });

  const [locais, setLocais] = useState<LocalAmbiente[]>([]);
  useEffect(() => {
    if (unidade.data) setLocais(unidade.data.locais ?? []);
  }, [unidade.data]);

  const adicionarLocal = () => {
    setLocais((l) => [
      ...l,
      {
        id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tipo: AMBIENTES_ALL[0] ?? "banheiro",
        nome: "",
        cor: "azul",
        areaM2: undefined,
      },
    ]);
  };

  const gravarLocais = async () => {
    const validos = locais.filter((l) => l.nome.trim());
    try {
      const salvos = await salvarLocais(id, validos);
      setLocais(salvos);
      void unidade.refetch();
      toast.success("Ambientes salvos.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar ambientes.");
    }
  };

  const receita = (pagamentos.data ?? []).reduce((s, p) => s + p.valor, 0);
  const custo = (despesas.data ?? []).reduce((s, d) => s + d.valor, 0);

  if (unidade.isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (!unidade.data)
    return <p className="text-sm text-muted-foreground">Unidade não encontrada.</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/painel/unidades"
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para unidades
          </Link>
          <h2 className="text-lg font-black text-foreground">{unidade.data.nome}</h2>
          <p className="text-sm text-muted-foreground">
            {unidade.data.bairro} · PIN {unidade.data.pin || "—"} ·{" "}
            {(unidade.data.locais ?? []).length} ambiente(s)
          </p>
        </div>
        <a
          href={`/etiquetas/${id}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-black text-primary-foreground"
        >
          <Printer className="h-4 w-4" /> Gerar PDF de QR Codes em lote
        </a>
      </header>

      {/* -------- Licenciamento sanitário -------- */}
      <LicencaSanitaria unidade={unidade.data} aoSalvar={() => void unidade.refetch()} />

      {/* -------- PINs de acesso por turno -------- */}
      <PinsAcesso unitId={id} />

      {/* -------- Ambientes / locais -------- */}

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-foreground">Ambientes e locais</h3>
            <p className="text-xs text-muted-foreground">
              Cada local recebe um QR Code único usado pelo operador antes de iniciar a limpeza.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={adicionarLocal}
              className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar ambiente
            </button>
            <button
              onClick={gravarLocais}
              className="rounded-xl bg-teal px-3 py-2 text-xs font-black text-teal-foreground"
            >
              Salvar ambientes
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {locais.map((l, idx) => (
            <div
              key={l.id}
              className="grid items-end gap-2 rounded-xl border border-border p-3 sm:grid-cols-2 lg:grid-cols-6"
            >
              <label className={rotulo}>
                Nome do local
                <input
                  className={campo}
                  placeholder="Ex.: Cozinha Central — Setor A"
                  value={l.nome}
                  onChange={(e) =>
                    setLocais((v) =>
                      v.map((x, i) => (i === idx ? { ...x, nome: e.target.value } : x)),
                    )
                  }
                />
              </label>
              <label className={rotulo}>
                Tipo de ambiente
                <select
                  className={campo}
                  value={l.tipo}
                  onChange={(e) =>
                    setLocais((v) =>
                      v.map((x, i) => (i === idx ? { ...x, tipo: e.target.value } : x)),
                    )
                  }
                >
                  {AMBIENTES_ALL.map((a) => (
                    <option key={a} value={a}>
                      {getAmbienteMeta(a).label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={rotulo}>
                Cor do kit
                <select
                  className={campo}
                  value={l.cor ?? "azul"}
                  onChange={(e) =>
                    setLocais((v) =>
                      v.map((x, i) =>
                        i === idx ? { ...x, cor: e.target.value as CorLimpeza } : x,
                      ),
                    )
                  }
                >
                  {CORES_LIMPEZA_LIST.map((c) => (
                    <option key={c} value={c}>
                      {CORES_LIMPEZA[c].label} — {CORES_LIMPEZA[c].uso}
                    </option>
                  ))}
                </select>
              </label>
              <label className={rotulo}>
                Área (m²)
                <input
                  type="number"
                  className={campo}
                  value={l.areaM2 ?? ""}
                  onChange={(e) =>
                    setLocais((v) =>
                      v.map((x, i) =>
                        i === idx
                          ? { ...x, areaM2: e.target.value ? Number(e.target.value) : undefined }
                          : x,
                      ),
                    )
                  }
                />
              </label>
              <FotoAmbiente
                unitId={id}
                caminho={l.foto}
                aoEnviar={(caminho) =>
                  setLocais((v) => v.map((x, i) => (i === idx ? { ...x, foto: caminho } : x)))
                }
              />
              <button
                onClick={() => setLocais((v) => v.filter((_, i) => i !== idx))}
                className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-destructive/40 px-3 text-xs font-bold text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </button>
            </div>
          ))}
          {!locais.length && (
            <p className="text-sm text-muted-foreground">
              Nenhum ambiente cadastrado nesta unidade.
            </p>
          )}
        </div>
      </section>

      {/* -------- Equipe e escala -------- */}
      <EquipeSecao unitId={id} equipe={equipe} />

      {/* -------- Contrato / financeiro -------- */}
      {prefId && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-foreground">
            <Wallet className="h-4 w-4 text-teal" /> Contrato do cliente
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Receita R$ {receita.toFixed(2)} · Despesas R$ {custo.toFixed(2)} · Margem R${" "}
            {(receita - custo).toFixed(2)}
          </p>

          <FinanceiroForm
            prefeituraId={prefId}
            onSalvo={() => {
              void pagamentos.refetch();
              void despesas.refetch();
            }}
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black uppercase text-muted-foreground">Pagamentos</p>
              <ul className="space-y-1 text-sm">
                {(pagamentos.data ?? []).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span>
                      {p.competencia} · R$ {p.valor.toFixed(2)} · vence {p.vencimento}
                      {p.pago_em ? " · pago" : ""}
                    </span>
                    <button
                      onClick={async () => {
                        await excluirPagamento(p.id);
                        void pagamentos.refetch();
                      }}
                      className="text-destructive"
                      aria-label="Excluir pagamento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {!(pagamentos.data ?? []).length && (
                  <li className="text-muted-foreground">Nenhum pagamento lançado.</li>
                )}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase text-muted-foreground">Despesas</p>
              <ul className="space-y-1 text-sm">
                {(despesas.data ?? []).map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                  >
                    <span>
                      {d.data} · {d.categoria} · {d.descricao} · R$ {d.valor.toFixed(2)}
                    </span>
                    <button
                      onClick={async () => {
                        await excluirDespesa(d.id);
                        void despesas.refetch();
                      }}
                      className="text-destructive"
                      aria-label="Excluir despesa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {!(despesas.data ?? []).length && (
                  <li className="text-muted-foreground">Nenhuma despesa lançada.</li>
                )}
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function EquipeSecao({
  unitId,
  equipe,
}: {
  unitId: string;
  equipe: ReturnType<typeof useQuery<Awaited<ReturnType<typeof listarColaboradoras>>>>;
}) {
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [turnos, setTurnos] = useState<string[]>([]);

  const adicionar = async () => {
    if (!nome.trim()) return;
    try {
      await salvarColaboradora({ unit_id: unitId, nome, pin: pin || null, turnos });
      setNome("");
      setPin("");
      setTurnos([]);
      void equipe.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar colaboradora.");
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
        <Users className="h-4 w-4 text-teal" /> Equipe e escala
      </h3>

      <div className="grid gap-2 sm:grid-cols-4">
        <input
          className={campo}
          placeholder="Nome da colaboradora"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <input
          className={campo}
          placeholder="PIN (4 dígitos)"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        />
        <div className="flex items-center gap-2">
          {TURNOS.map((t) => (
            <button
              key={t}
              onClick={() =>
                setTurnos((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]))
              }
              className={`h-10 flex-1 rounded-xl border text-xs font-bold ${
                turnos.includes(t)
                  ? "border-teal bg-teal text-teal-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {TURNO_META[t].emoji} {TURNO_META[t].label}
            </button>
          ))}
        </div>
        <button
          onClick={adicionar}
          className="h-10 rounded-xl bg-teal text-sm font-black text-teal-foreground"
        >
          Adicionar
        </button>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {(equipe.data ?? []).map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
          >
            <span>
              {c.nome} · PIN {c.pin ?? "—"} ·{" "}
              {(c.turnos ?? []).map((t) => TURNO_META[t as keyof typeof TURNO_META]?.label).join(", ") ||
                "sem escala"}
            </span>
            <button
              onClick={async () => {
                await excluirColaboradora(c.id);
                void equipe.refetch();
              }}
              className="text-destructive"
              aria-label="Excluir colaboradora"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {!(equipe.data ?? []).length && (
          <li className="text-muted-foreground">Nenhuma colaboradora cadastrada.</li>
        )}
      </ul>
    </section>
  );
}

function FinanceiroForm({
  prefeituraId,
  onSalvo,
}: {
  prefeituraId: string;
  onSalvo: () => void;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [competencia, setCompetencia] = useState(hoje.slice(0, 7));
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("produtos");

  return (
    <div className="grid gap-2 lg:grid-cols-2">
      <div className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-3">
        <input
          className={campo}
          placeholder="Competência (AAAA-MM)"
          value={competencia}
          onChange={(e) => setCompetencia(e.target.value)}
        />
        <input
          className={campo}
          type="number"
          placeholder="Valor recebido"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <button
          onClick={async () => {
            if (!valor) return;
            await salvarPagamento({
              prefeitura_id: prefeituraId,
              competencia,
              valor: Number(valor),
              vencimento: `${competencia}-10`,
              pago_em: null,
              metodo: null,
              observacao: null,
            });
            setValor("");
            onSalvo();
          }}
          className="h-10 rounded-xl bg-primary text-sm font-black text-primary-foreground"
        >
          Lançar pagamento
        </button>
      </div>

      <div className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-4">
        <select
          className={campo}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="produtos">Produtos</option>
          <option value="pessoal">Pessoal</option>
          <option value="equipamentos">Equipamentos</option>
          <option value="transporte">Transporte</option>
          <option value="outros">Outros</option>
        </select>
        <input
          className={campo}
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input
          className={campo}
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <button
          onClick={async () => {
            if (!valor || !descricao) return;
            await salvarDespesa({
              prefeitura_id: prefeituraId,
              data: hoje,
              categoria,
              descricao,
              valor: Number(valor),
            });
            setDescricao("");
            setValor("");
            onSalvo();
          }}
          className="h-10 rounded-xl bg-primary text-sm font-black text-primary-foreground"
        >
          Lançar despesa
        </button>
      </div>
    </div>
  );
}

function FotoAmbiente({
  unitId,
  caminho,
  aoEnviar,
}: {
  unitId: string;
  caminho?: string;
  aoEnviar: (caminho: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    if (!caminho) {
      setUrl(null);
      return;
    }
    void urlAssinada(caminho).then((u) => {
      if (ativo) setUrl(u);
    });
    return () => {
      ativo = false;
    };
  }, [caminho]);

  return (
    <label className={rotulo}>
      Foto do ambiente
      <span className="flex items-center gap-2">
        {url ? (
          <img
            src={url}
            alt="Foto do ambiente registrada na visita técnica"
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : null}
        <span className="inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl border border-border px-3 text-xs font-bold">
          {enviando ? "Enviando…" : caminho ? "Trocar foto" : "Adicionar foto"}
        </span>
      </span>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = "";
          if (!arquivo) return;
          setEnviando(true);
          try {
            const novo = await enviarArquivo(`visitas/${unitId}`, arquivo);
            aoEnviar(novo);
            toast.success("Foto anexada. Clique em Salvar ambientes.");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Falha ao enviar foto.");
          } finally {
            setEnviando(false);
          }
        }}
      />
    </label>
  );
}
