import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  ChevronRight,
  FileText,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  excluirCliente,
  excluirUnidade,
  listarClientes,
  listarUnidades,
  salvarCliente,
  salvarUnidade,
  type Cliente,
  type Unidade,
} from "@/lib/painel-db";
import { enviarArquivo, urlAssinada } from "@/lib/biosseguranca-db";
import { UNIT_TIPOS, UNIT_TIPO_META, VERTICAIS } from "@/lib/oxyvra-store";
import { useOrganizacao } from "./painel";

export const Route = createFileRoute("/_authenticated/painel/unidades/")({
  head: () => ({
    meta: [
      { title: "Unidades e clientes — Oxyvra" },
      {
        name: "description",
        content: "Cadastro de clientes, plantas e unidades monitoradas pela Oxyvra.",
      },
      { property: "og:title", content: "Unidades e clientes — Oxyvra" },
      {
        property: "og:description",
        content: "Cadastro de clientes, plantas e unidades monitoradas pela Oxyvra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnidadesPage,
});

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";
const rotulo = "text-xs font-bold text-muted-foreground";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

function UnidadesPage() {
  const { data: org } = useOrganizacao();
  const clientes = useQuery({ queryKey: ["clientes"], queryFn: listarClientes });
  const unidades = useQuery({ queryKey: ["unidades"], queryFn: listarUnidades });

  const [editandoCliente, setEditandoCliente] = useState<Partial<Cliente> | null>(null);
  const [enviandoContrato, setEnviandoContrato] = useState(false);
  const [editandoUnidade, setEditandoUnidade] = useState<Partial<Unidade> | null>(null);
  // Campos da primeira unidade criada junto com o cliente (fluxo unificado).
  const [unidadeInicial, setUnidadeInicial] = useState<Partial<Unidade> | null>(null);
  const [gpsStatus, setGpsStatus] = useState("");
  const [gpsClienteStatus, setGpsClienteStatus] = useState("");
  const [gpsUnidadeStatus, setGpsUnidadeStatus] = useState("");

  /** Captura o GPS da sede do cliente e tenta preencher cidade/UF/endereço. */
  const capturarLocalizacaoCliente = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Este dispositivo não permite captura de GPS.");
      return;
    }
    setGpsClienteStatus("Capturando GPS…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setEditandoCliente((atual) => (atual ? { ...atual, lat, lng } : atual));
        setGpsClienteStatus(`GPS: ${lat}, ${lng} (±${Math.round(pos.coords.accuracy)} m)`);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } },
          );
          const j = (await r.json()) as { display_name?: string; address?: Record<string, string> };
          const a = j.address ?? {};
          const cidade = a["city"] || a["town"] || a["village"] || a["municipality"] || "";
          const uf = (a["ISO3166-2-lvl4"] || "").split("-")[1] ?? "";
          setEditandoCliente((atual) =>
            atual
              ? {
                  ...atual,
                  cidade: atual.cidade || cidade,
                  uf: atual.uf || uf,
                  cep: atual.cep || (a["postcode"] ?? ""),
                  endereco: atual.endereco || (j.display_name ?? ""),
                }
              : atual,
          );
        } catch {
          // Sem internet: mantém apenas as coordenadas.
        }
      },
      (err) => {
        setGpsClienteStatus("");
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Libere o GPS no navegador."
            : "Não foi possível obter a localização.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };


  /** Captura o GPS do dispositivo e tenta preencher cidade/UF automaticamente. */
  const capturarLocalizacao = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Este dispositivo não permite captura de GPS.");
      return;
    }
    setGpsStatus("Capturando GPS…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setEditandoUnidade((atual) => (atual ? { ...atual, lat, lng } : atual));
        setGpsStatus(`GPS: ${lat}, ${lng} (±${Math.round(pos.coords.accuracy)} m)`);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } },
          );
          const j = (await r.json()) as {
            address?: Record<string, string>;
          };
          const a = j.address ?? {};
          const cidade = a["city"] || a["town"] || a["village"] || a["municipality"] || "";
          const uf = (a["ISO3166-2-lvl4"] || "").split("-")[1] ?? "";
          const bairro = a["suburb"] || a["neighbourhood"] || "";
          setEditandoUnidade((atual) =>
            atual
              ? {
                  ...atual,
                  cidade: atual.cidade || cidade,
                  uf: atual.uf || uf,
                  bairro: atual.bairro || bairro,
                }
              : atual,
          );
        } catch {
          // Sem internet ou serviço indisponível: mantém apenas as coordenadas.
        }
      },
      (err) => {
        setGpsStatus("");
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Libere o GPS no navegador."
            : "Não foi possível obter a localização.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  /** Captura o GPS da unidade inicial (fluxo unificado) e tenta preencher cidade/UF/bairro. */
  const capturarLocalizacaoUnidadeInicial = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Este dispositivo não permite captura de GPS.");
      return;
    }
    setGpsUnidadeStatus("Capturando GPS…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setUnidadeInicial((atual) => (atual ? { ...atual, lat, lng } : atual));
        setGpsUnidadeStatus(`GPS: ${lat}, ${lng} (±${Math.round(pos.coords.accuracy)} m)`);
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { Accept: "application/json" } },
          );
          const j = (await r.json()) as { address?: Record<string, string> };
          const a = j.address ?? {};
          const cidade = a["city"] || a["town"] || a["village"] || a["municipality"] || "";
          const uf = (a["ISO3166-2-lvl4"] || "").split("-")[1] ?? "";
          const bairro = a["suburb"] || a["neighbourhood"] || "";
          setUnidadeInicial((atual) =>
            atual
              ? {
                  ...atual,
                  cidade: atual.cidade || cidade,
                  uf: atual.uf || uf,
                  bairro: atual.bairro || bairro,
                }
              : atual,
          );
        } catch {
          // Sem internet: mantém apenas as coordenadas.
        }
      },
      (err) => {
        setGpsUnidadeStatus("");
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada. Libere o GPS no navegador."
            : "Não foi possível obter a localização.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const enviarContrato = async (arquivo: File) => {
    if (!editandoCliente) return;
    if (arquivo.size > 15 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 15 MB).");
      return;
    }
    setEnviandoContrato(true);
    try {
      const caminho = await enviarArquivo(`contratos/${editandoCliente.id ?? "novos"}`, arquivo);
      setEditandoCliente((atual) =>
        atual
          ? { ...atual, contrato_arquivo_url: caminho, contrato_arquivo_nome: arquivo.name }
          : atual,
      );
      toast.success("Contrato anexado. Salve o cliente para confirmar.");
    } catch {
      toast.error("Não foi possível enviar o contrato.");
    } finally {
      setEnviandoContrato(false);
    }
  };

  const abrirContrato = async (caminho: string) => {
    const url = await urlAssinada(caminho);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Não foi possível abrir o contrato.");
  };

  const porCliente = useMemo(() => {
    const m = new Map<string, Unidade[]>();
    for (const u of unidades.data ?? []) {
      m.set(u.prefeitura_id, [...(m.get(u.prefeitura_id) ?? []), u]);
    }
    return m;
  }, [unidades.data]);

  const recarregar = () => {
    void clientes.refetch();
    void unidades.refetch();
  };

  const gravarCliente = async () => {
    if (!org || !editandoCliente?.nome) return;
    if (!editandoCliente.cro || !editandoCliente.cro.trim()) {
      toast.error("Informe o CRO / registro profissional do responsável técnico.");
      return;
    }
    // Novo cliente exige PIN da unidade de acesso (fluxo unificado).
    const criandoNovo = !editandoCliente.id;
    if (criandoNovo && (!unidadeInicial?.pin || !/^\d{4}$/.test(unidadeInicial.pin))) {
      toast.error("Informe um PIN de acesso de 4 dígitos para a unidade.");
      return;
    }
    try {
      const prefeituraId = await salvarCliente(org.id, {
        ...editandoCliente,
        nome: editandoCliente.nome,
        uf: editandoCliente.uf ?? "SP",
      });
      // Cria a primeira unidade já com PIN (fluxo unificado).
      if (criandoNovo && unidadeInicial?.pin && prefeituraId) {
        await salvarUnidade({
          prefeitura_id: prefeituraId,
          nome: unidadeInicial.nome?.trim() || editandoCliente.nome,
          tipo: (unidadeInicial.tipo as Unidade["tipo"]) ?? "escola",
          bairro: unidadeInicial.bairro ?? "",
          cidade: unidadeInicial.cidade ?? editandoCliente.cidade ?? "",
          uf: (unidadeInicial.uf ?? editandoCliente.uf ?? "SP").toUpperCase().slice(0, 2),
          pin: unidadeInicial.pin,
          responsavel: unidadeInicial.responsavel ?? "",
          lat: unidadeInicial.lat ?? null,
          lng: unidadeInicial.lng ?? null,
          raio_metros: unidadeInicial.raio_metros ?? 150,
          ambientes: [],
          locais: [],
          ambientes_custom: {},
        });
      }
      setEditandoCliente(null);
      setUnidadeInicial(null);
      recarregar();
      toast.success(criandoNovo ? "Cliente e unidade cadastrados." : "Cliente salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  const gravarUnidade = async () => {
    if (!editandoUnidade?.nome || !editandoUnidade.prefeitura_id) return;
    try {
      await salvarUnidade({
        ...editandoUnidade,
        nome: editandoUnidade.nome,
        prefeitura_id: editandoUnidade.prefeitura_id,
      });
      setEditandoUnidade(null);
      recarregar();
      toast.success("Unidade salva.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-foreground">Clientes e unidades</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro central de contratantes, plantas e unidades. Todos os dados ficam na nuvem, com
            acesso restrito à sua organização.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditandoCliente({ uf: "SP", vertical: "educacional" });
              setUnidadeInicial({
                tipo: "escola",
                raio_metros: 150,
                uf: "SP",
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Novo cliente
          </button>
          <button
            disabled={!clientes.data?.length}
            onClick={() =>
              setEditandoUnidade({
                prefeitura_id: clientes.data?.[0]?.id ?? "",
                tipo: "escola",
                raio_metros: 150,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-3 py-2 text-sm font-bold text-teal-foreground disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Nova unidade
          </button>
        </div>
      </header>

      {editandoCliente && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-black text-foreground">
            {editandoCliente.id
              ? "Editar cliente"
              : "Novo cliente e unidade de acesso"}
          </h3>
          {unidadeInicial && (
            <div className="mb-4 rounded-xl border-2 border-teal bg-teal/5 p-3">
              <label className={`${rotulo} block`}>
                <span className="text-teal">PIN de acesso do cliente (4 dígitos) *</span>
                <input
                  className={`${campo} mt-1 text-lg tracking-[0.5em] font-black text-center`}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="0000"
                  value={unidadeInicial.pin ?? ""}
                  onChange={(e) =>
                    setUnidadeInicial({
                      ...unidadeInicial,
                      pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                />
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                A equipe de campo entra no app digitando este PIN. Defina agora para liberar o acesso.
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={rotulo}>
              Nome da empresa / cliente
              <input
                className={campo}
                value={editandoCliente.nome ?? ""}
                onChange={(e) => setEditandoCliente({ ...editandoCliente, nome: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Razão social
              <input
                className={campo}
                value={editandoCliente.razao_social ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, razao_social: e.target.value })
                }
              />
            </label>
            <label className={rotulo}>
              CNPJ
              <input
                className={campo}
                inputMode="numeric"
                value={editandoCliente.cnpj ?? ""}
                onChange={(e) => setEditandoCliente({ ...editandoCliente, cnpj: e.target.value })}
              />
            </label>
            <label className={`${rotulo} sm:col-span-2`}>
              Endereço completo (rua, número, complemento, bairro)
              <input
                className={campo}
                value={editandoCliente.endereco ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, endereco: e.target.value })
                }
              />
            </label>
            <label className={rotulo}>
              CEP
              <input
                className={campo}
                inputMode="numeric"
                value={editandoCliente.cep ?? ""}
                onChange={(e) => setEditandoCliente({ ...editandoCliente, cep: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Cidade
              <input
                className={campo}
                value={editandoCliente.cidade ?? ""}
                onChange={(e) => setEditandoCliente({ ...editandoCliente, cidade: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Estado (UF)
              <select
                className={campo}
                value={editandoCliente.uf ?? ""}
                onChange={(e) => setEditandoCliente({ ...editandoCliente, uf: e.target.value })}
              >
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
            <label className={rotulo}>
              Segmento
              <select
                className={campo}
                value={editandoCliente.vertical ?? "educacional"}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, vertical: e.target.value })
                }
              >
                {VERTICAIS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={rotulo}>
              Responsável técnico
              <input
                className={campo}
                value={editandoCliente.responsavel_tecnico ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, responsavel_tecnico: e.target.value })
                }
              />
            </label>
            <label className={rotulo}>
              <span className="text-destructive">*</span> CRO / Registro profissional
              <input
                className={campo}
                placeholder="Ex.: CRO-SP 12345"
                value={editandoCliente.cro ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, cro: e.target.value })
                }
              />
              <span className="text-xs font-medium text-muted-foreground">
                Obrigatório para validade jurídica do dossiê sanitário.
              </span>
            </label>
          </div>

          <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-muted-foreground">
            Contrato vinculado ao app
          </h4>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={rotulo}>
              Nº do contrato
              <input
                className={campo}
                value={editandoCliente.numero_contrato ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, numero_contrato: e.target.value })
                }
              />
            </label>
            <label className={rotulo}>
              Valor mensal (R$)
              <input
                type="number"
                className={campo}
                value={editandoCliente.valor_mensal ?? ""}
                onChange={(e) =>
                  setEditandoCliente({
                    ...editandoCliente,
                    valor_mensal: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
            <label className={rotulo}>
              Dia de vencimento
              <input
                type="number"
                min={1}
                max={31}
                className={campo}
                value={editandoCliente.dia_vencimento ?? ""}
                onChange={(e) =>
                  setEditandoCliente({
                    ...editandoCliente,
                    dia_vencimento: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
            <label className={rotulo}>
              Início do contrato
              <input
                type="date"
                className={campo}
                value={editandoCliente.inicio_contrato ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, inicio_contrato: e.target.value })
                }
              />
            </label>
            <label className={rotulo}>
              Fim do contrato
              <input
                type="date"
                className={campo}
                value={editandoCliente.fim_contrato ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, fim_contrato: e.target.value })
                }
              />
            </label>
            <label className={rotulo}>
              Assinado em
              <input
                type="date"
                className={campo}
                value={editandoCliente.contrato_assinado_em ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, contrato_assinado_em: e.target.value })
                }
              />
            </label>
            <div className={`${rotulo} sm:col-span-2 lg:col-span-3`}>
              Arquivo do contrato (PDF, imagem ou DOC)
              <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground">
                  <Upload className="h-4 w-4" />
                  {enviandoContrato ? "Enviando..." : "Anexar contrato"}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,image/*"
                    disabled={enviandoContrato}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void enviarContrato(f);
                    }}
                  />
                </label>
                {editandoCliente.contrato_arquivo_url ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void abrirContrato(editandoCliente.contrato_arquivo_url!)}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold"
                    >
                      <FileText className="h-4 w-4" />
                      {editandoCliente.contrato_arquivo_nome ?? "Ver contrato"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditandoCliente({
                          ...editandoCliente,
                          contrato_arquivo_url: null,
                          contrato_arquivo_nome: null,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Remover
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    Nenhum contrato anexado.
                  </span>
                )}
              </div>
            </div>
            <label className={`${rotulo} sm:col-span-2`}>
              Observações do contrato
              <input
                className={campo}
                value={editandoCliente.observacoes ?? ""}
                onChange={(e) =>
                  setEditandoCliente({ ...editandoCliente, observacoes: e.target.value })
                }
              />
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={capturarLocalizacaoCliente}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
              >
                <MapPin className="h-4 w-4" /> Usar minha localização
              </button>
              {editandoCliente.lat != null && editandoCliente.lng != null && (
                <a
                  href={`https://www.google.com/maps?q=${editandoCliente.lat},${editandoCliente.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground"
                >
                  Abrir no Google Maps
                </a>
              )}
              <span className="text-xs text-muted-foreground">{gpsClienteStatus}</span>
            </div>
            {editandoCliente.lat != null && editandoCliente.lng != null ? (
              <iframe
                title="Mapa da sede do cliente"
                className="mt-3 h-56 w-full rounded-lg border border-border"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  Number(editandoCliente.lng) - 0.004
                }%2C${Number(editandoCliente.lat) - 0.003}%2C${
                  Number(editandoCliente.lng) + 0.004
                }%2C${Number(editandoCliente.lat) + 0.003}&layer=mapnik&marker=${
                  editandoCliente.lat
                }%2C${editandoCliente.lng}`}
              />
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Capture o GPS na sede do cliente para registrar a localização no mapa.
              </p>
            )}
          </div>

          {unidadeInicial && (
            <>
              <h4 className="mt-4 text-xs font-black uppercase tracking-wide text-muted-foreground">
                Unidade de acesso (app de campo)
              </h4>
              <p className="text-xs text-muted-foreground">
                A equipe de campo entra no app digitando o PIN abaixo. É criada a primeira unidade
                vinculada a este cliente.
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className={rotulo}>
                  Nome da unidade
                  <input
                    className={campo}
                    placeholder={editandoCliente.nome ?? "Ex.: Matriz"}
                    value={unidadeInicial.nome ?? ""}
                    onChange={(e) =>
                      setUnidadeInicial({ ...unidadeInicial, nome: e.target.value })
                    }
                  />
                </label>
                <label className={rotulo}>
                  Tipo
                  <select
                    className={campo}
                    value={unidadeInicial.tipo ?? "escola"}
                    onChange={(e) =>
                      setUnidadeInicial({
                        ...unidadeInicial,
                        tipo: e.target.value as Unidade["tipo"],
                      })
                    }
                  >
                    {UNIT_TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {UNIT_TIPO_META[t].label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={rotulo}>
                  Bairro
                  <input
                    className={campo}
                    value={unidadeInicial.bairro ?? ""}
                    onChange={(e) =>
                      setUnidadeInicial({ ...unidadeInicial, bairro: e.target.value })
                    }
                  />
                </label>
                <label className={rotulo}>
                  Cidade
                  <input
                    className={campo}
                    value={unidadeInicial.cidade ?? ""}
                    onChange={(e) =>
                      setUnidadeInicial({ ...unidadeInicial, cidade: e.target.value })
                    }
                  />
                </label>
                <label className={rotulo}>
                  Estado (UF)
                  <select
                    className={campo}
                    value={unidadeInicial.uf ?? ""}
                    onChange={(e) =>
                      setUnidadeInicial({ ...unidadeInicial, uf: e.target.value })
                    }
                  >
                    <option value="">—</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={rotulo}>
                  Responsável local
                  <input
                    className={campo}
                    value={unidadeInicial.responsavel ?? ""}
                    onChange={(e) =>
                      setUnidadeInicial({ ...unidadeInicial, responsavel: e.target.value })
                    }
                  />
                </label>
                <label className={rotulo}>
                  Raio de validação (m)
                  <input
                    type="number"
                    className={campo}
                    value={unidadeInicial.raio_metros ?? 150}
                    onChange={(e) =>
                      setUnidadeInicial({
                        ...unidadeInicial,
                        raio_metros: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>

              <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={capturarLocalizacaoUnidadeInicial}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
                  >
                    <MapPin className="h-4 w-4" /> Usar minha localização
                  </button>
                  {unidadeInicial.lat != null && unidadeInicial.lng != null && (
                    <a
                      href={`https://www.google.com/maps?q=${unidadeInicial.lat},${unidadeInicial.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground"
                    >
                      Abrir no Google Maps
                    </a>
                  )}
                  <span className="text-xs text-muted-foreground">{gpsUnidadeStatus}</span>
                </div>
                {unidadeInicial.lat != null && unidadeInicial.lng != null ? (
                  <iframe
                    title="Mapa da unidade"
                    className="mt-3 h-56 w-full rounded-lg border border-border"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      Number(unidadeInicial.lng) - 0.004
                    }%2C${Number(unidadeInicial.lat) - 0.003}%2C${
                      Number(unidadeInicial.lng) + 0.004
                    }%2C${Number(unidadeInicial.lat) + 0.003}&layer=mapnik&marker=${
                      unidadeInicial.lat
                    }%2C${unidadeInicial.lng}`}
                  />
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Sem coordenadas: informe latitude/longitude ou capture o GPS no local para ativar
                    a validação de presença no app da equipe.
                  </p>
                )}
              </div>
            </>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={gravarCliente}
              className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
            >
              Salvar
            </button>
            <button
              onClick={() => {
                setEditandoCliente(null);
                setUnidadeInicial(null);
              }}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {editandoUnidade && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-black text-foreground">
            {editandoUnidade.id ? "Editar unidade" : "Nova unidade"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className={rotulo}>
              Cliente
              <select
                className={campo}
                value={editandoUnidade.prefeitura_id ?? ""}
                onChange={(e) =>
                  setEditandoUnidade({ ...editandoUnidade, prefeitura_id: e.target.value })
                }
              >
                {(clientes.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} / {c.uf}
                  </option>
                ))}
              </select>
            </label>
            <label className={rotulo}>
              Nome da unidade
              <input
                className={campo}
                value={editandoUnidade.nome ?? ""}
                onChange={(e) => setEditandoUnidade({ ...editandoUnidade, nome: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Tipo
              <select
                className={campo}
                value={editandoUnidade.tipo ?? "escola"}
                onChange={(e) =>
                  setEditandoUnidade({
                    ...editandoUnidade,
                    tipo: e.target.value as Unidade["tipo"],
                  })
                }
              >
                {UNIT_TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {UNIT_TIPO_META[t].label}
                  </option>
                ))}
              </select>
            </label>
            <label className={rotulo}>
              Bairro
              <input
                className={campo}
                value={editandoUnidade.bairro ?? ""}
                onChange={(e) => setEditandoUnidade({ ...editandoUnidade, bairro: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Cidade
              <input
                className={campo}
                value={editandoUnidade.cidade ?? ""}
                onChange={(e) => setEditandoUnidade({ ...editandoUnidade, cidade: e.target.value })}
              />
            </label>
            <label className={rotulo}>
              Estado (UF)
              <select
                className={campo}
                value={editandoUnidade.uf ?? ""}
                onChange={(e) => setEditandoUnidade({ ...editandoUnidade, uf: e.target.value })}
              >
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
            <label className={rotulo}>
              PIN de acesso (4 dígitos)
              <input
                className={campo}
                maxLength={4}
                inputMode="numeric"
                value={editandoUnidade.pin ?? ""}
                onChange={(e) =>
                  setEditandoUnidade({
                    ...editandoUnidade,
                    pin: e.target.value.replace(/\D/g, "").slice(0, 4),
                  })
                }
              />
            </label>
            <label className={rotulo}>
              Responsável local
              <input
                className={campo}
                value={editandoUnidade.responsavel ?? ""}
                onChange={(e) =>
                  setEditandoUnidade({ ...editandoUnidade, responsavel: e.target.value })
                }
              />
            </label>
            <label className={rotulo}>
              Latitude
              <input
                type="number"
                className={campo}
                value={editandoUnidade.lat ?? ""}
                onChange={(e) =>
                  setEditandoUnidade({
                    ...editandoUnidade,
                    lat: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
            <label className={rotulo}>
              Longitude
              <input
                type="number"
                className={campo}
                value={editandoUnidade.lng ?? ""}
                onChange={(e) =>
                  setEditandoUnidade({
                    ...editandoUnidade,
                    lng: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </label>
            <label className={rotulo}>
              Raio de validação (m)
              <input
                type="number"
                className={campo}
                value={editandoUnidade.raio_metros ?? 150}
                onChange={(e) =>
                  setEditandoUnidade({ ...editandoUnidade, raio_metros: Number(e.target.value) })
                }
              />
            </label>
          </div>

          <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={capturarLocalizacao}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground"
              >
                <MapPin className="h-4 w-4" /> Usar minha localização
              </button>
              {editandoUnidade.lat != null && editandoUnidade.lng != null && (
                <a
                  href={`https://www.google.com/maps?q=${editandoUnidade.lat},${editandoUnidade.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-foreground"
                >
                  Abrir no Google Maps
                </a>
              )}
              <span className="text-xs text-muted-foreground">{gpsStatus}</span>
            </div>
            {editandoUnidade.lat != null && editandoUnidade.lng != null ? (
              <iframe
                title="Mapa da unidade"
                className="mt-3 h-56 w-full rounded-lg border border-border"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  Number(editandoUnidade.lng) - 0.004
                }%2C${Number(editandoUnidade.lat) - 0.003}%2C${
                  Number(editandoUnidade.lng) + 0.004
                }%2C${Number(editandoUnidade.lat) + 0.003}&layer=mapnik&marker=${
                  editandoUnidade.lat
                }%2C${editandoUnidade.lng}`}
              />
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Sem coordenadas: informe latitude/longitude ou capture o GPS no local para ativar a
                validação de presença no app da equipe.
              </p>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={gravarUnidade}
              className="rounded-xl bg-teal px-4 py-2 text-sm font-black text-teal-foreground"
            >
              Salvar
            </button>
            <button
              onClick={() => setEditandoUnidade(null)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-bold"
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {clientes.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando cadastros…</p>
      ) : !clientes.data?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-bold text-foreground">Nenhum cliente cadastrado</p>
          <p className="text-sm text-muted-foreground">
            Cadastre a prefeitura, rede ou empresa contratante para começar.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {clientes.data.map((c) => (
            <section key={c.id} className="rounded-2xl border border-border bg-card">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
                <div>
                  <h3 className="font-black text-foreground">
                    {c.nome} <span className="text-muted-foreground">/ {c.uf}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {(porCliente.get(c.id) ?? []).length} unidade(s)
                    {c.responsavel_tecnico ? ` · RT: ${c.responsavel_tecnico}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditandoCliente(c)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir ${c.nome} e desvincular suas unidades?`)) return;
                      try {
                        await excluirCliente(c.id);
                        recarregar();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2.5 py-1.5 text-xs font-bold text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </div>
              </header>

              <ul className="divide-y divide-border">
                {(porCliente.get(c.id) ?? []).map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <div>
                      <p className="font-bold text-foreground">
                        {UNIT_TIPO_META[u.tipo]?.emoji} {u.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {u.bairro || "sem bairro"}
                        {u.cidade ? ` · ${u.cidade}` : ""}
                        {u.uf ? `/${u.uf}` : ""} · PIN {u.pin || "—"} ·{" "}
                        {(u.locais ?? []).length} ambiente(s)
                        {u.lat && u.lng ? ` · GPS ${u.raio_metros}m` : " · sem GPS"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditandoUnidade(u)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Dados
                      </button>
                      <Link
                        to="/painel/unidades/$id"
                        params={{ id: u.id }}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal px-2.5 py-1.5 text-xs font-black text-teal-foreground"
                      >
                        <MapPin className="h-3.5 w-3.5" /> Ambientes e QR
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Excluir a unidade ${u.nome}?`)) return;
                          try {
                            await excluirUnidade(u.id);
                            recarregar();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
                          }
                        }}
                        className="rounded-lg border border-destructive/40 px-2.5 py-1.5 text-xs font-bold text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
                {!(porCliente.get(c.id) ?? []).length && (
                  <li className="p-4 text-sm text-muted-foreground">
                    Nenhuma unidade cadastrada para este cliente.
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
