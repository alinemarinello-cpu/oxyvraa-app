// Camada de dados do painel do gestor — 100% nuvem, isolada por organização via RLS.
import { supabase } from "@/integrations/supabase/client";
import type { CorLimpeza, LocalAmbiente, UnitTipo } from "@/lib/oxyvra-store";

export type Cliente = {
  id: string;
  organizacao_id: string | null;
  nome: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  cidade: string;
  uf: string;
  endereco: string | null;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  vertical: string;
  responsavel_tecnico: string | null;
  registro_rt: string | null;
  cro: string;
  valor_mensal: number | null;
  dia_vencimento: number | null;
  inicio_contrato: string | null;
  fim_contrato: string | null;
  numero_contrato: string | null;
  contrato_arquivo_url: string | null;
  contrato_arquivo_nome: string | null;
  contrato_assinado_em: string | null;
  observacoes: string | null;
};


export type Unidade = {
  id: string;
  prefeitura_id: string;
  tipo: UnitTipo;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  pin: string;
  responsavel: string;
  nome_completo: string | null;
  endereco: string | null;
  qtd_alunos: number | null;
  qtd_colaboradores: number | null;
  lat: number | null;
  lng: number | null;
  raio_metros: number;
  ambientes: string[];
  locais: LocalAmbiente[];
  ambientes_custom: Record<string, { label: string; emoji: string }>;
  alvara_sanitario_numero: string | null;
  alvara_sanitario_expiracao: string | null;
  responsavel_tecnico: string | null;
  conselho_rt: string | null;
};

export type ProdutoQuimico = {
  id: string;
  organizacao_id: string | null;
  brand: string;
  name: string;
  categoria: string;
  dilution_label: string;
  dilution_ratio: number;
  dwell_time_seconds: number;
  color_kit_zone: CorLimpeza;
  price_per_liter: number;
  application_rate_l_m2: number;
  package_liters: number;
  residual_hours: number;
  food_grade: boolean;
  requires_rinse: boolean;
  usage_notes: string;
  stock_liters: number;
  min_stock_liters: number;
  ativo: boolean;
};

export type Colaboradora = {
  id: string;
  unit_id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  pin: string | null;
  turnos: string[];
  ativo: boolean;
};

export type Pagamento = {
  id: string;
  prefeitura_id: string;
  competencia: string;
  valor: number;
  vencimento: string;
  pago_em: string | null;
  metodo: string | null;
  observacao: string | null;
};

export type Despesa = {
  id: string;
  prefeitura_id: string;
  data: string;
  categoria: string;
  descricao: string;
  valor: number;
};

// ---------------- Clientes (prefeituras / empresas) ----------------

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("prefeituras")
    .select(
      "id, organizacao_id, nome, razao_social, nome_fantasia, cnpj, cidade, uf, endereco, cep, lat, lng, vertical, responsavel_tecnico, registro_rt, cro, valor_mensal, dia_vencimento, inicio_contrato, fim_contrato, numero_contrato, contrato_arquivo_url, contrato_arquivo_nome, contrato_assinado_em, observacoes",
    )
    .order("nome");
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

