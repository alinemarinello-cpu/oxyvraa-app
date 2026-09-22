// Módulo "Oxyvra Conformidade — Saúde e Estética".
// Regras sanitárias (RDC 1.002/2025 e RDC 222/2018), pontos de QR Code, checklists
// operacionais, ciclos de autoclave imutáveis e testes biológicos.
// LGPD / Zero Patient Data: nenhum campo aceita nome de paciente, prontuário, CID ou rosto.
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { applyWatermark } from "@/lib/oxyvra-watermark";

/* ------------------------------ travas jurídicas ------------------------------ */

export const AVISO_LEGAL =
  "Documento gerado pelo sistema Oxyvra a partir dos registros lançados pelo estabelecimento. " +
  "Não substitui alvará sanitário nem constitui homologação da ANVISA ou da Vigilância municipal.";

export const AVISO_LGPD =
  "Registre apenas processos e ambientes. Nunca informe nome de paciente, prontuário, diagnóstico ou fotografe rostos.";

/** Expressões proibidas em qualquer tela, texto ou PDF do módulo. */
export const TERMOS_PROIBIDOS = [
  "aprovado pela anvisa",
  "isento de multa",
  "substitui alvará",
  "substitui alvara",
  "100% regular",
] as const;

/** Guarda de conteúdo: retorna o termo proibido encontrado (para testes e revisão). */
export function termoProibido(texto: string): string | null {
  const t = texto.toLowerCase();
  return TERMOS_PROIBIDOS.find((p) => t.includes(p)) ?? null;
}

/** Bloqueia a gravação de qualquer texto com expressão proibida. */
export function assegurarTextoPermitido(texto: string | null | undefined, campo: string): void {
  if (!texto) return;
  const t = termoProibido(texto);
  if (t) throw new Error(`O texto de "${campo}" não pode conter a expressão "${t}".`);
}

/** LGPD Zero Patient Data: recusa CPF, prontuário, CID e nome de paciente em texto livre. */
const PADROES_PACIENTE: { re: RegExp; aviso: string }[] = [
  { re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/, aviso: "CPF" },
  { re: /\bprontu[áa]rio\b/i, aviso: "prontuário" },
  { re: /\bcid[- ]?10?\b/i, aviso: "CID" },
  { re: /\bpaciente\b/i, aviso: "identificação de paciente" },
];

export function dadoDePaciente(texto: string): string | null {
  return PADROES_PACIENTE.find((p) => p.re.test(texto))?.aviso ?? null;
}

export function assegurarSemDadoDePaciente(texto: string | null | undefined, campo: string): void {
  if (!texto) return;
  const achado = dadoDePaciente(texto);
  if (achado)
    throw new Error(
      `O campo "${campo}" não pode conter ${achado}. Registre apenas processos e ambientes.`,
    );
}

/** Justificativa mínima exigida para estornar um registro sanitário imutável. */
export const JUSTIFICATIVA_MIN = 15;

export function validarJustificativa(texto: string): string {
  const t = (texto ?? "").trim();
  if (t.length < JUSTIFICATIVA_MIN)
    throw new Error(
      `A justificativa do estorno precisa ter no mínimo ${JUSTIFICATIVA_MIN} caracteres.`,
    );
  assegurarTextoPermitido(t, "justificativa do estorno");
  assegurarSemDadoDePaciente(t, "justificativa do estorno");
  return t;
}

/* ---------------------------------- tipos ---------------------------------- */

export type ZoneType =
  | "RECEPCAO"
  | "EQUIPO"
  | "CME_EXPURGO"
  | "AUTOCLAVE"
  | "AREA_LIMPA"
  | "DML"
  | "RESIDUOS"
  | "SANITARIO"
  | "PIA_MAOS";

export type Frequency =
  | "DIARIO_ABERTURA"
  | "ENTRE_PACIENTES"
  | "DIARIO_FECHAMENTO"
  | "SEMANAL"
  | "MENSAL";

export const ROTULO_FREQUENCIA: Record<Frequency, string> = {
  DIARIO_ABERTURA: "Abertura do dia",
  ENTRE_PACIENTES: "Entre atendimentos",
  DIARIO_FECHAMENTO: "Fechamento do dia",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
};

export type MetaZona = {
  label: string;
  emoji: string;
  produto: string;
  corKit: string;
  dwellSegundos: number;
  frequencias: Frequency[];
  itens: Partial<Record<Frequency, string[]>>;
};

/** Lista oficial de insumos das clínicas odontológicas. */
export const PRODUTOS_ODONTO = [
  "Desinfetante de Superfícies",
  "Detergente Enzimático",
  "Indicadores Químicos (Classe 5/6)",
  "Indicadores Biológicos",
  "Wipes Desinfetantes",
] as const;

