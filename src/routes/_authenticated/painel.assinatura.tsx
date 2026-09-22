import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, CreditCard, PackageCheck, ShieldCheck, Truck, UserRound } from "lucide-react";
import {
  obterResponsavelConta,
  salvarResponsavelConta,
} from "@/lib/compliance.functions";
import {
  listarRemessasInsumos,
  salvarCadeiras,
  salvarEnderecoEntrega,
} from "@/lib/assinatura.functions";
import {
  ADDON_INSUMOS,
  PLANOS,
  STATUS_LABEL,
  brl,
  diasRestantes,
  planoPorId,
  trialAtivo,
  valorAddonAnualTotal,
  valorAddonInsumos,
  type CicloCobranca,
  type PlanoId,
} from "@/lib/planos-oxyvra";
import { useAssinatura } from "@/hooks/useAssinatura";
import { BotaoPagamento } from "@/components/BotaoPagamento";

export const Route = createFileRoute("/_authenticated/painel/assinatura")({
  head: () => ({
    meta: [
      { title: "Planos e assinatura — Oxyvra Conformidade" },
      {
        name: "description",
        content:
          "Escolha o plano Consultório ou Clínica, ative o kit mensal de insumos hospitalares e gerencie a cobrança da sua conta Oxyvra.",
      },
      { property: "og:title", content: "Planos e assinatura — Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Assinatura, cobrança e envio recorrente de insumos da plataforma Oxyvra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssinaturaPage,
});

const CAMPOS = [
  { chave: "responsavel_nome", label: "Nome do responsável pela conta" },
  { chave: "responsavel_cargo", label: "Cargo / função" },
  { chave: "responsavel_email", label: "E-mail do responsável" },
  { chave: "responsavel_telefone", label: "Telefone / WhatsApp" },
  { chave: "responsavel_cpf", label: "CPF do responsável" },
  { chave: "cnpj", label: "CNPJ da empresa" },
  { chave: "email_contato", label: "E-mail de cobrança" },
] as const;

const ENTREGA = [
  { chave: "entrega_destinatario", label: "Nome de quem recebe" },
  { chave: "entrega_documento", label: "CNPJ / CPF do destinatário" },
  { chave: "entrega_cep", label: "CEP" },
  { chave: "entrega_rua", label: "Rua / logradouro" },
  { chave: "entrega_numero", label: "Número" },
  { chave: "entrega_complemento", label: "Complemento" },
  { chave: "entrega_cidade", label: "Cidade" },
  { chave: "entrega_uf", label: "Estado (UF)" },
] as const;

type Form = Record<string, string>;

const inputCls =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium normal-case text-foreground";

function AssinaturaPage() {
  const queryClient = useQueryClient();
  const { assinatura, isLoading, isError, error, refetch } = useAssinatura();
  const [ciclo, setCiclo] = useState<CicloCobranca>("ANNUAL");
  const [addon, setAddon] = useState(false);
  const [cadeiras, setCadeiras] = useState(1);
  const organizacaoId = (assinatura as { organizacao_id?: string } | null)?.organizacao_id ?? null;

  const salvarCadeirasMut = useMutation({
    mutationFn: salvarCadeiras,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assinatura"] });
      toast.success("Quantidade de cadeiras atualizada");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar cadeiras"),
  });

  useEffect(() => {
    if (assinatura) {
      setCiclo(assinatura.ciclo);
      setAddon(assinatura.kit_insumos);
      setCadeiras(Math.max(1, assinatura.cadeiras ?? 1));
    }
  }, [assinatura]);

  if (isError)
    return (
      <div className="rounded-2xl border border-destructive/30 bg-card p-6">
        <h2 className="text-lg font-black text-foreground">
          Não foi possível carregar sua assinatura
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {(error as Error | null)?.message ?? "Tente novamente em alguns instantes."}
        </p>
        <button
          onClick={() => void refetch()}
          className="mt-4 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground"
        >
          Tentar novamente
        </button>
      </div>
    );

  if (isLoading || !assinatura)
    return <p className="text-sm text-muted-foreground">Carregando sua assinatura…</p>;

  const emTeste = trialAtivo(assinatura);
  const dias = diasRestantes(assinatura.trial_fim);
  const plano = planoPorId(assinatura.plano);


  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-teal" />
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Situação da sua conta
          </h2>
        </div>
        <p className="mt-3 text-3xl font-black text-foreground">
          {STATUS_LABEL[assinatura.status]}
        </p>
        {emTeste && (
          <p className="mt-1 text-sm text-muted-foreground">
            Teste grátis de 7 dias sem cartão — restam <strong>{dias} dia(s)</strong>. Durante o
            teste, os PDFs saem com a marca d’água <em>“TESTE — SEM VALIDADE SANITÁRIA”</em> e o
            selo digital público fica inativo.
          </p>
        )}
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info titulo="Plano atual" valor={plano.nome} />
          <Info
            titulo="Unidades liberadas"
            valor={`${assinatura.unidades_permitidas} unidade(s)`}
          />
          <Info
            titulo="Cadeiras / equipos"
            valor={`${assinatura.cadeiras ?? 1} cadastrada(s)`}
          />
          <Info
            titulo={assinatura.status === "ACTIVE" ? "Próxima cobrança" : "Fim do teste"}
            valor={new Date(
              assinatura.status === "ACTIVE" && assinatura.periodo_fim
                ? assinatura.periodo_fim
                : assinatura.trial_fim,
            ).toLocaleDateString("pt-BR")}
          />
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Precisa de segunda via, trocar a forma de pagamento ou cancelar? Fale com o comercial da
          Oxyvra pelo WhatsApp.
        </p>
        <Link
          to="/onboarding/step-1"
          className="mt-4 inline-flex h-10 items-center rounded-xl border border-border px-4 text-xs font-black text-foreground"
        >
          Refazer a configuração inicial em 3 passos
        </Link>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Escolha seu plano
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mensal recorrente no cartão ou anual à vista por PIX, boleto ou cartão.
        </p>

        <div className="mt-4 inline-flex rounded-xl bg-secondary p-1">
          {(["MONTHLY", "ANNUAL"] as CicloCobranca[]).map((c) => (
            <button
              key={c}
              onClick={() => setCiclo(c)}
              className={`rounded-lg px-4 py-2 text-sm font-black ${
                ciclo === c ? "bg-teal text-teal-foreground" : "text-muted-foreground"
              }`}
            >
              {c === "MONTHLY" ? "Mensal" : "Anual (economize)"}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {PLANOS.map((p) => {
            const valorPlano = ciclo === "ANNUAL" ? p.precoAnualTotal : p.precoMensal;
            const atual = assinatura.plano === p.id && assinatura.status === "ACTIVE";
            return (
              <article
                key={p.id}
                className="rounded-2xl border border-border p-5"
              >
                <h3 className="text-lg font-black text-foreground">{p.nome}</h3>
                <p className="text-xs font-bold uppercase text-muted-foreground">{p.resumo}</p>
                <p className="mt-3 text-3xl font-black text-foreground">
                   {brl(valorPlano)}
                   <span className="text-sm font-bold text-muted-foreground">{ciclo === "ANNUAL" ? "/ano" : "/mês"}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {ciclo === "ANNUAL"
                    ? "À vista por PIX, boleto ou cartão — pague 10 meses e use 12"
                    : "Crédito mensal recorrente, sem comprometer o limite total do cartão"}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {p.destaques.map((d) => (
                    <li key={d} className="flex gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      {d}
                    </li>
                  ))}
                </ul>
                <BotaoPagamento
                  plano={p.id}
                  ciclo={ciclo}
                  kit={addon}
                  organizacaoId={organizacaoId}
                  rotulo={
                    atual
                      ? "Alterar assinatura"
                      : p.id === "CONSULTORIO"
                        ? "Assinar Conformidade Agora"
                        : "Assinar Clínica Agora"
                  }
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-black text-teal-foreground"
                />
              </article>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-gold/50 bg-gold/10 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={addon}
              onChange={(e) => setAddon(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-black text-foreground">
                <Truck className="h-4 w-4" /> {ADDON_INSUMOS.nome}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Preço por cadeira/equipo odontológico. O kit enviado aumenta proporcionalmente.
              </span>
            </span>
          </label>

          {addon && (
            <div className="mt-4 grid gap-4 border-t border-gold/30 pt-4 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Quantidade de cadeiras / equipos odontológicos
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={cadeiras}
                  onChange={(e) =>
                    setCadeiras(Math.max(1, Math.min(50, Math.round(Number(e.target.value) || 1))))
                  }
                  className={inputCls}
                />
              </label>
              <button
                type="button"
                disabled={salvarCadeirasMut.isPending}
                onClick={() => salvarCadeirasMut.mutate({ data: { cadeiras } })}
                className="self-end rounded-xl bg-gold px-4 py-2 text-sm font-black text-gold-foreground disabled:opacity-50"
              >
                {salvarCadeirasMut.isPending ? "Salvando…" : "Salvar quantidade"}
              </button>
              <div className="rounded-xl bg-secondary p-3 text-sm">
                <p className="text-xs font-bold uppercase text-muted-foreground">Total do add-on</p>
                <p className="text-2xl font-black text-foreground">
                  {brl(valorAddonInsumos(ciclo, cadeiras))}
                  <span className="text-sm font-bold text-muted-foreground">/mês</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {ciclo === "ANNUAL"
                    ? `12x de ${brl(valorAddonInsumos("ANNUAL", cadeiras))} — total ${brl(valorAddonAnualTotal(cadeiras))}/ano`
                    : `${cadeiras} cadeira(s) × ${brl(ADDON_INSUMOS.precoPorCadeiraMensal)}`}
                </p>
              </div>
            </div>
          )}

          <ul className="mt-4 space-y-1">
            {ADDON_INSUMOS.itens.map((item) => (
              <li key={item.nome} className="flex gap-2 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  <b>{item.nome}</b>{" "}
                  <span className="text-muted-foreground">({item.detalhe})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          O pagamento é feito na página segura do Mercado Pago. Assim que for confirmado, a conta é
          liberada automaticamente.
        </p>
      </section>

      {(addon || assinatura.kit_insumos) && <EnderecoEntrega />}
      {assinatura.kit_insumos && <Remessas />}

      <ResponsavelConta />

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal" />
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
            Liberação automática
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Assim que o pagamento é confirmado, a conta passa a ativa: a marca d’água some dos PDFs,
          o selo digital com QR Code público é ligado e, no plano com kit, a ordem de despacho dos
          insumos é aberta automaticamente. Pagamento em atraso ou cancelamento suspende o painel
          sem perda de dados.
        </p>
      </section>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-secondary p-4">
      <dt className="text-xs font-bold uppercase text-muted-foreground">{titulo}</dt>
      <dd className="text-sm font-black text-foreground">{valor}</dd>
    </div>
  );
}


function EnderecoEntrega() {
  const { assinatura } = useAssinatura();
  const gravar = useServerFn(salvarEnderecoEntrega);
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (assinatura) {
      const inicial: Form = {};
      for (const c of ENTREGA) inicial[c.chave] = (assinatura as unknown as Form)[c.chave] ?? "";
      setForm(inicial);
    }
  }, [assinatura]);

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <PackageCheck className="h-5 w-5 text-teal" />
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Endereço de entrega do kit
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Endereço usado no envio mensal dos insumos hospitalares. O checkout também coleta esses
        dados, e você pode ajustá-los aqui a qualquer momento.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ENTREGA.map((c) => (
          <label key={c.chave} className="text-xs font-bold uppercase text-muted-foreground">
            {c.label}
            <input
              value={form[c.chave] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [c.chave]: e.target.value }))}
              className={inputCls}
            />
          </label>
        ))}
      </div>
      <button
        disabled={salvando}
        onClick={async () => {
          setSalvando(true);
          try {
            const payload: Record<string, string | null> = {};
            for (const [k, v] of Object.entries(form)) payload[k] = v.trim() || null;
            await gravar({ data: payload });
            await qc.invalidateQueries({ queryKey: ["assinatura"] });
            toast.success("Endereço de entrega salvo.");
          } catch (e) {
            toast.error((e as Error).message);
          } finally {
            setSalvando(false);
          }
        }}
        className="mt-4 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-60"
      >
        {salvando ? "Salvando…" : "Salvar endereço de entrega"}
      </button>
    </section>
  );
}

const STATUS_REMESSA: Record<string, string> = {
  PREPARING: "Preparando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
};

function Remessas() {
  const carregar = useServerFn(listarRemessasInsumos);
  const { data } = useQuery({
    queryKey: ["remessas-insumos"],
    queryFn: () => carregar({ data: {} }),
  });
  const lista = (data ?? []) as Array<Record<string, string | null>>;

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-teal" />
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Envios do kit de insumos
        </h2>
      </div>
      {lista.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum envio registrado ainda. O primeiro despacho é aberto assim que o pagamento é
          confirmado.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lista.map((r) => (
            <li
              key={String(r.id)}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary p-3 text-sm"
            >
              <span className="font-black text-foreground">
                {r.referencia_periodo ?? "Kit mensal"}
              </span>
              <span className="text-muted-foreground">
                {STATUS_REMESSA[String(r.status)] ?? r.status}
                {r.codigo_rastreio ? ` • rastreio ${r.codigo_rastreio}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ResponsavelConta() {
  const carregar = useServerFn(obterResponsavelConta);
  const gravar = useServerFn(salvarResponsavelConta);
  const { data } = useQuery({
    queryKey: ["responsavel-conta"],
    queryFn: () => carregar({ data: {} }),
  });
  const [form, setForm] = useState<Form>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (data) {
      const inicial: Form = {};
      for (const c of CAMPOS) inicial[c.chave] = (data as Form)[c.chave] ?? "";
      inicial["responsavel_observacoes"] = (data as Form)["responsavel_observacoes"] ?? "";
      setForm(inicial);
    }
  }, [data]);

  async function salvar() {
    if (!form["responsavel_nome"]?.trim()) {
      toast.error("Informe o nome do responsável pela conta.");
      return;
    }
    setSalvando(true);
    try {
      const payload: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(form)) payload[k] = v.trim() || null;
      await gravar({ data: payload });
      toast.success("Dados do responsável salvos.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <UserRound className="h-5 w-5 text-teal" />
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground">
          Responsável pela conta
        </h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Pessoa que responde pela contratação: usamos estes dados para cobrança, suporte e avisos
        importantes.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {CAMPOS.map((c) => (
          <label key={c.chave} className="text-xs font-bold uppercase text-muted-foreground">
            {c.label}
            <input
              value={form[c.chave] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [c.chave]: e.target.value }))}
              className={inputCls}
            />
          </label>
        ))}
        <label className="text-xs font-bold uppercase text-muted-foreground sm:col-span-2">
          Observações
          <textarea
            rows={2}
            value={form["responsavel_observacoes"] ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, responsavel_observacoes: e.target.value }))}
            className={inputCls}
          />
        </label>
      </div>
      <button
        onClick={salvar}
        disabled={salvando}
        className="mt-4 rounded-xl bg-teal px-4 py-2.5 text-sm font-black text-teal-foreground disabled:opacity-60"
      >
        {salvando ? "Salvando…" : "Salvar dados do responsável"}
      </button>
    </section>
  );
}