export async function salvarCliente(
  organizacaoId: string,
  c: Partial<Cliente> & { nome: string; uf: string },
) {
  const payload = {
    organizacao_id: organizacaoId,
    nome: c.nome,
    razao_social: c.razao_social ?? null,
    nome_fantasia: c.nome_fantasia ?? null,
    cnpj: c.cnpj ?? null,
    cidade: c.cidade ?? "",
    uf: c.uf,
    endereco: c.endereco ?? null,
    cep: c.cep ?? null,
    lat: c.lat ?? null,
    lng: c.lng ?? null,
    vertical: c.vertical ?? "educacional",
    responsavel_tecnico: c.responsavel_tecnico ?? null,
    registro_rt: c.registro_rt ?? null,
    cro: (c.cro ?? "").trim(),
    valor_mensal: c.valor_mensal ?? null,
    dia_vencimento: c.dia_vencimento ?? null,
    inicio_contrato: c.inicio_contrato || null,
    fim_contrato: c.fim_contrato || null,
    numero_contrato: c.numero_contrato ?? null,
    contrato_arquivo_url: c.contrato_arquivo_url ?? null,
    contrato_arquivo_nome: c.contrato_arquivo_nome ?? null,
    contrato_assinado_em: c.contrato_assinado_em || null,
    observacoes: c.observacoes ?? null,
  };
  if (c.id) {
    const { error } = await supabase.from("prefeituras").update(payload).eq("id", c.id);
    if (error) throw error;
    return c.id;
  }
  const { data, error } = await supabase
    .from("prefeituras")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function excluirCliente(id: string) {
  const { error } = await supabase.from("prefeituras").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Unidades ----------------

export async function listarUnidades(): Promise<Unidade[]> {
  const { data, error } = await supabase
    .from("units")
    .select(
      "id, prefeitura_id, tipo, nome, bairro, cidade, uf, pin, responsavel, nome_completo, endereco, qtd_alunos, qtd_colaboradores, lat, lng, raio_metros, ambientes, locais, ambientes_custom, alvara_sanitario_numero, alvara_sanitario_expiracao, responsavel_tecnico, conselho_rt",
    )
    .order("nome");
  if (error) throw error;
  return (data ?? []) as unknown as Unidade[];
}

export async function carregarUnidade(id: string): Promise<Unidade | null> {
  const { data, error } = await supabase
    .from("units")
    .select(
      "id, prefeitura_id, tipo, nome, bairro, cidade, uf, pin, responsavel, nome_completo, endereco, qtd_alunos, qtd_colaboradores, lat, lng, raio_metros, ambientes, locais, ambientes_custom, alvara_sanitario_numero, alvara_sanitario_expiracao, responsavel_tecnico, conselho_rt",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Unidade) ?? null;
}

export async function salvarUnidade(u: Partial<Unidade> & { prefeitura_id: string; nome: string }) {
  const payload = {
    prefeitura_id: u.prefeitura_id,
    tipo: u.tipo ?? "escola",
    nome: u.nome,
    bairro: u.bairro ?? "",
    cidade: u.cidade ?? "",
    uf: (u.uf ?? "").toUpperCase().slice(0, 2),
    pin: u.pin ?? "",
    responsavel: u.responsavel ?? "",
    nome_completo: u.nome_completo ?? null,
    endereco: u.endereco ?? null,
    qtd_alunos: u.qtd_alunos ?? null,
    qtd_colaboradores: u.qtd_colaboradores ?? null,
    lat: u.lat ?? null,
    lng: u.lng ?? null,
    raio_metros: u.raio_metros ?? 150,
    ambientes: u.ambientes ?? [],
    locais: u.locais ?? [],
    ambientes_custom: u.ambientes_custom ?? {},
    alvara_sanitario_numero: u.alvara_sanitario_numero ?? null,
    alvara_sanitario_expiracao: u.alvara_sanitario_expiracao || null,
    responsavel_tecnico: u.responsavel_tecnico ?? null,
    conselho_rt: u.conselho_rt ?? null,
  };
  if (u.id) {
    const { error } = await supabase.from("units").update(payload).eq("id", u.id);
    if (error) throw error;
    return u.id;
  }
  const { data, error } = await supabase.from("units").insert(payload).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function excluirUnidade(id: string) {
  const { error } = await supabase.from("units").delete().eq("id", id);
  if (error) throw error;
}

/** Salva a lista de locais/ambientes de uma unidade, garantindo token de QR em cada um. */
export async function salvarLocais(unidadeId: string, locais: LocalAmbiente[]) {
  const comToken = locais.map((l) => ({
    ...l,
    qrToken: l.qrToken || `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`,
  }));
  const ambientes = Array.from(new Set(comToken.map((l) => l.tipo)));
  const { error } = await supabase
    .from("units")
    .update({ locais: comToken, ambientes })
    .eq("id", unidadeId);
  if (error) throw error;
  return comToken;
}

// ---------------- Equipes ----------------

export async function listarColaboradoras(unitId?: string): Promise<Colaboradora[]> {
  let q = supabase
    .from("colaboradoras")
    .select("id, unit_id, nome, cpf, telefone, pin, turnos, ativo")
    .order("nome");
  if (unitId) q = q.eq("unit_id", unitId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as Colaboradora[];
}

export async function salvarColaboradora(c: Partial<Colaboradora> & { unit_id: string; nome: string }) {
  const payload = {
    unit_id: c.unit_id,
    nome: c.nome,
    cpf: c.cpf ?? null,
    telefone: c.telefone ?? null,
    pin: c.pin ?? null,
    turnos: c.turnos ?? [],
    ativo: c.ativo ?? true,
  };
  if (c.id) {
    const { error } = await supabase.from("colaboradoras").update(payload).eq("id", c.id);
    if (error) throw error;
    return c.id;
  }
  const { data, error } = await supabase
    .from("colaboradoras")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function excluirColaboradora(id: string) {
  const { error } = await supabase.from("colaboradoras").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Financeiro do contrato ----------------

export async function listarPagamentos(prefeituraId: string): Promise<Pagamento[]> {
  const { data, error } = await supabase
    .from("pagamentos")
    .select("id, prefeitura_id, competencia, valor, vencimento, pago_em, metodo, observacao")
    .eq("prefeitura_id", prefeituraId)
    .order("vencimento", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, valor: Number(p.valor) })) as Pagamento[];
}

export async function salvarPagamento(p: Omit<Pagamento, "id"> & { id?: string }) {
  const payload = {
    prefeitura_id: p.prefeitura_id,
    competencia: p.competencia,
    valor: p.valor,
    vencimento: p.vencimento,
    pago_em: p.pago_em || null,
    metodo: p.metodo || null,
    observacao: p.observacao || null,
  };
  if (p.id) {
    const { error } = await supabase.from("pagamentos").update(payload).eq("id", p.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("pagamentos").insert(payload);
  if (error) throw error;
}

export async function excluirPagamento(id: string) {
  const { error } = await supabase.from("pagamentos").delete().eq("id", id);
  if (error) throw error;
}

export async function listarDespesas(prefeituraId: string): Promise<Despesa[]> {
  const { data, error } = await supabase
    .from("despesas")
    .select("id, prefeitura_id, data, categoria, descricao, valor")
    .eq("prefeitura_id", prefeituraId)
    .order("data", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({ ...d, valor: Number(d.valor) })) as Despesa[];
}

export async function salvarDespesa(d: Omit<Despesa, "id"> & { id?: string }) {
  const payload = {
    prefeitura_id: d.prefeitura_id,
    data: d.data,
    categoria: d.categoria,
    descricao: d.descricao,
    valor: d.valor,
  };
  if (d.id) {
    const { error } = await supabase.from("despesas").update(payload).eq("id", d.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("despesas").insert(payload);
  if (error) throw error;
}

export async function excluirDespesa(id: string) {
  const { error } = await supabase.from("despesas").delete().eq("id", id);
  if (error) throw error;
}

// ---------------- Catálogo genérico de químicos ----------------

const CAMPOS_QUIMICO =
  "id, organizacao_id, brand, name, categoria, dilution_label, dilution_ratio, dwell_time_seconds, color_kit_zone, price_per_liter, application_rate_l_m2, package_liters, residual_hours, food_grade, requires_rinse, usage_notes, stock_liters, min_stock_liters, ativo";

export async function listarQuimicos(): Promise<ProdutoQuimico[]> {
  const { data, error } = await supabase
    .from("chemical_products")
    .select(CAMPOS_QUIMICO)
    .order("brand")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    dilution_ratio: Number(p.dilution_ratio),
    price_per_liter: Number(p.price_per_liter),
    application_rate_l_m2: Number(p.application_rate_l_m2),
    package_liters: Number(p.package_liters),
    stock_liters: Number(p.stock_liters),
    min_stock_liters: Number(p.min_stock_liters),
  })) as ProdutoQuimico[];
}

export type EntradaQuimico = Omit<ProdutoQuimico, "id" | "organizacao_id"> & { id?: string };

export async function salvarQuimico(organizacaoId: string, p: EntradaQuimico) {
  const payload = {
    organizacao_id: organizacaoId,
    brand: p.brand,
    name: p.name,
    categoria: p.categoria ?? "",
    dilution_label: p.dilution_label ?? "",
    dilution_ratio: p.dilution_ratio,
    dwell_time_seconds: p.dwell_time_seconds,
    color_kit_zone: p.color_kit_zone,
    price_per_liter: p.price_per_liter,
    application_rate_l_m2: p.application_rate_l_m2,
    package_liters: p.package_liters,
    residual_hours: p.residual_hours,
    food_grade: p.food_grade,
    requires_rinse: p.requires_rinse,
    usage_notes: p.usage_notes,
    stock_liters: p.stock_liters,
    min_stock_liters: p.min_stock_liters,
    ativo: p.ativo,
  };
  if (p.id) {
    const { error } = await supabase.from("chemical_products").update(payload).eq("id", p.id);
    if (error) throw error;
    return p.id;
  }
  const { data, error } = await supabase
    .from("chemical_products")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function excluirQuimico(id: string) {
  const { error } = await supabase.from("chemical_products").delete().eq("id", id);
  if (error) throw error;
}

/** Copia um modelo global (ex.: Spartan) para o catálogo da organização. */
export async function importarModeloQuimico(organizacaoId: string, modelo: ProdutoQuimico) {
  const { id: _id, organizacao_id: _org, ...resto } = modelo;
  return salvarQuimico(organizacaoId, resto);
}

// ---------------- Cálculo de diluição (parametrizado pelo produto) ----------------

export type CalculoDiluicao = {
  litrosSolucao: number;
  litrosConcentrado: number;
  litrosAgua: number;
  custo: number;
  embalagens: number;
};

export function calcularDiluicao(produto: ProdutoQuimico, areaM2: number): CalculoDiluicao {
  const litrosSolucao = Math.max(0, areaM2) * produto.application_rate_l_m2;
  const litrosConcentrado = litrosSolucao / (produto.dilution_ratio + 1);
  return {
    litrosSolucao,
    litrosConcentrado,
    litrosAgua: litrosSolucao - litrosConcentrado,
    custo: litrosConcentrado * produto.price_per_liter,
    embalagens: produto.package_liters > 0 ? litrosConcentrado / produto.package_liters : 0,
  };
}

// ---------- PINs de acesso por turno/equipe (unit_pins) ----------
export type PinUnidade = {
  id: string;
  unit_id: string;
  nome: string;
  pin: string;
  papel: "operador" | "supervisor";
  ativo: boolean;
  created_at?: string;
};

export async function listarPins(unitId: string): Promise<PinUnidade[]> {
  const { data, error } = await supabase
    .from("unit_pins")
    .select("id, unit_id, nome, pin, papel, ativo, created_at")
    .eq("unit_id", unitId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as PinUnidade[];
}

export async function salvarPin(
  p: Omit<PinUnidade, "id" | "created_at"> & { id?: string },
): Promise<void> {
  if (!/^\d{4}$/.test(p.pin)) throw new Error("O PIN precisa ter exatamente 4 números.");
  if (!p.nome.trim()) throw new Error("Dê um nome ao PIN (ex.: Manhã, Tarde, Equipe Ana).");
  const payload = {
    unit_id: p.unit_id,
    nome: p.nome.trim(),
    pin: p.pin,
    papel: p.papel,
    ativo: p.ativo,
  };
  if (p.id) {
    const { error } = await supabase.from("unit_pins").update(payload).eq("id", p.id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from("unit_pins").insert(payload);
  if (error) throw new Error(error.message);
}

export async function excluirPin(id: string): Promise<void> {
  const { error } = await supabase.from("unit_pins").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