/** As 9 estações padrão de um consultório odontológico / clínica de estética. */
export const ZONAS: Record<ZoneType, MetaZona> = {
  RECEPCAO: {
    label: "Recepção e sala de espera",
    emoji: "🪑",
    produto: "Wipes Desinfetantes",
    corKit: "azul",
    dwellSegundos: 60,
    frequencias: ["DIARIO_ABERTURA", "DIARIO_FECHAMENTO"],
    itens: {
      DIARIO_ABERTURA: [
        "Balcão, maçanetas e cadeiras higienizados",
        "Dispensador de álcool em gel abastecido",
        "Piso limpo e seco",
      ],
      DIARIO_FECHAMENTO: [
        "Superfícies de contato higienizadas",
        "Lixeiras comuns recolhidas",
        "Ambiente ventilado e fechado",
      ],
    },
  },
  EQUIPO: {
    label: "Equipo / cadeira de atendimento",
    emoji: "🦷",
    produto: "Wipes Desinfetantes",
    corKit: "vermelho",
    dwellSegundos: 120,
    frequencias: ["ENTRE_PACIENTES", "DIARIO_ABERTURA", "DIARIO_FECHAMENTO"],
    itens: {
      ENTRE_PACIENTES: [
        "Barreiras descartáveis trocadas (encosto, refletor, seringa tríplice)",
        "Superfícies do equipo desinfetadas com tempo de contato cumprido",
        "Cuspideira e sugadores descontaminados",
        "Instrumental usado encaminhado ao expurgo em caixa rígida",
      ],
      DIARIO_ABERTURA: ["Linhas de água acionadas (flush)", "Equipo desinfetado antes do 1º atendimento"],
      DIARIO_FECHAMENTO: ["Equipo e bancada desinfetados", "Sugadores e cuspideira desinfetados"],
    },
  },
  CME_EXPURGO: {
    label: "Expurgo / área suja",
    emoji: "🧪",
    produto: "Detergente Enzimático",
    corKit: "vermelho",
    dwellSegundos: 300,
    frequencias: ["DIARIO_ABERTURA", "DIARIO_FECHAMENTO", "SEMANAL"],
    itens: {
      DIARIO_ABERTURA: ["EPI completo disponível", "Cuba e detergente enzimático dentro da validade"],
      DIARIO_FECHAMENTO: [
        "Instrumental limpo, seco e inspecionado",
        "Bancada e cubas desinfetadas",
        "Fluxo sujo → limpo respeitado (sem cruzamento)",
      ],
      SEMANAL: ["Limpeza terminal do expurgo", "Conferência de validade dos saneantes"],
    },
  },
  AUTOCLAVE: {
    label: "Autoclave / esterilização",
    emoji: "♨️",
    produto: "Indicadores Químicos (Classe 5/6) + Indicadores Biológicos",
    corKit: "azul",
    dwellSegundos: 60,
    frequencias: ["DIARIO_ABERTURA", "DIARIO_FECHAMENTO", "SEMANAL"],
    itens: {
      DIARIO_ABERTURA: [
        "Reservatório com água destilada",
        "Câmara e guarnição limpas",
        "Registro de ciclo em dia",
      ],
      DIARIO_FECHAMENTO: ["Todos os ciclos do dia registrados", "Pacotes identificados com lote e validade"],
      SEMANAL: ["Teste biológico da semana realizado", "Limpeza da câmara e filtros"],
    },
  },
  AREA_LIMPA: {
    label: "Área limpa / armazenamento de estéreis",
    emoji: "📦",
    produto: "Indicadores Químicos (Classe 5/6)",
    corKit: "azul",
    dwellSegundos: 60,
    frequencias: ["DIARIO_ABERTURA", "SEMANAL"],
    itens: {
      DIARIO_ABERTURA: [
        "Pacotes íntegros, secos e dentro da validade",
        "Armário fechado, longe de pia e umidade",
      ],
      SEMANAL: ["Conferência de validade dos pacotes", "Limpeza das prateleiras"],
    },
  },
  DML: {
    label: "DML — depósito de material de limpeza",
    emoji: "🧹",
    produto: "Desinfetante de Superfícies",
    corKit: "vermelho",
    dwellSegundos: 60,
    frequencias: ["SEMANAL", "MENSAL"],
    itens: {
      SEMANAL: [
        "Panos e mops separados por cor de kit",
        "Produtos rotulados e com diluição correta",
        "Tanque limpo",
      ],
      MENSAL: ["Estoque conferido", "Fichas de segurança (FISPQ) disponíveis"],
    },
  },
  RESIDUOS: {
    label: "Abrigo de resíduos (PGRSS)",
    emoji: "☣️",
    produto: "Desinfetante de Superfícies",
    corKit: "vermelho",
    dwellSegundos: 120,
    frequencias: ["DIARIO_FECHAMENTO", "SEMANAL"],
    itens: {
      DIARIO_FECHAMENTO: [
        "Grupo A (infectante) em saco branco leitoso identificado",
        "Perfurocortantes em caixa rígida abaixo de 2/3",
        "Abrigo trancado e sem vetores",
      ],
      SEMANAL: ["Comprovante de coleta arquivado", "Higienização do abrigo"],
    },
  },
  SANITARIO: {
    label: "Sanitários",
    emoji: "🚻",
    produto: "Desinfetante de Superfícies",
    corKit: "vermelho",
    dwellSegundos: 300,
    frequencias: ["DIARIO_ABERTURA", "DIARIO_FECHAMENTO"],
    itens: {
      DIARIO_ABERTURA: ["Vaso, pia e piso higienizados", "Papel, sabonete e papel-toalha abastecidos"],
      DIARIO_FECHAMENTO: ["Limpeza terminal realizada", "Lixeira com tampa e pedal higienizada"],
    },
  },
  PIA_MAOS: {
    label: "Pia de higienização das mãos",
    emoji: "🧼",
    produto: "Desinfetante de Superfícies",
    corKit: "azul",
    dwellSegundos: 60,
    frequencias: ["DIARIO_ABERTURA", "DIARIO_FECHAMENTO"],
    itens: {
      DIARIO_ABERTURA: [
        "Sabonete líquido, papel-toalha e lixeira sem contato disponíveis",
        "Cartaz de técnica de higienização afixado",
      ],
      DIARIO_FECHAMENTO: ["Pia e bancada higienizadas", "Insumos repostos para o dia seguinte"],
    },
  },
};

