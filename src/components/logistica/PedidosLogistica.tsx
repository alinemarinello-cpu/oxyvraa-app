import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Package, PlusCircle, Trash2, Truck } from "lucide-react";
import { PinMap, type UnitMarker } from "@/components/PinMap";
import {
  adicionarItem,
  atualizarPedido,
  competenciaAtual,
  corStatus,
  criarPedido,
  excluirItem,
  excluirPedido,
  listarItens,
  listarPedidos,
  marcarEntregue,
  rotuloStatus,
  STATUS_PEDIDO,
} from "@/lib/logistica-db";

type Opcao = {
  id: string;
  nome: string;
  prefeitura_id?: string;
  lat?: number | null;
  lng?: number | null;
};

const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MAPA_CORES: Record<string, string> = {
  rascunho: "#94A3B8",
  solicitado: "#0B2238",
  aprovado: "#0D9488",
  em_compra: "#D4AF37",
  em_transito: "#2563EB",
  entregue: "#16A34A",
  cancelado: "#E11D48",
};

const MAPA_EMOJI: Record<string, string> = {
  rascunho: "📝",
  solicitado: "📦",
  aprovado: "✅",
  em_compra: "🛒",
  em_transito: "🚚",
  entregue: "🏁",
  cancelado: "⛔",
};


