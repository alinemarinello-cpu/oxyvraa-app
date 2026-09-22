// Resolução do PIN da unidade para o app de campo (executa apenas no servidor).
export type PapelPin = "operador" | "supervisor";

export type UnidadeCampo = {
  id: string;
  nome: string;
  bairro: string;
  tipo: string;
  responsavel: string;
  prefeituraNome: string;
  lat: number | null;
  lng: number | null;
  raioMetros: number;
  ambientes: string[];
  locais: Record<string, string | number | boolean | string[] | null>[];
  ambientesCustom: Record<string, { label: string; emoji: string }>;
  /** Nome do PIN/turno usado no login (ex.: "Manhã"). */
  pinNome: string;
  /** Papel do PIN: operador comum ou supervisor do turno. */
  papel: PapelPin;
};

type LinhaUnidade = {
  id: string;
  nome: string;
  bairro: string;
  tipo: string;
  responsavel: string;
  lat: number | null;
  lng: number | null;
  raio_metros: number | null;
  ambientes: unknown;
  locais: unknown;
  ambientes_custom: unknown;
  prefeituras: { nome?: string } | null;
};

function montarUnidade(
  data: LinhaUnidade,
  pinNome: string,
  papel: PapelPin,
): UnidadeCampo {
  return {
    id: data.id,
    nome: data.nome,
    bairro: data.bairro,
    tipo: data.tipo,
    responsavel: data.responsavel,
    prefeituraNome: data.prefeituras?.nome ?? "",
    lat: data.lat,
    lng: data.lng,
    raioMetros: data.raio_metros ?? 150,
    ambientes: (data.ambientes as string[]) ?? [],
    locais: (data.locais as UnidadeCampo["locais"]) ?? [],
    ambientesCustom:
      (data.ambientes_custom as Record<string, { label: string; emoji: string }>) ?? {},
    pinNome,
    papel,
  };
}

const COLUNAS =
  "id, nome, bairro, tipo, responsavel, lat, lng, raio_metros, ambientes, locais, ambientes_custom, prefeituras(nome)";

export async function resolverPin(pin: string): Promise<UnidadeCampo | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1) PINs nomeados por turno/equipe (unit_pins) têm prioridade.
  const { data: pinRow } = await supabaseAdmin
    .from("unit_pins")
    .select("unit_id, nome, papel")
    .eq("pin", pin)
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  if (pinRow) {
    const { data: u, error } = await supabaseAdmin
      .from("units")
      .select(COLUNAS)
      .eq("id", pinRow.unit_id)
      .maybeSingle();
    if (!error && u) {
      return montarUnidade(
        u as unknown as LinhaUnidade,
        pinRow.nome,
        pinRow.papel === "supervisor" ? "supervisor" : "operador",
      );
    }
  }

  // 2) Retrocompatibilidade: PIN principal cadastrado na própria unidade.
  const { data, error } = await supabaseAdmin
    .from("units")
    .select(COLUNAS)
    .eq("pin", pin)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  return montarUnidade(data as unknown as LinhaUnidade, "PIN principal", "operador");
}