export const ZONAS_PADRAO = Object.keys(ZONAS) as ZoneType[];

export type ComplianceProfile = {
  id: string;
  organizacao_id: string;
  unit_id: string | null;
  type: string;
  status: string;
  clinic_name: string;
  cnpj: string | null;
  address: string;
  city: string;
  uf: string;
  whatsapp: string | null;
  rt_name: string;
  rt_council: string;
  rt_number: string;
  cro: string;
  autoclave_serial: string;
  autoclave_brand_model: string;
  created_at: string;
};

export type QrCheckpoint = {
  id: string;
  organizacao_id: string;
  compliance_profile_id: string;
  name: string;
  custom_name: string;
  code: string;
  zone_type: ZoneType;
  ativo: boolean;
};

export type ChecklistLog = {
  id: string;
  checkpoint_id: string | null;
  operator_name: string;
  frequency: Frequency;
  data_json: Record<string, boolean>;
  photo_urls: string[];
  lat: number | null;
  lng: number | null;
  timestamp_gps: string;
  reversal_of_id: string | null;
  reversal_reason: string | null;
};

export type AutoclaveCycle = {
  id: string;
  equipment_serial: string;
  equipment_brand_model: string;
  cycle_date_time: string;
  batch_number: string;
  time_minutes: number;
  temp_celsius: number;
  pressure_bar: number;
  chemical_indicator_result: "APROVADO" | "REPROVADO";
  packages_list: string;
  operator_name: string;
  photo_integrator_url: string;
  photo_panel_url: string | null;
  status: "APROVADO" | "REPROVADO" | "BLOQUEADO";
  corrective_action_log: string | null;
  reversal_of_id: string | null;
  reversal_reason: string | null;
};

export type BiologicalTest = {
  id: string;
  autoclave_cycle_id: string | null;
  test_date: string;
  indicator_batch_number: string;
  result: "NEGATIVO" | "POSITIVO";
  photo_vial_url: string | null;
  operator_name: string;
};

/* --------------------------------- perfil --------------------------------- */

export type EntradaPerfil = {
  clinic_name: string;
  cnpj: string;
  address: string;
  city: string;
  uf: string;
  whatsapp: string;
  rt_name: string;
  rt_council: string;
  rt_number: string;
  cro: string;
  autoclave_serial: string;
  autoclave_brand_model: string;
  unit_id?: string | null;
};

export async function obterPerfil(): Promise<ComplianceProfile | null> {
  const { data, error } = await supabase
    .from("compliance_profiles")
    .select("*")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ComplianceProfile | null) ?? null;
}

export async function salvarPerfil(
  organizacaoId: string,
  entrada: EntradaPerfil,
  id?: string,
): Promise<ComplianceProfile> {
  if (!entrada.clinic_name.trim()) throw new Error("Informe o nome da clínica.");
  if (!entrada.rt_name.trim() || !entrada.rt_number.trim())
    throw new Error("Informe o responsável técnico e o número do conselho (CRO/CRM).");
  if (!entrada.cro.trim()) throw new Error("Informe o CRO do responsável técnico.");
  const campos = {
    organizacao_id: organizacaoId,
    type: "DENTISTA_INDIVIDUAL",
    status: "ATIVO",
    clinic_name: entrada.clinic_name.trim(),
    cnpj: entrada.cnpj.trim() || null,
    address: entrada.address.trim(),
    city: entrada.city.trim(),
    uf: entrada.uf.trim().toUpperCase(),
    whatsapp: entrada.whatsapp.trim() || null,
    rt_name: entrada.rt_name.trim(),
    rt_council: entrada.rt_council.trim() || "CRO",
    rt_number: entrada.rt_number.trim(),
    cro: entrada.cro.trim(),
    autoclave_serial: entrada.autoclave_serial.trim(),
    autoclave_brand_model: entrada.autoclave_brand_model.trim(),
    unit_id: entrada.unit_id ?? null,
  };
  const q = id
    ? supabase.from("compliance_profiles").update(campos).eq("id", id).select("*").single()
    : supabase.from("compliance_profiles").insert(campos).select("*").single();
  const { data, error } = await q;
  if (error) throw error;
  return data as ComplianceProfile;
}

/* ------------------------------- checkpoints ------------------------------- */