export default function PedidosLogistica({
  organizacaoId,
  clientes,
  unidades,
  podeExcluir = false,
}: {
  organizacaoId: string;
  clientes: Opcao[];
  unidades: Opcao[];
  podeExcluir?: boolean;
}) {
  const qc = useQueryClient();
  const [prefeituraId, setPrefeituraId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [competencia, setCompetencia] = useState(competenciaAtual());
  const [fornecedor, setFornecedor] = useState("");
  const [previsao, setPrevisao] = useState("");
  const [obs, setObs] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [salvando, setSalvando] = useState(false);

  const { data: pedidos = [] } = useQuery({ queryKey: ["pedidos-insumos"], queryFn: listarPedidos });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["pedidos-insumos"] });

  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome ?? "Cliente";
  const nomeUnidade = (id: string | null) =>
    id ? (unidades.find((u) => u.id === id)?.nome ?? "Unidade") : "Todas as unidades";

  const lista = pedidos.filter((p) => filtroStatus === "todos" || p.status === filtroStatus);

  const coordsDoPedido = (prefId: string, uId: string | null) => {
    const u = uId ? unidades.find((x) => x.id === uId) : null;
    if (u?.lat != null && u?.lng != null) return { lat: Number(u.lat), lng: Number(u.lng) };
    const c = clientes.find((x) => x.id === prefId);
    if (c?.lat != null && c?.lng != null) return { lat: Number(c.lat), lng: Number(c.lng) };
    return null;
  };

  const marcadores: UnitMarker[] = useMemo(() => {
    const seteDias = Date.now() - 7 * 86_400_000;
    return lista
      .filter((p) => {
        if (p.status === "cancelado") return false;
        if (p.status === "entregue")
          return p.entregue_em ? new Date(p.entregue_em).getTime() >= seteDias : false;
        return true;
      })
      .map((p) => {
        const coords = coordsDoPedido(p.prefeitura_id, p.unit_id);
        if (!coords) return null;
        return {
          id: p.id,
          lat: coords.lat,
          lng: coords.lng,
          label: `${nomeCliente(p.prefeitura_id)} · ${nomeUnidade(p.unit_id)} — ${rotuloStatus(p.status)}${
            p.previsao_entrega ? ` · previsão ${p.previsao_entrega}` : ""
          }`,
          color: MAPA_CORES[p.status] ?? "#0B2238",
          emoji: MAPA_EMOJI[p.status] ?? "📦",
          onClick: () => setAberto(p.id),
        } as UnitMarker;
      })
      .filter(Boolean) as UnitMarker[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, clientes, unidades]);

  const semCoordenada = lista.filter(
    (p) =>
      p.status !== "cancelado" && p.status !== "entregue" &&
      !coordsDoPedido(p.prefeitura_id, p.unit_id),
  ).length;

  const novoPedido = async () => {
    if (!prefeituraId) return toast.error("Escolha a empresa cliente.");
    setSalvando(true);
    try {
      await criarPedido({
        organizacao_id: organizacaoId,
        prefeitura_id: prefeituraId,
        unit_id: unitId || null,
        competencia,
        fornecedor: fornecedor.trim(),
        previsao_entrega: previsao || null,
        observacoes: obs.trim(),
      });
      setFornecedor("");
      setObs("");
      setUnitId("");
      toast.success("Pedido mensal criado.");
      recarregar();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
          <PlusCircle className="h-5 w-5 text-teal" /> Novo pedido mensal de insumos
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold text-muted-foreground">
            Empresa cliente
            <select
              value={prefeituraId}
              onChange={(e) => setPrefeituraId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-foreground"
            >
              <option value="">Selecione…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-muted-foreground">
            Unidade (opcional)
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-foreground"
            >
              <option value="">Todas as unidades</option>
              {unidades
                .filter((u) => !prefeituraId || u.prefeitura_id === prefeituraId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-muted-foreground">
            Competência (mês)
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-foreground"
            />
          </label>
          <label className="text-sm font-semibold text-muted-foreground">
            Fornecedor
            <input
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Ex.: Spartan / distribuidor"
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-foreground"
            />
          </label>
          <label className="text-sm font-semibold text-muted-foreground">
            Previsão de entrega
            <input
              type="date"
              value={previsao}
              onChange={(e) => setPrevisao(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-foreground"
            />
          </label>
          <label className="text-sm font-semibold text-muted-foreground">
            Observações
            <input
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-foreground"
            />
          </label>
        </div>
        <button
          onClick={novoPedido}
          disabled={salvando}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground disabled:opacity-60"
        >
          Criar pedido
        </button>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Filtrar
        </span>
        {["todos", ...STATUS_PEDIDO.map((s) => s.id)].map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              filtroStatus === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s === "todos" ? "Todos" : rotuloStatus(s)}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
            <MapPin className="h-5 w-5 text-teal" /> Mapa de acompanhamento de entregas
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
            {STATUS_PEDIDO.filter((s) => s.id !== "cancelado").map((s) => (
              <span key={s.id} className="flex items-center gap-1">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: MAPA_CORES[s.id] }}
                />
                {s.label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Pedidos em aberto e entregas concluídas nos últimos 7 dias, posicionados na unidade de
          destino. Toque no pino para abrir os itens do pedido.
        </p>
        <div className="mt-4">
          {marcadores.length > 0 ?
            <PinMap mode="view" height={340} markers={marcadores} />
          : <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum pedido com endereço geolocalizado no filtro atual.
            </p>
          }
        </div>
        {semCoordenada > 0 && (
          <p className="mt-2 text-xs font-semibold text-amber-700">
            {semCoordenada} pedido(s) em aberto sem coordenadas cadastradas na unidade/cliente — não
            aparecem no mapa.
          </p>
        )}
      </section>

      <section className="space-y-3">

        {lista.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum pedido nesse filtro.
          </p>
        )}
        {lista.map((p) => (
          <article key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-base font-black text-foreground">
                  <Package className="h-4 w-4 text-teal" />
                  {nomeCliente(p.prefeitura_id)} · {p.competencia}
                </p>
                <p className="text-sm text-muted-foreground">
                  {nomeUnidade(p.unit_id)}
                  {p.fornecedor ? ` · ${p.fornecedor}` : ""}
                  {p.previsao_entrega ? ` · previsão ${p.previsao_entrega}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${corStatus(p.status)}`}>
                  {rotuloStatus(p.status)}
                </span>
                <span className="text-sm font-black text-foreground">
                  {moeda(Number(p.valor_total))}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={p.status}
                onChange={async (e) => {
                  await atualizarPedido(p.id, { status: e.target.value });
                  recarregar();
                }}
                className="rounded-xl border border-border bg-background p-2 text-sm text-foreground"
              >
                {STATUS_PEDIDO.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                onClick={async () => {
                  const quem = window.prompt("Quem recebeu a entrega?") ?? "";
                  if (!quem.trim()) return;
                  await marcarEntregue(p.id, quem.trim());
                  toast.success("Entrega confirmada.");
                  recarregar();
                }}
                className="flex items-center gap-1 rounded-xl bg-teal px-3 py-2 text-sm font-bold text-white"
              >
                <Truck className="h-4 w-4" /> Confirmar entrega
              </button>
              <button
                onClick={() => setAberto(aberto === p.id ? null : p.id)}
                className="rounded-xl bg-muted px-3 py-2 text-sm font-bold text-foreground"
              >
                {aberto === p.id ? "Fechar itens" : "Itens do pedido"}
              </button>
              {podeExcluir && (
                <button
                  onClick={async () => {
                    if (!window.confirm("Excluir este pedido?")) return;
                    await excluirPedido(p.id);
                    recarregar();
                  }}
                  className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-bold text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {p.entregue_em && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Entregue em {new Date(p.entregue_em).toLocaleString("pt-BR")}
                {p.recebido_por ? ` · recebido por ${p.recebido_por}` : ""}
              </p>
            )}

            {aberto === p.id && <ItensPedido pedidoId={p.id} onChange={recarregar} />}
          </article>
        ))}
      </section>
    </div>
  );
}

function ItensPedido({ pedidoId, onChange }: { pedidoId: string; onChange: () => void }) {
  const qc = useQueryClient();
  const [produto, setProduto] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [quantidade, setQuantidade] = useState("1");
  const [preco, setPreco] = useState("0");

  const { data: itens = [] } = useQuery({
    queryKey: ["pedido-itens", pedidoId],
    queryFn: () => listarItens(pedidoId),
  });
  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["pedido-itens", pedidoId] });
    onChange();
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-background p-4">
      <div className="grid gap-2 sm:grid-cols-5">
        <input
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          placeholder="Produto / insumo"
          className="rounded-lg border border-border bg-card p-2 text-sm text-foreground sm:col-span-2"
        />
        <input
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          placeholder="un / L / cx"
          className="rounded-lg border border-border bg-card p-2 text-sm text-foreground"
        />
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          placeholder="Qtd"
          className="rounded-lg border border-border bg-card p-2 text-sm text-foreground"
        />
        <input
          type="number"
          step="0.01"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="Preço un."
          className="rounded-lg border border-border bg-card p-2 text-sm text-foreground"
        />
      </div>
      <button
        onClick={async () => {
          if (!produto.trim()) return toast.error("Informe o produto.");
          await adicionarItem({
            pedido_id: pedidoId,
            produto: produto.trim(),
            categoria: "insumo",
            unidade,
            quantidade: Number(quantidade) || 0,
            preco_unitario: Number(preco) || 0,
          });
          setProduto("");
          setQuantidade("1");
          setPreco("0");
          recarregar();
        }}
        className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        Adicionar item
      </button>

      <ul className="mt-3 divide-y divide-border">
        {itens.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="font-semibold text-foreground">
              {i.produto}{" "}
              <span className="font-normal text-muted-foreground">
                — {i.quantidade} {i.unidade} × {moeda(Number(i.preco_unitario))}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <strong className="text-foreground">
                {moeda(Number(i.quantidade) * Number(i.preco_unitario))}
              </strong>
              <button
                onClick={async () => {
                  await excluirItem(i.id, pedidoId);
                  recarregar();
                }}
                className="text-destructive"
                aria-label={`Remover ${i.produto}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
        {itens.length === 0 && (
          <li className="py-2 text-sm text-muted-foreground">Nenhum item lançado.</li>
        )}
      </ul>
    </div>
  );
}