function novoCodigo(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listarCheckpoints(perfilId?: string): Promise<QrCheckpoint[]> {
  let q = supabase.from("qr_checkpoints").select("*").eq("ativo", true).order("created_at");
  if (perfilId) q = q.eq("compliance_profile_id", perfilId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as QrCheckpoint[];
}

/** Cria as 9 estações padrão da clínica (idempotente por zona). */
export async function gerarCheckpointsPadrao(
  organizacaoId: string,
  perfil: ComplianceProfile,
): Promise<QrCheckpoint[]> {
  const existentes = await listarCheckpoints(perfil.id);
  const faltantes = ZONAS_PADRAO.filter((z) => !existentes.some((c) => c.zone_type === z));
  if (faltantes.length) {
    const { error } = await supabase.from("qr_checkpoints").insert(
      faltantes.map((z) => ({
        organizacao_id: organizacaoId,
        compliance_profile_id: perfil.id,
        name: ZONAS[z].label,
        zone_type: z,
        code: novoCodigo(),
      })),
    );
    if (error) throw error;
  }
  return listarCheckpoints(perfil.id);
}

export async function renomearCheckpoint(id: string, customName: string) {
  const { error } = await supabase
    .from("qr_checkpoints")
    .update({ custom_name: customName.trim() })
    .eq("id", id);
  if (error) throw error;
}

export async function buscarCheckpointPorCodigo(code: string): Promise<QrCheckpoint | null> {
  const { data, error } = await supabase
    .from("qr_checkpoints")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return (data as QrCheckpoint | null) ?? null;
}

/** Extrai o código do checkpoint de um QR (URL da estação ou o código puro). */
export function codigoDoQr(raw: string): string {
  const limpo = raw.trim();
  const m = limpo.match(/[?&]c=([a-f0-9]{8,})/i) ?? limpo.match(/\/qr\/([a-f0-9]{8,})/i);
  return (m?.[1] ?? limpo).toLowerCase();
}

/** URL impressa na etiqueta da estação. */
export function urlDaEstacao(code: string, origem: string): string {
  return `${origem}/saude?c=${code}`;
}

/* ----------------------------- fotos com carimbo ----------------------------- */

function dataUrlParaFile(dataUrl: string, nome: string): File {
  const [cabec, base] = dataUrl.split(",");
  const tipo = /:(.*?);/.exec(cabec ?? "")?.[1] ?? "image/jpeg";
  const bin = atob(base ?? "");
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new File([buf], nome, { type: tipo });
}

export function lerArquivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

export async function posicaoAtual(): Promise<{ lat: number | null; lng: number | null }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return { lat: null, lng: null };
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

/** Aplica carimbo de data/hora + GPS e envia ao armazenamento seguro. */
export async function enviarFotoCarimbada(
  file: File,
  info: { unidade: string; local?: string; lat?: number | null; lng?: number | null },
): Promise<string> {
  const dataUrl = await lerArquivoComoDataUrl(file);
  const carimbada = await applyWatermark(dataUrl, {
    unidade: info.unidade,
    ...(info.local ? { local: info.local } : {}),
    ...(info.lat != null ? { lat: info.lat } : {}),
    ...(info.lng != null ? { lng: info.lng } : {}),
  });
  const caminho = `saude/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from("evidencias")
    .upload(caminho, dataUrlParaFile(carimbada, "foto.jpg"), { contentType: "image/jpeg" });
  if (error) throw error;
  return caminho;
}

export async function urlAssinada(caminho: string): Promise<string | null> {
  const { data } = await supabase.storage.from("evidencias").createSignedUrl(caminho, 3600);
  return data?.signedUrl ?? null;
}

/* ------------------------------ checklist logs ------------------------------ */

export type EntradaChecklist = {
  organizacao_id: string;
  checkpoint_id: string;
  frequency: Frequency;
  operator_name: string;
  data_json: Record<string, boolean>;
  photo_urls: string[];
  lat: number | null;
  lng: number | null;
  timestamp_gps: string;
};

export async function registrarChecklist(e: EntradaChecklist): Promise<void> {
  const { error } = await supabase.from("checklist_logs").insert({
    organizacao_id: e.organizacao_id,
    checkpoint_id: e.checkpoint_id,
    frequency: e.frequency,
    operator_name: e.operator_name,
    data_json: e.data_json,
    photo_urls: e.photo_urls,
    lat: e.lat,
    lng: e.lng,
    timestamp_gps: e.timestamp_gps,
    synced_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function listarChecklists(dias = 30): Promise<ChecklistLog[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("checklist_logs")
    .select("*")
    .gte("timestamp_gps", desde)
    .order("timestamp_gps", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as ChecklistLog[];
}

/** Correção de registro imutável: entra como estorno com justificativa. */
export async function estornarChecklist(
  organizacaoId: string,
  original: ChecklistLog,
  justificativa: string,
) {
  const motivo = validarJustificativa(justificativa);
  const { error } = await supabase.from("checklist_logs").insert({
    organizacao_id: organizacaoId,
    checkpoint_id: original.checkpoint_id,
    frequency: original.frequency,
    operator_name: original.operator_name,
    data_json: original.data_json,
    photo_urls: original.photo_urls,
    timestamp_gps: new Date().toISOString(),
    reversal_of_id: original.id,
    reversal_reason: motivo,
  });
  if (error) throw error;
}

/* ------------------------------ ciclos autoclave ------------------------------ */

export type EntradaCicloAutoclave = {
  equipment_serial: string;
  equipment_brand_model: string;
  cycle_date_time: string;
  batch_number: string;
  time_minutes: number | null;
  temp_celsius: number | null;
  pressure_bar: number | null;
  chemical_indicator_result: "APROVADO" | "REPROVADO" | "";
  packages_list: string;
  operator_name: string;
  photo_integrator_url: string | null;
  photo_panel_url: string | null;
  corrective_action_log: string;
};

export const CICLO_VAZIO: EntradaCicloAutoclave = {
  equipment_serial: "",
  equipment_brand_model: "",
  cycle_date_time: "",
  batch_number: "",
  time_minutes: null,
  temp_celsius: null,
  pressure_bar: null,
  chemical_indicator_result: "",
  packages_list: "",
  operator_name: "",
  photo_integrator_url: null,
  photo_panel_url: null,
  corrective_action_log: "",
};

/** Os 7 campos obrigatórios da RDC 1.002/2025 + foto do integrador. */
export function pendenciasCiclo(c: EntradaCicloAutoclave): string[] {
  const faltas: string[] = [];
  if (!c.cycle_date_time) faltas.push("Data e hora do ciclo");
  if (!c.batch_number.trim()) faltas.push("Número do lote");
  if (!c.equipment_serial.trim()) faltas.push("Identificação do equipamento (série)");
  if (c.chemical_indicator_result !== "APROVADO" && c.chemical_indicator_result !== "REPROVADO")
    faltas.push("Resultado do indicador químico (Tipo 5/6)");
  if (!c.packages_list.trim()) faltas.push("Relação de pacotes do lote");
  if (!c.operator_name.trim()) faltas.push("Operador responsável");
  if (c.time_minutes == null || c.temp_celsius == null || c.pressure_bar == null)
    faltas.push("Parâmetros físicos (tempo, temperatura e pressão)");
  if (!c.photo_integrator_url) faltas.push("Foto do integrador químico");
  if (!c.photo_panel_url) faltas.push("Foto do painel da autoclave no fim do ciclo");
  if (c.chemical_indicator_result === "REPROVADO" && !c.corrective_action_log.trim())
    faltas.push("Registro da ação corretiva do lote reprovado");
  return faltas;
}

export function podeSalvarCiclo(c: EntradaCicloAutoclave): boolean {
  return pendenciasCiclo(c).length === 0;
}

/** Schema estrito da RDC 1.002/2025: 7 campos + foto obrigatória do integrador químico. */
const textoSanitario = (campo: string, min = 1) =>
  z
    .string()
    .trim()
    .min(min, `${campo} é obrigatório.`)
    .refine((v) => !termoProibido(v), `${campo} contém expressão proibida.`)
    .refine((v) => !dadoDePaciente(v), `${campo} não pode conter dado de paciente.`);

export const cicloAutoclaveSchema = z
  .object({
    cycle_date_time: z.string().min(1, "Data e hora do ciclo é obrigatória."),
    batch_number: textoSanitario("Número do lote").max(60),
    equipment_serial: textoSanitario("Identificação do equipamento").max(80),
    equipment_brand_model: z.string().trim().max(120).default(""),
    time_minutes: z.number({ error: "Tempo é obrigatório." }).min(1).max(600),
    temp_celsius: z.number({ error: "Temperatura é obrigatória." }).min(50).max(200),
    pressure_bar: z.number({ error: "Pressão é obrigatória." }).min(0).max(10),
    chemical_indicator_result: z.enum(["APROVADO", "REPROVADO"], {
      error: "Informe o resultado do indicador químico Tipo 5/6.",
    }),
    packages_list: textoSanitario("Relação de pacotes", 3).max(2000),
    operator_name: textoSanitario("Operador responsável", 2).max(120),
    photo_integrator_url: z.string().min(1, "Foto do integrador químico é obrigatória."),
    photo_panel_url: z.string().min(1, "Foto do painel da autoclave é obrigatória."),
    corrective_action_log: z.string().trim().max(2000).default(""),
  })
  .refine(
    (c) => c.chemical_indicator_result !== "REPROVADO" || c.corrective_action_log.length >= 15,
    { message: "Lote reprovado exige ação corretiva com no mínimo 15 caracteres.", path: ["corrective_action_log"] },
  );

export function validarCiclo(c: EntradaCicloAutoclave): string[] {
  const r = cicloAutoclaveSchema.safeParse(c);
  return r.success ? [] : r.error.issues.map((i) => i.message);
}


export async function registrarCicloAutoclave(
  organizacaoId: string,
  perfilId: string | null,
  c: EntradaCicloAutoclave,
): Promise<"APROVADO" | "REPROVADO"> {
  const faltas = [...pendenciasCiclo(c), ...validarCiclo(c)];
  if (faltas.length) throw new Error(`Faltam dados obrigatórios: ${[...new Set(faltas)].join("; ")}.`);
  const status = c.chemical_indicator_result === "APROVADO" ? "APROVADO" : "REPROVADO";
  const { error } = await supabase.from("autoclave_cycles").insert({
    organizacao_id: organizacaoId,
    compliance_profile_id: perfilId,
    equipment_serial: c.equipment_serial.trim(),
    equipment_brand_model: c.equipment_brand_model.trim(),
    cycle_date_time: new Date(c.cycle_date_time).toISOString(),
    batch_number: c.batch_number.trim(),
    time_minutes: c.time_minutes!,
    temp_celsius: c.temp_celsius!,
    pressure_bar: c.pressure_bar!,
    chemical_indicator_result: c.chemical_indicator_result,
    packages_list: c.packages_list.trim(),
    operator_name: c.operator_name.trim(),
    photo_integrator_url: c.photo_integrator_url!,
    photo_panel_url: c.photo_panel_url,
    status,
    corrective_action_log: c.corrective_action_log.trim() || null,
  });
  if (error) throw error;
  return status;
}

export async function listarCiclosAutoclave(dias = 90): Promise<AutoclaveCycle[]> {
  const desde = new Date(Date.now() - dias * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("autoclave_cycles")
    .select("*")
    .gte("cycle_date_time", desde)
    .order("cycle_date_time", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as AutoclaveCycle[];
}

/** Estorno de ciclo (o original permanece inalterado, conforme exigência de imutabilidade). */
export async function estornarCiclo(
  organizacaoId: string,
  original: AutoclaveCycle,
  justificativa: string,
) {
  const motivo = validarJustificativa(justificativa);
  const { error } = await supabase.from("autoclave_cycles").insert({
    organizacao_id: organizacaoId,
    equipment_serial: original.equipment_serial,
    equipment_brand_model: original.equipment_brand_model,
    cycle_date_time: original.cycle_date_time,
    batch_number: original.batch_number,
    time_minutes: original.time_minutes,
    temp_celsius: original.temp_celsius,
    pressure_bar: original.pressure_bar,
    chemical_indicator_result: original.chemical_indicator_result,
    packages_list: original.packages_list,
    operator_name: original.operator_name,
    photo_integrator_url: original.photo_integrator_url,
    status: "REPROVADO",
    corrective_action_log: `ESTORNO: ${motivo}`,
    reversal_of_id: original.id,
    reversal_reason: motivo,
  });
  if (error) throw error;
}

/** Lote liberado só quando o ciclo está aprovado e não foi estornado. */
export function loteLiberado(c: AutoclaveCycle, estornos: AutoclaveCycle[]): boolean {
  if (c.status !== "APROVADO") return false;
  return !estornos.some((e) => e.reversal_of_id === c.id);
}

/* ------------------------------ testes biológicos ------------------------------ */

export type EntradaTesteBiologico = {
  autoclave_cycle_id: string | null;
  test_date: string;
  indicator_batch_number: string;
  result: "NEGATIVO" | "POSITIVO";
  photo_vial_url: string | null;
  operator_name: string;
  corrective_action_log?: string;
};

/** Pendências do teste biológico semanal (foto da ampola sempre; ação corretiva se positivo). */
export function pendenciasTesteBiologico(t: EntradaTesteBiologico): string[] {
  const faltas: string[] = [];
  if (!t.test_date) faltas.push("Data do teste");
  if (!t.indicator_batch_number.trim()) faltas.push("Lote do indicador biológico");
  if (!t.operator_name.trim()) faltas.push("Operador responsável");
  if (!t.photo_vial_url) faltas.push("Foto da ampola com o resultado");
  if (t.result === "POSITIVO" && !(t.corrective_action_log ?? "").trim())
    faltas.push("Ação corretiva do resultado positivo");
  return faltas;
}

export async function registrarTesteBiologico(organizacaoId: string, t: EntradaTesteBiologico) {
  const faltas = pendenciasTesteBiologico(t);
  if (faltas.length) throw new Error(`Faltam dados obrigatórios: ${faltas.join("; ")}.`);
  const { error } = await supabase.from("biological_tests").insert({
    organizacao_id: organizacaoId,
    autoclave_cycle_id: t.autoclave_cycle_id,
    test_date: t.test_date,
    indicator_batch_number: t.indicator_batch_number.trim(),
    result: t.result,
    photo_vial_url: t.photo_vial_url,
    operator_name: t.operator_name.trim(),
    corrective_action_log: (t.corrective_action_log ?? "").trim() || null,
  });
  if (error) throw error;
}

export async function listarTestesBiologicos(semanas = 8): Promise<BiologicalTest[]> {
  const desde = new Date(Date.now() - semanas * 7 * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("biological_tests")
    .select("*")
    .gte("test_date", desde)
    .order("test_date", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as BiologicalTest[];
}

export const FLAG_BIOLOGICO_ATRASADO = "FLAG_BIOLOGICO_ATRASADO";

/** O teste biológico é semanal: passou de 7 dias do último, sinaliza atraso. */
export function biologicoAtrasado(testes: BiologicalTest[], hoje = new Date()): boolean {
  const ultimo = testes
    .map((t) => new Date(`${t.test_date}T12:00:00`).getTime())
    .sort((a, b) => b - a)[0];
  if (!ultimo) return true;
  return (hoje.getTime() - ultimo) / 86_400_000 > 7;
}

export function diasDesdeUltimoBiologico(testes: BiologicalTest[]): number | null {
  const ultimo = testes
    .map((t) => new Date(`${t.test_date}T12:00:00`).getTime())
    .sort((a, b) => b - a)[0];
  if (!ultimo) return null;
  return Math.floor((Date.now() - ultimo) / 86_400_000);
}

/* --------------------------------- semáforo --------------------------------- */

export type Semaforo = "EM_DIA" | "ATRASADO" | "CRITICO";

export const CORES_SEMAFORO: Record<Semaforo, { label: string; classe: string }> = {
  EM_DIA: { label: "Em dia", classe: "bg-teal text-teal-foreground" },
  ATRASADO: { label: "Atrasado", classe: "bg-amber-500 text-white" },
  CRITICO: { label: "Crítico", classe: "bg-destructive text-destructive-foreground" },
};

export type ResumoConformidade = {
  semaforo: Semaforo;
  alertas: string[];
  checklistsHoje: number;
  ciclosPeriodo: number;
  ciclosReprovados: number;
  biologicoAtrasado: boolean;
  diasSemBiologico: number | null;
};

export function resumirConformidade(
  logs: ChecklistLog[],
  ciclos: AutoclaveCycle[],
  testes: BiologicalTest[],
  documentos: { title: string; valid_until: string | null }[] = [],
): ResumoConformidade {
  const hoje = new Date().toDateString();
  const checklistsHoje = logs.filter(
    (l) => new Date(l.timestamp_gps).toDateString() === hoje,
  ).length;
  const reprovados = ciclos.filter(
    (c) => (c.status === "REPROVADO" || c.status === "BLOQUEADO") && !c.reversal_of_id,
  );
  const atrasado = biologicoAtrasado(testes);
  const positivo = testes.some((t) => t.result === "POSITIVO");

  const alertas: string[] = [];
  if (atrasado) alertas.push(`${FLAG_BIOLOGICO_ATRASADO}: teste biológico semanal vencido.`);
  if (positivo) alertas.push("Teste biológico POSITIVO — autoclave deve ser interditada até nova validação.");
  if (reprovados.length)
    alertas.push(`${reprovados.length} ciclo(s) reprovado(s) — lote bloqueado para uso.`);
  if (!checklistsHoje) alertas.push("Nenhum checklist registrado hoje.");

  const vencidos: string[] = [];
  for (const d of documentos) {
    const s = situacaoLicenca(d.valid_until);
    if (s.estado === "VENCIDO") {
      vencidos.push(d.title);
      alertas.push(`Documento vencido: ${d.title}.`);
    } else if (s.estado === "A_VENCER") {
      alertas.push(`Documento a vencer em ${s.dias} dia(s): ${d.title}.`);
    }
  }

  const semaforo: Semaforo =
    positivo || reprovados.length || vencidos.length
      ? "CRITICO"
      : atrasado || !checklistsHoje || alertas.length
        ? "ATRASADO"
        : "EM_DIA";

  return {
    semaforo,
    alertas,
    checklistsHoje,
    ciclosPeriodo: ciclos.length,
    ciclosReprovados: reprovados.length,
    biologicoAtrasado: atrasado,
    diasSemBiologico: diasDesdeUltimoBiologico(testes),
  };
}

/* --------------------- licenças e anexos obrigatórios --------------------- */

/** Documentos exigidos pelas normas (RDC 222/2018, 330/2019, 63/2011 e NR-32). */
export const TIPOS_LICENCA = [
  { id: "ALVARA_SANITARIO", label: "Alvará sanitário", categoria: "ALVARA", meses: 12 },
  { id: "AVCB_BOMBEIROS", label: "AVCB / auto de vistoria do Corpo de Bombeiros", categoria: "ALVARA", meses: 12 },
  { id: "CONTRATO_LIXO_PGRSS", label: "PGRSS / contrato de resíduos (MTR)", categoria: "RESIDUOS", meses: 12 },
  { id: "LAUDO_RAIO_X", label: "Laudo de radioproteção / teste de Raio-X", categoria: "LAUDO", meses: 12 },
  { id: "DOSIMETRIA", label: "Relatório de dosimetria individual", categoria: "LAUDO", meses: 1 },
  { id: "CERTIFICADO_DEDETIZACAO", label: "Certificado de desinsetização/desratização", categoria: "LAUDO", meses: 6 },
  { id: "LIMPEZA_CAIXA_DAGUA", label: "Limpeza da caixa d'água / potabilidade", categoria: "LAUDO", meses: 6 },
  { id: "ART_ENGENHARIA", label: "ART de engenharia / manutenção de equipamentos", categoria: "MANUTENCAO", meses: 12 },
  { id: "PGR_NR01_NR32", label: "PGR (NR-01) e programa de riscos biológicos (NR-32)", categoria: "POP", meses: 12 },
  { id: "ASO_ESOCIAL", label: "ASO / eventos de SST no eSocial (S-2210, S-2220, S-2240)", categoria: "TREINAMENTO", meses: 12 },
  { id: "TCLE_LGPD", label: "Modelos de TCLE e uso de imagem (LGPD)", categoria: "CONTRATO", meses: 24 },
] as const;

export type TipoLicenca = (typeof TIPOS_LICENCA)[number]["id"];

export type EstadoLicenca = "SEM_PRAZO" | "VALIDO" | "A_VENCER" | "VENCIDO";

/** Situação de validade de um anexo: vencido, a vencer (30 dias) ou válido. */
export function situacaoLicenca(validUntil: string | null): {
  estado: EstadoLicenca;
  dias: number | null;
  label: string;
  classe: string;
} {
  if (!validUntil)
    return { estado: "SEM_PRAZO", dias: null, label: "Sem prazo", classe: "bg-muted text-muted-foreground" };
  const dias = Math.ceil((new Date(`${validUntil}T12:00:00`).getTime() - Date.now()) / 86_400_000);
  if (dias < 0)
    return { estado: "VENCIDO", dias, label: "Vencido", classe: "bg-destructive text-destructive-foreground" };
  if (dias <= 30)
    return { estado: "A_VENCER", dias, label: `Vence em ${dias} d`, classe: "bg-amber-500 text-white" };
  return { estado: "VALIDO", dias, label: `Válido (${dias} d)`, classe: "bg-teal text-teal-foreground" };
}


/* ------------------------ autenticidade do documento ------------------------ */

export async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function registrarDocumento(d: {
  organizacao_id: string;
  sha256: string;
  clinic_name: string;
  period_start: string | null;
  period_end: string | null;
  plan: string;
  file_path?: string | null;
  title?: string;
  mime_type?: string | null;
  size_bytes?: number | null;
}) {
  const { error } = await supabase.from("dossier_documents").insert({ ...d, kind: "DOSSIE" });
  if (error) throw error;
}

/* ---------------------- biblioteca de pastas e anexos ---------------------- */

export const CATEGORIAS_PASTA = [
  { id: "ALVARA", label: "Alvarás e licenças", emoji: "🏛️" },
  { id: "LAUDO", label: "Laudos e análises", emoji: "🧪" },
  { id: "POP", label: "POPs e manuais", emoji: "📘" },
  { id: "TREINAMENTO", label: "Treinamentos e certificados", emoji: "🎓" },
  { id: "CONTRATO", label: "Contratos e notas", emoji: "📄" },
  { id: "RESIDUOS", label: "PGRSS e resíduos", emoji: "♻️" },
  { id: "MANUTENCAO", label: "Manutenção e calibração", emoji: "🔧" },
  { id: "OUTROS", label: "Outros anexos", emoji: "📎" },
] as const;

export type CategoriaPasta = (typeof CATEGORIAS_PASTA)[number]["id"];

export type DocumentoPasta = {
  id: string;
  organizacao_id: string;
  kind: string;
  title: string;
  category: string;
  clinic_name: string;
  file_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  notes: string | null;
  valid_until: string | null;
  period_start: string | null;
  period_end: string | null;
  plan: string;
  sha256: string;
  generated_at: string;
};

export async function listarDocumentosPasta(): Promise<DocumentoPasta[]> {
  const { data, error } = await supabase
    .from("dossier_documents")
    .select("*")
    .order("generated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentoPasta[];
}

/** Envia um arquivo qualquer (PDF, imagem, planilha) para a pasta da organização. */
export async function enviarAnexoPasta(entrada: {
  organizacao_id: string;
  clinic_name?: string;
  title: string;
  category: CategoriaPasta | string;
  notes?: string;
  valid_until?: string | null;
  file: File;
}): Promise<void> {
  const { file } = entrada;
  if (file.size > 25 * 1024 * 1024) throw new Error("Arquivo acima de 25 MB.");
  const proibido = termoProibido(`${entrada.title} ${entrada.notes ?? ""}`);
  if (proibido) throw new Error(`Texto não permitido: "${proibido}".`);

  const extensao = (file.name.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
  const caminho = `saude/anexos/${entrada.organizacao_id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extensao}`;
  const { error: upErro } = await supabase.storage
    .from("evidencias")
    .upload(caminho, file, { contentType: file.type || "application/octet-stream" });
  if (upErro) throw upErro;

  const { data: sessao } = await supabase.auth.getUser();
  const { error } = await supabase.from("dossier_documents").insert({
    organizacao_id: entrada.organizacao_id,
    kind: "ANEXO",
    title: entrada.title.trim(),
    category: entrada.category,
    clinic_name: entrada.clinic_name ?? "",
    file_path: caminho,
    mime_type: file.type || null,
    size_bytes: file.size,
    notes: entrada.notes?.trim() || null,
    valid_until: entrada.valid_until || null,
    plan: "ANEXO",
    sha256: await sha256(`${caminho}|${file.size}|${Date.now()}`),
    uploaded_by: sessao.user?.id ?? null,
  });
  if (error) throw error;
}

export async function excluirAnexoPasta(doc: DocumentoPasta): Promise<void> {
  if (doc.file_path) await supabase.storage.from("evidencias").remove([doc.file_path]);
  const { error } = await supabase.from("dossier_documents").delete().eq("id", doc.id);
  if (error) throw error;
}

/** Envia o PDF gerado do dossiê para a nuvem e devolve o caminho salvo. */
export async function guardarPdfDossie(
  organizacaoId: string,
  blob: Blob,
  nome: string,
): Promise<string | null> {
  const caminho = `saude/dossies/${organizacaoId}/${nome}`;
  const { error } = await supabase.storage
    .from("evidencias")
    .upload(caminho, blob, { contentType: "application/pdf", upsert: true });
  if (error) return null;
  return caminho;
}

