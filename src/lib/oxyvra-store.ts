// Simulated database (localStorage) for Oxyvra.
// Estrutura: Prefeitura → Unidades (Escola/Clínica/Berçário) → Limpezas.

import { useSyncExternalStore } from "react";

export type Ambiente =
  | "banheiros"
  | "salas"
  | "refeitorio"
  | "consultorios"
  | "recepcao"
  | "cozinha"
  | "patio"
  | "biblioteca"
  | "laboratorio"
  | "salaprofessores"
  | "dormitorios"
  | "fraldario"
  | "brinquedoteca"
  | "secretaria"
  | "enfermaria"
  | "corredores"
  | "vestiarios"
  | "camara_fria"
  | "esteira_producao"
  | "barreira_sanitaria";

export const AMBIENTES_META: Record<
  Ambiente,
  { id: Ambiente; emoji: string; titulo: string; sub: string; label: string }
> = {
  banheiros: {
    id: "banheiros",
    emoji: "🚽",
    titulo: "BANHEIROS",
    sub: "Higienização das rotinas",
    label: "Banheiros",
  },
  salas: {
    id: "salas",
    emoji: "🧸",
    titulo: "SALAS",
    sub: "Brinquedos e superfícies",
    label: "Salas",
  },
  refeitorio: {
    id: "refeitorio",
    emoji: "🍽️",
    titulo: "REFEITÓRIO",
    sub: "Mesas e bancadas",
    label: "Refeitório",
  },
  consultorios: {
    id: "consultorios",
    emoji: "🩺",
    titulo: "CONSULTÓRIOS",
    sub: "Macas e superfícies clínicas",
    label: "Consultórios",
  },
  recepcao: {
    id: "recepcao",
    emoji: "🛎️",
    titulo: "RECEPÇÃO",
    sub: "Balcão e sala de espera",
    label: "Recepção",
  },
  cozinha: {
    id: "cozinha",
    emoji: "🍳",
    titulo: "COZINHA",
    sub: "Fogão, bancadas e utensílios",
    label: "Cozinha",
  },
  patio: {
    id: "patio",
    emoji: "🌳",
    titulo: "PÁTIO / PLAYGROUND",
    sub: "Área externa e brinquedões",
    label: "Pátio",
  },
  biblioteca: {
    id: "biblioteca",
    emoji: "📚",
    titulo: "BIBLIOTECA",
    sub: "Livros, mesas e estantes",
    label: "Biblioteca",
  },
  laboratorio: {
    id: "laboratorio",
    emoji: "🧪",
    titulo: "LABORATÓRIO",
    sub: "Bancadas e equipamentos",
    label: "Laboratório",
  },
  salaprofessores: {
    id: "salaprofessores",
    emoji: "🍎",
    titulo: "SALA DOS PROFESSORES",
    sub: "Mesa de trabalho e copa",
    label: "Sala dos Professores",
  },
  dormitorios: {
    id: "dormitorios",
    emoji: "🛏️",
    titulo: "DORMITÓRIOS",
    sub: "Berços e caminhas",
    label: "Dormitórios",
  },
  fraldario: {
    id: "fraldario",
    emoji: "🍼",
    titulo: "FRALDÁRIO",
    sub: "Trocadores e área de higiene infantil",
    label: "Fraldário",
  },
  brinquedoteca: {
    id: "brinquedoteca",
    emoji: "🧩",
    titulo: "BRINQUEDOTECA",
    sub: "Brinquedos e jogos educativos",
    label: "Brinquedoteca",
  },
  secretaria: {
    id: "secretaria",
    emoji: "🗂️",
    titulo: "SECRETARIA",
    sub: "Balcão e arquivos",
    label: "Secretaria",
  },
  enfermaria: {
    id: "enfermaria",
    emoji: "💊",
    titulo: "ENFERMARIA",
    sub: "Maca e materiais de primeiros socorros",
    label: "Enfermaria",
  },
  corredores: {
    id: "corredores",
    emoji: "🚶",
    titulo: "CORREDORES",
    sub: "Circulação e portas",
    label: "Corredores",
  },
  vestiarios: {
    id: "vestiarios",
    emoji: "🎒",
    titulo: "VESTIÁRIOS",
    sub: "Armários e banheiros de funcionários",
    label: "Vestiários",
  },
  camara_fria: {
    id: "camara_fria",
    emoji: "❄️",
    titulo: "CÂMARA FRIA",
    sub: "Pisos, paredes e prateleiras refrigeradas",
    label: "Câmara Fria",
  },
  esteira_producao: {
    id: "esteira_producao",
    emoji: "🏭",
    titulo: "ESTEIRA / PRODUÇÃO",
    sub: "Bancadas inox, esteiras e utensílios de contato",
    label: "Esteira / Produção",
  },
  barreira_sanitaria: {
    id: "barreira_sanitaria",
    emoji: "🧴",
    titulo: "BARREIRA SANITÁRIA",
    sub: "Lava-botas, pedilúvio e acesso à produção",
    label: "Barreira Sanitária",
  },
};

export const AMBIENTES_ALL: Ambiente[] = [
  "banheiros",
  "salas",
  "refeitorio",
  "consultorios",
  "recepcao",
  "cozinha",
  "patio",
  "biblioteca",
  "laboratorio",
  "salaprofessores",
  "dormitorios",
  "fraldario",
  "brinquedoteca",
  "secretaria",
  "enfermaria",
  "corredores",
  "vestiarios",
  "camara_fria",
  "esteira_producao",
  "barreira_sanitaria",
];

export function getAmbienteMeta(
  key: string,
  custom?: Record<string, AmbienteCustom>,
): { id: string; emoji: string; titulo: string; sub: string; label: string } {
  const predefinido = AMBIENTES_META[key as Ambiente];
  if (predefinido) return predefinido;
  const c = custom?.[key];
  if (c) {
    return {
      id: key,
      emoji: c.emoji,
      titulo: c.label.toUpperCase(),
      sub: "Ambiente personalizado",
      label: c.label,
    };
  }
  return {
    id: key,
    emoji: "🧼",
    titulo: key.toUpperCase(),
    sub: "Ambiente personalizado",
    label: key,
  };
}

export type UnitTipo = "escola" | "clinica" | "bercario" | "prefeitura" | "industria";

export type Vertical =
  | "educacional"
  | "saude_odonto"
  | "estetica_beleza"
  | "alimenticio_cozinhas"
  | "hotelaria_pousadas"
  | "moteis"
  | "industria_alimenticia";

export const VERTICAIS: { id: Vertical; label: string; descricao: string }[] = [
  {
    id: "educacional",
    label: "Educacional",
    descricao: "Escolas, berçários, creches e prédios públicos",
  },
  {
    id: "saude_odonto",
    label: "Saúde e Odontologia",
    descricao: "Clínicas, consultórios, hospitais e serviços de saúde (RDC 50, RDC 63, SDBPF)",
  },
  {
    id: "estetica_beleza",
    label: "Estética e Beleza",
    descricao: "Clínicas de estética, harmonização e salões (RDC 44, RDC 222, MBP/POP)",
  },
  {
    id: "alimenticio_cozinhas",
    label: "Alimentício e Cozinhas",
    descricao: "Restaurantes, cozinhas industriais, bufês e manipulação de alimentos (RDC 216)",
  },
  {
    id: "hotelaria_pousadas",
    label: "Hotelaria e Pousadas",
    descricao: "Hotéis, pousadas e meios de hospedagem (RDC 216, Portaria 888, PMOC)",
  },
  {
    id: "moteis",
    label: "Motéis e Alta Rotatividade",
    descricao: "Motéis e hospedagem de alta rotatividade, sanitização de hidros e suítes",
  },
  {
    id: "industria_alimenticia",
    label: "Indústria Alimentícia e Frigoríficos",
    descricao: "Plantas industriais, câmaras frias e produção com contato alimentício",
  },
];

export const UNIT_TIPO_META: Record<
  UnitTipo,
  { label: string; emoji: string; ambientesDefault: Ambiente[]; verticalPadrao: Vertical }
> = {
  escola: {
    label: "Escola",
    emoji: "🏫",
    ambientesDefault: ["banheiros", "salas", "refeitorio"],
    verticalPadrao: "educacional",
  },
  clinica: {
    label: "Clínica",
    emoji: "🏥",
    ambientesDefault: ["banheiros", "consultorios", "recepcao"],
    verticalPadrao: "educacional",
  },
  bercario: {
    label: "Berçário",
    emoji: "🍼",
    ambientesDefault: ["banheiros", "salas", "refeitorio"],
    verticalPadrao: "educacional",
  },
  prefeitura: {
    label: "Prefeitura",
    emoji: "🏛️",
    ambientesDefault: ["banheiros", "salas", "recepcao"],
    verticalPadrao: "educacional",
  },
  industria: {
    label: "Indústria / Frigorífico",
    emoji: "🏭",
    ambientesDefault: ["esteira_producao", "camara_fria", "barreira_sanitaria", "vestiarios"],
    verticalPadrao: "industria_alimenticia",
  },
};

export const UNIT_TIPOS: UnitTipo[] = ["prefeitura", "clinica", "escola", "bercario", "industria"];


export type Prefeitura = {
  id: string;
  nome: string; // ex: "Valinhos" ou "Alimentos Brasil S/A"
  uf: string; // ex: "SP"
  vertical?: Vertical; // Segmento operacional legado (default: educacional)
  /** VerticalType (B2G_EDUCATION | B2G_HEALTH | B2B_FOOD_INDUSTRY | B2B_PHARMA | B2B_GENERAL) */
  verticalType?: string;
  responsavelQa?: string; // Gerente de Qualidade notificado em não-conformidades
  responsavelTecnico?: string; // RT que assina o dossiê PPOH
  registroRt?: string; // CRQ / CRMV / CRF
  // --- Dados do contrato ---
  valorMensal?: number; // R$ por mês
  diaVencimento?: number; // 1-28
  inicioContrato?: string; // ISO date (YYYY-MM-DD)
  fimContrato?: string; // ISO date (YYYY-MM-DD)
  numeroContrato?: string;
  observacoes?: string;
};

export type Pagamento = {
  id: string;
  prefeituraId: string;
  competencia: string; // ex: "2026-07" (YYYY-MM)
  valor: number;
  vencimento: string; // ISO date
  pagoEm?: string; // ISO date; ausência = pendente
  metodo?: string;
  observacao?: string;
};

export type Despesa = {
  id: string;
  prefeituraId: string;
  data: string; // ISO date
  categoria: "produto" | "mao_de_obra" | "logistica" | "equipamento" | "outros";
  descricao: string;
  valor: number;
  quantidade?: number;
  unidade?: string; // Ex: "L", "un", "kg"
};

export const DESPESA_CATEGORIAS: Record<
  Despesa["categoria"],
  { label: string; emoji: string; hex: string }
> = {
  produto: { label: "Produto", emoji: "🧴", hex: "#2563EB" },
  mao_de_obra: { label: "Mão de Obra", emoji: "👷", hex: "#7C3AED" },
  logistica: { label: "Logística", emoji: "🚚", hex: "#0891B2" },
  equipamento: { label: "Equipamento", emoji: "🧰", hex: "#EA580C" },
  outros: { label: "Outros", emoji: "📌", hex: "#64748B" },
};

export type CorLimpeza = "azul" | "verde" | "vermelho" | "amarelo" | "branco";

export const CORES_LIMPEZA: Record<
  CorLimpeza,
  { id: CorLimpeza; label: string; hex: string; uso: string }
> = {
  azul: { id: "azul", label: "Azul", hex: "#2563EB", uso: "Áreas gerais / vidros" },
  verde: { id: "verde", label: "Verde", hex: "#16A34A", uso: "Cozinha / refeitório" },
  vermelho: { id: "vermelho", label: "Vermelho", hex: "#DC2626", uso: "Banheiros / sanitários" },
  amarelo: { id: "amarelo", label: "Amarelo", hex: "#EAB308", uso: "Áreas críticas / clínicas" },
  branco: { id: "branco", label: "Branco", hex: "#E2E8F0", uso: "Lavatório / barreira sanitária" },
};

export const CORES_LIMPEZA_LIST: CorLimpeza[] = ["azul", "verde", "vermelho", "amarelo", "branco"];

export type LocalAmbiente = {
  id: string;
  tipo: string; // chave de Ambiente predefinido ou identificador de ambiente personalizado
  nome: string; // Ex: "Banheiro Feminino Térreo"
  cor?: CorLimpeza; // Código de cor da limpeza correspondente
  areaM2?: number; // Metragem do local (usada para cálculo de consumo de produto)
  frequenciaDia?: number; // Vezes/dia esperadas; se ausente cai no padrão do ambiente
  tempoMinimoSeg?: number; // Sobrescreve o tempo mínimo padrão do ambiente
  foto?: string; // Foto de referência do ambiente (dataURL)
  qrToken?: string; // Token único para identificação por QR Code (anti-fraude)
  // --- B2B Industrial (PPOH) ---
  linhaProducao?: string; // Linha de produção / área à qual o equipamento pertence
  alergenos?: string[]; // Tags de alérgeno da zona (ver Alergeno em oxyvra-industrial)
  statusOperacional?: "liberado" | "bloqueado"; // NÃO CONFORME / LINHA BLOQUEADA
};



export type AmbienteCustom = {
  label: string;
  emoji: string;
};

export type Produto = {
  id: string;
  nome: string; // Ex: "Desinfetante Hospitalar"
  cor: string; // Hex, ex: "#0B2238"
  quantidade: number;
  unidade: string; // Ex: "L", "un", "kg"
  minimo?: number; // Estoque mínimo para alerta de reposição
  catalogoId?: string; // Referência a item do catálogo Spartan
};

// ---- Catálogo Spartan (produtos pré-cadastrados) ----
export type CatalogoProduto = {
  id: string;
  nome: string;
  diluicaoDesinfeccao: number; // 1: X (partes de água por 1 de produto)
  diluicaoManutencao: number;
  taxaAplicacaoLM2: number; // Litros de solução diluída por m²
  acaoResidualHoras: number;
  embalagemPadraoLitros: number;
  precoMedioGalao: number;
  corSugerida: CorLimpeza; // Código de cor operacional recomendado
  usoRecomendado: string;
  verticais: Vertical[]; // Verticais em que o produto é aplicável
  grauAlimenticio?: boolean; // Aprovado para contato com alimentos
  requerEnxague?: boolean; // Necessita enxágue após aplicação
  zona?: string; // Zona sugerida de uso na planta
};

export const CATALOGO_SPARTAN: CatalogoProduto[] = [
  {
    id: "spartan_peroxy_4d",
    nome: "Spartan Peroxy 4D",
    diluicaoDesinfeccao: 100,
    diluicaoManutencao: 250,
    taxaAplicacaoLM2: 0.05,
    acaoResidualHoras: 72,
    embalagemPadraoLitros: 5,
    precoMedioGalao: 180.0,
    corSugerida: "amarelo",
    usoRecomendado: "Áreas críticas / clínicas / enfermaria / barreira sanitária",
    verticais: ["educacional", "industria_alimenticia"],
    requerEnxague: true,
    zona: "Zona Crítica / Barreira Sanitária",
  },
  {
    id: "spartan_dmq",
    nome: "Spartan DMQ",
    diluicaoDesinfeccao: 100,
    diluicaoManutencao: 200,
    taxaAplicacaoLM2: 0.04,
    acaoResidualHoras: 24,
    embalagemPadraoLitros: 5,
    precoMedioGalao: 120.0,
    corSugerida: "verde",
    usoRecomendado: "Cozinha / refeitório / eletrônicos e informática",
    verticais: ["educacional"],
    zona: "Zona Sensível",
  },
  {
    id: "spartan_sparquat",
    nome: "Spartan Sparquat",
    diluicaoDesinfeccao: 50,
    diluicaoManutencao: 100,
    taxaAplicacaoLM2: 0.06,
    acaoResidualHoras: 12,
    embalagemPadraoLitros: 5,
    precoMedioGalao: 85.0,
    corSugerida: "vermelho",
    usoRecomendado: "Banheiros / sanitários / vestiários / áreas externas",
    verticais: ["educacional"],
    zona: "Zona Externa e Pátios",
  },
  {
    id: "spartan_sani_t_10",
    nome: "Spartan Sani-T-10",
    diluicaoDesinfeccao: 500,
    diluicaoManutencao: 500,
    taxaAplicacaoLM2: 0.03,
    acaoResidualHoras: 8,
    embalagemPadraoLitros: 5,
    precoMedioGalao: 210.0,
    corSugerida: "verde",
    usoRecomendado: "Sanitizante quaternário — contato direto com alimentos (bancadas inox, esteiras, facas)",
    verticais: ["industria_alimenticia"],
    grauAlimenticio: true,
    requerEnxague: false,
    zona: "Contato Direto com Alimentos",
  },
  {
    id: "spartan_cj20",
    nome: "Spartan CJ-20",
    diluicaoDesinfeccao: 50,
    diluicaoManutencao: 100,
    taxaAplicacaoLM2: 0.08,
    acaoResidualHoras: 6,
    embalagemPadraoLitros: 5,
    precoMedioGalao: 240.0,
    corSugerida: "vermelho",
    usoRecomendado: "Detergente alcalino clorado — limpeza pesada (câmaras frias, pisos, paredes)",
    verticais: ["industria_alimenticia"],
    grauAlimenticio: true,
    requerEnxague: true,
    zona: "Limpeza Pesada / Câmaras Frias",
  },
];

export function getCatalogoById(id: string | undefined): CatalogoProduto | null {
  if (!id) return null;
  return CATALOGO_SPARTAN.find((c) => c.id === id) ?? null;
}

export function catalogoPorVertical(vertical: Vertical): CatalogoProduto[] {
  return CATALOGO_SPARTAN.filter((c) => c.verticais.includes(vertical));
}

export function sugerirCatalogoPorCor(
  cor: CorLimpeza | undefined,
  vertical: Vertical = "educacional",
): CatalogoProduto | null {
  if (!cor) return null;
  const educacionalMap: Record<CorLimpeza, string> = {
    vermelho: "spartan_sparquat",
    verde: "spartan_dmq",
    amarelo: "spartan_peroxy_4d",
    azul: "spartan_dmq",
    branco: "spartan_peroxy_4d",
  };
  const industriaMap: Record<CorLimpeza, string> = {
    vermelho: "spartan_cj20",
    verde: "spartan_sani_t_10",
    amarelo: "spartan_peroxy_4d",
    azul: "spartan_sani_t_10",
    branco: "spartan_sani_t_10",
  };
  // Verticais de serviços (saúde, estética, hotelaria, motéis) e cozinhas
  // usam o mesmo kit operacional do segmento educacional/sensível.
  const mapaPorVertical: Record<Vertical, Record<CorLimpeza, string>> = {
    educacional: educacionalMap,
    saude_odonto: educacionalMap,
    estetica_beleza: educacionalMap,
    alimenticio_cozinhas: industriaMap,
    hotelaria_pousadas: educacionalMap,
    moteis: educacionalMap,
    industria_alimenticia: industriaMap,
  };
  return getCatalogoById(mapaPorVertical[vertical][cor]);
}

export type RecomendacaoProduto = {
  produto: CatalogoProduto;
  litrosSolucao: number;
  litrosProdutoConcentrado: number;
  diluicao: number;
  vertical: Vertical;
};

export function recomendarParaLocal(
  local: LocalAmbiente,
  vertical: Vertical = "educacional",
): RecomendacaoProduto | null {
  const produto = sugerirCatalogoPorCor(local.cor, vertical);
  if (!produto || !local.areaM2 || local.areaM2 <= 0) return null;
  const litrosSolucao = local.areaM2 * produto.taxaAplicacaoLM2;
  const diluicao = produto.diluicaoDesinfeccao;
  const litrosProdutoConcentrado = litrosSolucao / (diluicao + 1);
  return { produto, litrosSolucao, litrosProdutoConcentrado, diluicao, vertical };
}

export function getVerticalDaUnidade(unit: Unit | undefined, prefeitura?: Prefeitura): Vertical {
  if (prefeitura?.vertical) return prefeitura.vertical;
  if (!unit) return "educacional";
  return UNIT_TIPO_META[unit.tipo]?.verticalPadrao ?? "educacional";
}



export type Unit = {
  id: string;
  prefeituraId: string;
  tipo: UnitTipo;
  nome: string; // Nome curto/apelido usado no app mobile
  bairro: string;
  pin: string;
  ambientes: string[]; // Categorias presentes (derivado de "locais")
  responsavel: string;
  // Locais específicos por ambiente (quantidade e nomes)
  locais?: LocalAmbiente[];
  // Ambientes personalizados (chave -> { label, emoji })
  ambientesCustom?: Record<string, AmbienteCustom>;
  // Kit de produtos utilizados nesta unidade
  produtos?: Produto[];
  // Dados coletados na visita técnica (auditoria)
  nomeCompleto?: string;
  endereco?: string;
  fotoFachada?: string;
  qtdAlunos?: number;
  qtdColaboradores?: number;
  // Geolocalização da unidade
  lat?: number;
  lng?: number;
  raioMetros?: number; // raio de validação de presença (default 150m)
};

export type Cleaning = {
  id: string;
  unitId: string;
  prefeituraId: string;
  ambiente: string;
  localId?: string; // Local específico (LocalAmbiente.id) quando disponível
  servente: string;
  timestamp: number; // ms epoch
  lat?: number;
  lng?: number;
  distanciaMetros?: number;
  foraDaArea?: boolean;
  fotoAntes?: string; // dataURL
  fotoDepois?: string; // dataURL
  duracaoSeg?: number; // duração medida do procedimento
  itensFeitos?: string[]; // ids dos itens do checklist marcados
  status?: "pendente" | "aprovada" | "reprovada";
  motivoReprovacao?: string;
  revisadoPor?: string;
  revisadoEm?: number;
  refazDe?: string; // id da limpeza reprovada que este registro está refazendo
  qrValidado?: boolean; // Local foi identificado por QR Code
  nfcValidado?: boolean; // Local identificado por tag NFC (indústria)
  pinOperadora?: string; // PIN pessoal usado na confirmação (anti-fraude)
  pinNome?: string; // Nome do PIN/turno usado no login (ex.: "Manhã")
  colaboradoraId?: string; // Colaboradora identificada pelo PIN
  colaboradoraNome?: string;
  // --- B2B Industrial (PPOH) ---
  tipoLimpeza?: "pre_operacional" | "troca_lote" | "pos_operacional" | "cip" | "cop";
  corKit?: CorLimpeza; // Kit de higienização utilizado
  alergenosZona?: string[]; // Alérgenos declarados na zona no momento do registro
  alertaAlergeno?: string; // Registro do alerta bloqueante, quando houve
  dwellCanceladoSeg?: number; // Dwell-time interrompido antes do mínimo
  ncId?: string; // Não-conformidade gerada por este registro
};


const PREFEITURAS_KEY = "oxyvra:v3:prefeituras";
const UNITS_KEY = "oxyvra:v3:units";

const CLEANINGS_KEY = "oxyvra:v3:cleanings";
const CURRENT_KEY = "oxyvra:v3:currentUnitId";
const INCIDENTES_KEY = "oxyvra:v3:incidentes";
const ADMIN_PIN_KEY = "oxyvra:v3:adminPin";
const ADMIN_AUTHED_KEY = "oxyvra:v3:adminAuthed";
const PAGAMENTOS_KEY = "oxyvra:v3:pagamentos";
const DESPESAS_KEY = "oxyvra:v3:despesas";
const COLABORADORAS_KEY = "oxyvra:v3:colaboradoras";
const PRESENCAS_KEY = "oxyvra:v3:presencas";
const DEFAULT_ADMIN_PIN = "9999";

// ============================================================
// Onda 2 — Escalas, presença, atrasos, motivos padronizados
// ============================================================

export type Turno = "manha" | "tarde" | "noite";

export const TURNO_META: Record<Turno, { label: string; janela: string; inicio: number; fim: number; emoji: string }> = {
  manha: { label: "Manhã", janela: "06:00 – 12:00", inicio: 6, fim: 12, emoji: "🌅" },
  tarde: { label: "Tarde", janela: "12:00 – 18:00", inicio: 12, fim: 18, emoji: "🌇" },
  noite: { label: "Noite", janela: "18:00 – 00:00", inicio: 18, fim: 24, emoji: "🌙" },
};

export const TURNOS: Turno[] = ["manha", "tarde", "noite"];

export type Colaboradora = {
  id: string;
  unitId: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  pin?: string; // PIN pessoal 4 dígitos para assinar limpezas
  turnos: Turno[];
  ativo: boolean;
};


export type Presenca = {
  id: string;
  colaboradoraId: string;
  unitId: string;
  data: string; // YYYY-MM-DD
  turno: Turno;
  checkin?: number;
  checkout?: number;
};

// Motivos padronizados de reprovação (não-conformidade categorizada)
export const MOTIVOS_REPROVACAO = [
  { id: "foto_ruim", label: "Foto ilegível / má qualidade" },
  { id: "produto_errado", label: "Produto ou cor de higienização incorreto" },
  { id: "tempo_curto", label: "Tempo abaixo do mínimo" },
  { id: "checklist_incompleto", label: "Checklist não cumprido" },
  { id: "fora_area", label: "Registrado fora da unidade" },
  { id: "sujeira_visivel", label: "Sujeira visível na foto DEPOIS" },
  { id: "outro", label: "Outro (descrever)" },
] as const;

export type IncidenteTipo = "surto" | "faltas" | "doenca" | "acidente" | "outro";

export const INCIDENTE_META: Record<
  IncidenteTipo,
  { label: string; emoji: string; hex: string; descricao: string }
> = {
  surto: { label: "Surto", emoji: "🦠", hex: "#DC2626", descricao: "Contágio ou suspeita de surto" },
  faltas: { label: "Faltas", emoji: "🚫", hex: "#F97316", descricao: "Ausência de aluno/colaborador" },
  doenca: { label: "Doença", emoji: "🤒", hex: "#EAB308", descricao: "Caso de doença isolado" },
  acidente: { label: "Acidente", emoji: "🚑", hex: "#0891B2", descricao: "Acidente ou incidente físico" },
  outro: { label: "Outro", emoji: "📝", hex: "#64748B", descricao: "Outra intercorrência" },
};

export const INCIDENTE_TIPOS: IncidenteTipo[] = ["surto", "faltas", "doenca", "acidente", "outro"];

export type Incidente = {
  id: string;
  unitId: string;
  prefeituraId: string;
  tipo: IncidenteTipo;
  quantidade: number;
  descricao: string;
  reportadoPor: string;
  timestamp: number;
  lat?: number;
  lng?: number;
};

// ---- Geolocalização helpers ----
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function getCurrentPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
): Promise<{ lat: number; lng: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!isBrowser() || !navigator.geolocation) {
      reject(new Error("Geolocalização não disponível neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(
            new Error(
              "Permissão de localização negada. Ative o GPS nas configurações do aparelho para este app e tente novamente.",
            ),
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new Error("Sinal de GPS indisponível. Vá para uma área aberta e tente novamente."));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("Tempo esgotado ao obter o GPS. Tente novamente."));
        } else {
          reject(new Error("Não foi possível obter a localização."));
        }
      },
      options,
    );
  });
}

function migrateFromV2() {
  if (!isBrowser()) return;
  if (window.localStorage.getItem(PREFEITURAS_KEY)) return; // já na v3

  const oldPrefs = window.localStorage.getItem("oxyvra:v2:prefeituras");
  const oldUnits = window.localStorage.getItem("oxyvra:v2:units");
  const oldCleanings = window.localStorage.getItem("oxyvra:v2:cleanings");

  if (oldPrefs) window.localStorage.setItem(PREFEITURAS_KEY, oldPrefs);
  if (oldUnits) {
    const units = JSON.parse(oldUnits) as Unit[];
    for (const u of units) {
      if (!u.ambientesCustom) u.ambientesCustom = {};
    }
    window.localStorage.setItem(UNITS_KEY, JSON.stringify(units));
  }
  if (oldCleanings) window.localStorage.setItem(CLEANINGS_KEY, oldCleanings);
}

const SEED_PREFEITURAS: Prefeitura[] = [
  { id: "pref-1", nome: "Valinhos", uf: "SP" },
  { id: "pref-2", nome: "Campinas", uf: "SP" },
];

const SEED_UNITS: Unit[] = [
  {
    id: "esc-1",
    prefeituraId: "pref-1",
    tipo: "escola",
    nome: "EMEI Pequeno Príncipe",
    bairro: "Centro",
    pin: "1234",
    ambientes: ["banheiros", "salas", "refeitorio"],
    responsavel: "Maria da Silva",
  },
  {
    id: "esc-2",
    prefeituraId: "pref-1",
    tipo: "bercario",
    nome: "Creche Arco-Íris",
    bairro: "Vila Nova",
    pin: "2345",
    ambientes: ["banheiros", "salas"],
    responsavel: "Joana Ribeiro",
  },
  {
    id: "esc-3",
    prefeituraId: "pref-1",
    tipo: "escola",
    nome: "EMEI Girassol",
    bairro: "Jardim das Flores",
    pin: "3456",
    ambientes: ["banheiros", "salas", "refeitorio"],
    responsavel: "Rosa Almeida",
  },
  {
    id: "esc-4",
    prefeituraId: "pref-2",
    tipo: "clinica",
    nome: "UBS Central",
    bairro: "Centro",
    pin: "4567",
    ambientes: ["banheiros", "consultorios", "recepcao"],
    responsavel: "Cátia Nunes",
  },
];

function todayAt(h: number, m: number) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

const SEED_CLEANINGS: Cleaning[] = [
  { id: "c1", unitId: "esc-1", prefeituraId: "pref-1", ambiente: "banheiros", servente: "Maria da Silva", timestamp: todayAt(7, 15) },
  { id: "c2", unitId: "esc-1", prefeituraId: "pref-1", ambiente: "salas", servente: "Ana Costa", timestamp: todayAt(9, 20) },
  { id: "c3", unitId: "esc-1", prefeituraId: "pref-1", ambiente: "refeitorio", servente: "Maria da Silva", timestamp: todayAt(10, 42) },
  { id: "c4", unitId: "esc-1", prefeituraId: "pref-1", ambiente: "banheiros", servente: "Ana Costa", timestamp: todayAt(11, 30) },
  { id: "c5", unitId: "esc-2", prefeituraId: "pref-1", ambiente: "banheiros", servente: "Joana Ribeiro", timestamp: todayAt(7, 0) },
  { id: "c6", unitId: "esc-2", prefeituraId: "pref-1", ambiente: "salas", servente: "Cátia Nunes", timestamp: todayAt(8, 10) },
  { id: "c7", unitId: "esc-3", prefeituraId: "pref-1", ambiente: "banheiros", servente: "Rosa Almeida", timestamp: todayAt(7, 30) },
  { id: "c8", unitId: "esc-3", prefeituraId: "pref-1", ambiente: "refeitorio", servente: "Lúcia Braga", timestamp: todayAt(9, 45) },
  { id: "c9", unitId: "esc-3", prefeituraId: "pref-1", ambiente: "salas", servente: "Rosa Almeida", timestamp: todayAt(11, 5) },
  { id: "c10", unitId: "esc-4", prefeituraId: "pref-2", ambiente: "recepcao", servente: "Cátia Nunes", timestamp: todayAt(8, 0) },
  { id: "c11", unitId: "esc-4", prefeituraId: "pref-2", ambiente: "consultorios", servente: "Cátia Nunes", timestamp: todayAt(10, 15) },
];

function isBrowser() {
  return typeof window !== "undefined";
}

const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    const cached = cache.get(key);
    if (cached && cached.raw === raw) return cached.value as T;
    const value = raw ? (JSON.parse(raw) as T) : fallback;
    cache.set(key, { raw, value });
    return value;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emit();
}

// Remove registros de teste antigos (ex.: "Massa", "Macarrão") gravados no
// armazenamento local do aparelho em versões anteriores do app.
const PURGE_FLAG_KEY = "oxyvra_purge_demo_v1";
// Nomes exatos de dados de demonstração antigos, removidos uma única vez.
const NOMES_DEMO = new Set(["macarrão", "macarrao", "massas", "massagens"]);

function purgeTestData() {
  try {
    if (window.localStorage.getItem(PURGE_FLAG_KEY)) return;
    window.localStorage.setItem(PURGE_FLAG_KEY, "1");
    const alvo = (n?: string) => NOMES_DEMO.has((n ?? "").trim().toLowerCase());

    const prefs = read<Prefeitura[]>(PREFEITURAS_KEY, []);
    const prefsOk = prefs.filter((p) => !alvo(p.nome));
    if (prefsOk.length !== prefs.length) write(PREFEITURAS_KEY, prefsOk);
    const prefIds = new Set(prefsOk.map((p) => p.id));

    const units = read<Unit[]>(UNITS_KEY, []);
    const unitsOk = units.filter(
      (u) => !alvo(u.nome) && (prefs.length === prefsOk.length || prefIds.has(u.prefeituraId)),
    );
    if (unitsOk.length !== units.length) {
      write(UNITS_KEY, unitsOk);
      const unitIds = new Set(unitsOk.map((u) => u.id));
      const cleanings = read<Cleaning[]>(CLEANINGS_KEY, []);
      write(
        CLEANINGS_KEY,
        cleanings.filter((c) => unitIds.has(c.unitId)),
      );
    }
  } catch {
    /* ignora falhas de limpeza */
  }
}

function ensureSeed() {
  if (!isBrowser()) return;
  migrateFromV2();
  purgeTestData();

  if (!window.localStorage.getItem(PREFEITURAS_KEY)) {
    window.localStorage.setItem(PREFEITURAS_KEY, JSON.stringify(SEED_PREFEITURAS));
  }
  if (!window.localStorage.getItem(UNITS_KEY)) {
    window.localStorage.setItem(UNITS_KEY, JSON.stringify(SEED_UNITS));
  }
  if (!window.localStorage.getItem(CLEANINGS_KEY)) {
    window.localStorage.setItem(CLEANINGS_KEY, JSON.stringify(SEED_CLEANINGS));
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}


// ============================================================
// Checklists, tempo mínimo, frequência esperada e score/ranking
// (Onda 1 — operação de campo & compliance)
// ============================================================

export type ChecklistItem = { id: string; texto: string };

const CHECKLIST_POR_AMBIENTE: Record<string, ChecklistItem[]> = {
  banheiros: [
    { id: "b1", texto: "Recolher lixo dos cestos" },
    { id: "b2", texto: "Aplicar desinfetante em vasos e mictórios" },
    { id: "b3", texto: "Limpar pias, torneiras e espelhos" },
    { id: "b4", texto: "Esfregar piso com solução Vermelha (Sparquat)" },
    { id: "b5", texto: "Repor papel, sabonete e álcool gel" },
  ],
  salas: [
    { id: "s1", texto: "Recolher lixo e organizar cadeiras" },
    { id: "s2", texto: "Passar pano úmido em mesas e superfícies" },
    { id: "s3", texto: "Higienizar maçanetas e interruptores" },
    { id: "s4", texto: "Varrer e passar mop no piso" },
  ],
  refeitorio: [
    { id: "r1", texto: "Higienizar mesas e bancadas (DMQ verde)" },
    { id: "r2", texto: "Limpar utensílios de servir" },
    { id: "r3", texto: "Passar solução Verde no piso" },
    { id: "r4", texto: "Recolher lixo orgânico" },
  ],
  consultorios: [
    { id: "co1", texto: "Trocar lençol / papel da maca" },
    { id: "co2", texto: "Desinfetar superfícies com Peroxy 4D" },
    { id: "co3", texto: "Recolher lixo infectante em saco próprio" },
    { id: "co4", texto: "Limpar equipamentos e balcão" },
  ],
  recepcao: [
    { id: "re1", texto: "Limpar balcão de atendimento" },
    { id: "re2", texto: "Higienizar cadeiras da sala de espera" },
    { id: "re3", texto: "Passar álcool 70% em maçanetas" },
    { id: "re4", texto: "Varrer e passar mop no piso" },
  ],
  cozinha: [
    { id: "k1", texto: "Higienizar bancadas com DMQ" },
    { id: "k2", texto: "Limpar fogão, coifa e utensílios" },
    { id: "k3", texto: "Lavar pia e escorredor" },
    { id: "k4", texto: "Recolher lixo orgânico" },
  ],
  fraldario: [
    { id: "f1", texto: "Higienizar trocador com Peroxy 4D" },
    { id: "f2", texto: "Trocar forros e repor fraldas/lenços" },
    { id: "f3", texto: "Recolher lixo com saco próprio" },
    { id: "f4", texto: "Passar solução no piso" },
  ],
  dormitorios: [
    { id: "d1", texto: "Trocar lençóis e forros dos berços" },
    { id: "d2", texto: "Passar pano úmido nas superfícies" },
    { id: "d3", texto: "Ventilar o ambiente" },
    { id: "d4", texto: "Varrer e passar mop" },
  ],
  enfermaria: [
    { id: "en1", texto: "Trocar lençol da maca" },
    { id: "en2", texto: "Desinfetar bancada e balança com Peroxy 4D" },
    { id: "en3", texto: "Recolher lixo infectante" },
    { id: "en4", texto: "Higienizar piso" },
  ],
};

const CHECKLIST_GENERICO: ChecklistItem[] = [
  { id: "g1", texto: "Recolher lixo do ambiente" },
  { id: "g2", texto: "Higienizar superfícies principais" },
  { id: "g3", texto: "Passar solução adequada no piso" },
  { id: "g4", texto: "Repor materiais necessários" },
];

export function getChecklist(ambiente: string): ChecklistItem[] {
  return CHECKLIST_POR_AMBIENTE[ambiente] ?? CHECKLIST_GENERICO;
}

// Tempo mínimo padrão por ambiente (em segundos). Editável no futuro pelo admin.
const TEMPO_MINIMO_SEG: Record<string, number> = {
  banheiros: 300,
  salas: 480,
  refeitorio: 300,
  consultorios: 360,
  recepcao: 240,
  cozinha: 420,
  fraldario: 360,
  dormitorios: 360,
  enfermaria: 300,
  patio: 600,
  cozinha_industrial: 600,
};

export function getTempoMinimoSeg(ambiente: string, local?: LocalAmbiente | null): number {
  if (local?.tempoMinimoSeg && local.tempoMinimoSeg > 0) return local.tempoMinimoSeg;
  return TEMPO_MINIMO_SEG[ambiente] ?? 240;
}

// Frequência esperada de higienização por dia (padrão por ambiente).
const FREQUENCIA_ESPERADA: Record<string, number> = {
  banheiros: 3,
  salas: 2,
  refeitorio: 3,
  consultorios: 2,
  recepcao: 2,
  cozinha: 3,
  fraldario: 4,
  dormitorios: 2,
  enfermaria: 2,
};

export function getFrequenciaEsperada(ambiente: string, local?: LocalAmbiente | null): number {
  if (local?.frequenciaDia && local.frequenciaDia > 0) return local.frequenciaDia;
  return FREQUENCIA_ESPERADA[ambiente] ?? 1;
}

// Total esperado para a unidade no dia — considera locais individuais quando existirem.
export function getTotalEsperadoUnit(unit: Unit): number {
  if (unit.locais && unit.locais.length) {
    return unit.locais.reduce((s, l) => s + getFrequenciaEsperada(l.tipo, l), 0);
  }
  return (unit.ambientes ?? []).reduce((s, a) => s + getFrequenciaEsperada(a), 0);
}

// Formata segundos em "MM:SS".
export function formatDuracao(seg: number): string {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Converte arquivo (input file) em dataURL para persistir em localStorage.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    r.readAsDataURL(file);
  });
}

// Índice de biossegurança (0–100) por unidade — considera cumprimento do dia,
// reprovações, registros fora da área e incidentes recentes.
export type UnitScore = {
  score: number;
  hoje: number;
  esperado: number;
  cumprimento: number; // 0-100
  reprovadas: number;
  foraArea: number;
  incidentes24h: number;
};

export function computeUnitScore(unitId: string): UnitScore {
  const unit = getUnitById(unitId);
  if (!unit) {
    return { score: 0, hoje: 0, esperado: 0, cumprimento: 0, reprovadas: 0, foraArea: 0, incidentes24h: 0 };
  }
  const hojeArr = getCleaningsToday(unitId).filter((c) => c.status !== "reprovada");
  const esperado = Math.max(1, getTotalEsperadoUnit(unit));
  const cumprimento = Math.min(100, Math.round((hojeArr.length / esperado) * 100));

  const todasHoje = getCleaningsToday(unitId);
  const reprovadas = todasHoje.filter((c) => c.status === "reprovada").length;
  const foraArea = todasHoje.filter((c) => c.foraDaArea).length;

  const umDia = 24 * 60 * 60 * 1000;
  const incidentes24h = getIncidentes().filter(
    (i) => i.unitId === unitId && Date.now() - i.timestamp < umDia,
  );
  const penalIncid = incidentes24h.reduce(
    (s, i) => s + (i.tipo === "surto" ? 15 : i.tipo === "doenca" ? 6 : 3),
    0,
  );

  const penalReprov = Math.min(30, reprovadas * 10);
  const penalFora = Math.min(15, foraArea * 5);
  const penalTotal = Math.min(50, penalReprov + penalFora + Math.min(25, penalIncid));

  const score = Math.max(0, Math.min(100, cumprimento - penalTotal));
  return {
    score,
    hoje: hojeArr.length,
    esperado,
    cumprimento,
    reprovadas,
    foraArea,
    incidentes24h: incidentes24h.length,
  };
}

export type RankingRow = { unit: Unit; score: UnitScore };

export function getRanking(prefeituraId?: string): RankingRow[] {
  const filtered = getUnits().filter((u) => !prefeituraId || u.prefeituraId === prefeituraId);
  return filtered
    .map((u) => ({ unit: u, score: computeUnitScore(u.id) }))
    .sort((a, b) => b.score.score - a.score.score);
}

// Revisão de limpezas (aprovar/reprovar pelo gestor).
export function reviewCleaning(
  id: string,
  status: "aprovada" | "reprovada",
  motivo?: string,
  revisor = "ADM Master",
) {
  const list = getCleanings().map((c) =>
    c.id === id
      ? {
          ...c,
          status,
          motivoReprovacao: status === "reprovada" ? motivo ?? "Sem motivo informado" : undefined,
          revisadoPor: revisor,
          revisadoEm: Date.now(),
        }
      : c,
  );
  write(CLEANINGS_KEY, list);
}

// Todas as limpezas reprovadas AINDA não refeitas para uma unidade.
export function getReprovadasPendentes(unitId: string): Cleaning[] {
  const all = getCleanings().filter((c) => c.unitId === unitId);
  const refeitosDe = new Set(all.map((c) => c.refazDe).filter(Boolean) as string[]);
  return all.filter((c) => c.status === "reprovada" && !refeitosDe.has(c.id));
}

// Histórico completo por local (ordem decrescente).
export function getCleaningsByLocal(localId: string): Cleaning[] {
  return getCleanings()
    .filter((c) => c.localId === localId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

// Portal público — slug amigável a partir de "Nome/UF".
export function prefeituraSlug(p: Prefeitura): string {
  return `${p.nome}-${p.uf}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPrefeituraBySlug(slug: string): Prefeitura | null {
  return getPrefeituras().find((p) => prefeituraSlug(p) === slug) ?? null;
}

// Hook reativo para o score da unidade.
export function useUnitScore(unitId: string | null | undefined): UnitScore | null {
  const cleanings = useCleanings();
  const incid = useIncidentes();
  void cleanings;
  void incid;
  if (!unitId) return null;
  return computeUnitScore(unitId);
}

// --- Prefeituras API ---
export function getPrefeituras(): Prefeitura[] {
  ensureSeed();
  return read<Prefeitura[]>(PREFEITURAS_KEY, SEED_PREFEITURAS);
}

export function getPrefeituraById(id: string | null | undefined): Prefeitura | null {
  if (!id) return null;
  return getPrefeituras().find((p) => p.id === id) ?? null;
}

export function savePrefeitura(p: Omit<Prefeitura, "id"> & { id?: string }): Prefeitura {
  const list = getPrefeituras();
  if (p.id) {
    if (list.some((x) => x.id === p.id)) {
      const next = list.map((x) => (x.id === p.id ? ({ ...x, ...p } as Prefeitura) : x));
      write(PREFEITURAS_KEY, next);
      return next.find((x) => x.id === p.id)!;
    }
    const inserted = { ...p, id: p.id } as Prefeitura;
    write(PREFEITURAS_KEY, [...list, inserted]);
    return inserted;
  }
  const created: Prefeitura = { ...p, id: `pref-${Date.now()}` };
  write(PREFEITURAS_KEY, [...list, created]);
  return created;
}


export function deletePrefeitura(id: string) {
  const hasUnits = getUnits().some((u) => u.prefeituraId === id);
  if (hasUnits) {
    throw new Error("Não é possível excluir uma prefeitura que possui unidades cadastradas.");
  }
  write(PREFEITURAS_KEY, getPrefeituras().filter((p) => p.id !== id));
}

// --- Units API ---
export function getUnits(): Unit[] {
  ensureSeed();
  return read<Unit[]>(UNITS_KEY, SEED_UNITS);
}

export function getUnitById(id: string | null | undefined): Unit | null {
  if (!id) return null;
  return getUnits().find((u) => u.id === id) ?? null;
}

export function getUnitByPin(pin: string): Unit | null {
  return getUnits().find((u) => u.pin === pin) ?? null;
}

export function saveUnit(unit: Omit<Unit, "id"> & { id?: string }): Unit {
  const list = getUnits();
  if (unit.id) {
    if (list.some((u) => u.id === unit.id)) {
      const next = list.map((u) => (u.id === unit.id ? ({ ...u, ...unit } as Unit) : u));
      write(UNITS_KEY, next);
      return next.find((u) => u.id === unit.id)!;
    }
    const inserted = { ...unit, id: unit.id } as Unit;
    write(UNITS_KEY, [...list, inserted]);
    return inserted;
  }
  const created: Unit = { ...unit, id: `un-${Date.now()}` };
  write(UNITS_KEY, [...list, created]);
  return created;
}


export function deleteUnit(id: string) {
  write(UNITS_KEY, getUnits().filter((u) => u.id !== id));
  write(CLEANINGS_KEY, getCleanings().filter((c) => c.unitId !== id));
}

// --- Cleanings API ---
export function getCleanings(): Cleaning[] {
  ensureSeed();
  return read<Cleaning[]>(CLEANINGS_KEY, SEED_CLEANINGS);
}

export function addCleaning(
  input: Omit<Cleaning, "id" | "timestamp" | "prefeituraId"> & { timestamp?: number },
): Cleaning {
  const unit = getUnitById(input.unitId);
  const created: Cleaning = {
    id: `cl-${Date.now()}`,
    timestamp: input.timestamp ?? Date.now(),
    unitId: input.unitId,
    prefeituraId: unit?.prefeituraId ?? "",
    ambiente: input.ambiente,
    localId: input.localId,
    servente: input.servente,
    lat: input.lat,
    lng: input.lng,
    distanciaMetros: input.distanciaMetros,
    foraDaArea: input.foraDaArea,
    fotoAntes: input.fotoAntes,
    fotoDepois: input.fotoDepois,
    duracaoSeg: input.duracaoSeg,
    itensFeitos: input.itensFeitos,
    status: input.status ?? "pendente",
    refazDe: input.refazDe,
    qrValidado: input.qrValidado,
    pinOperadora: input.pinOperadora,
    pinNome: input.pinNome ?? getPinAtual()?.nome,
    colaboradoraId: input.colaboradoraId,
    colaboradoraNome: input.colaboradoraNome,
    nfcValidado: input.nfcValidado,
    tipoLimpeza: input.tipoLimpeza,
    corKit: input.corKit,
    alergenosZona: input.alergenosZona,
    alertaAlergeno: input.alertaAlergeno,
    dwellCanceladoSeg: input.dwellCanceladoSeg,
    ncId: input.ncId,
  };
  write(CLEANINGS_KEY, [...getCleanings(), created]);
  return created;
}

export function getCleaningsToday(unitId?: string): Cleaning[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startMs = start.getTime();
  return getCleanings().filter(
    (c) => c.timestamp >= startMs && (!unitId || c.unitId === unitId),
  );
}

// --- Current session ---
const PIN_ATUAL_KEY = "oxyvra:v3:pinAtual";

export type PinAtual = { nome: string; papel: "operador" | "supervisor" };

export function setPinAtual(pin: PinAtual | null) {
  if (!isBrowser()) return;
  if (pin) window.localStorage.setItem(PIN_ATUAL_KEY, JSON.stringify(pin));
  else window.localStorage.removeItem(PIN_ATUAL_KEY);
  emit();
}

export function getPinAtual(): PinAtual | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PIN_ATUAL_KEY);
    return raw ? (JSON.parse(raw) as PinAtual) : null;
  } catch {
    return null;
  }
}

export function usePinAtual(): PinAtual | null {
  useHydrated();
  void useUnits(); // reativa a mudanças no store
  return getPinAtual();
}

export function setCurrentUnit(id: string | null) {
  if (!isBrowser()) return;
  if (id) window.localStorage.setItem(CURRENT_KEY, id);
  else {
    window.localStorage.removeItem(CURRENT_KEY);
    window.localStorage.removeItem(PIN_ATUAL_KEY);
  }
  window.sessionStorage.removeItem(CURRENT_KEY);
  emit();
}

export function getCurrentUnitId(): string | null {
  if (!isBrowser()) return null;
  // Sessão persistente: sobrevive a recarregar/reabrir o app (revisores das lojas).
  const legado = window.sessionStorage.getItem(CURRENT_KEY);
  if (legado && !window.localStorage.getItem(CURRENT_KEY)) {
    window.localStorage.setItem(CURRENT_KEY, legado);
  }
  return window.localStorage.getItem(CURRENT_KEY);
}

/** true somente após a hidratação no navegador (evita redirecionar no SSR). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// --- Hooks ---
export function usePrefeituras(): Prefeitura[] {
  return useSyncExternalStore(
    subscribe,
    () => getPrefeituras(),
    () => SEED_PREFEITURAS,
  );
}

export function useUnits(): Unit[] {
  return useSyncExternalStore(
    subscribe,
    () => getUnits(),
    () => SEED_UNITS,
  );
}

export function useCleanings(): Cleaning[] {
  return useSyncExternalStore(
    subscribe,
    () => getCleanings(),
    () => SEED_CLEANINGS,
  );
}

export function useCurrentUnit(): Unit | null {
  const id = useSyncExternalStore(
    subscribe,
    () => getCurrentUnitId(),
    () => null,
  );
  const units = useUnits();
  return units.find((u) => u.id === id) ?? null;
}

// --- Incidentes API ---
export function getIncidentes(): Incidente[] {
  ensureSeed();
  return read<Incidente[]>(INCIDENTES_KEY, []);
}

export function addIncidente(
  input: Omit<Incidente, "id" | "timestamp" | "prefeituraId"> & { timestamp?: number },
): Incidente {
  const unit = getUnitById(input.unitId);
  const created: Incidente = {
    id: `in-${Date.now()}`,
    timestamp: input.timestamp ?? Date.now(),
    unitId: input.unitId,
    prefeituraId: unit?.prefeituraId ?? "",
    tipo: input.tipo,
    quantidade: input.quantidade,
    descricao: input.descricao,
    reportadoPor: input.reportadoPor,
    lat: input.lat,
    lng: input.lng,
  };
  write(INCIDENTES_KEY, [...getIncidentes(), created]);
  return created;
}

export function deleteIncidente(id: string) {
  write(INCIDENTES_KEY, getIncidentes().filter((i) => i.id !== id));
}

export function useIncidentes(): Incidente[] {
  return useSyncExternalStore(
    subscribe,
    () => getIncidentes(),
    () => [],
  );
}

// --- Admin PIN ---
export function getAdminPin(): string {
  if (!isBrowser()) return DEFAULT_ADMIN_PIN;
  return window.localStorage.getItem(ADMIN_PIN_KEY) ?? DEFAULT_ADMIN_PIN;
}

export function setAdminPin(pin: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(ADMIN_PIN_KEY, pin);
  emit();
}

export function isAdminAuthed(): boolean {
  if (!isBrowser()) return false;
  return window.sessionStorage.getItem(ADMIN_AUTHED_KEY) === "1";
}

export function setAdminAuthed(v: boolean) {
  if (!isBrowser()) return;
  if (v) window.sessionStorage.setItem(ADMIN_AUTHED_KEY, "1");
  else window.sessionStorage.removeItem(ADMIN_AUTHED_KEY);
  emit();
}

export function useAdminAuthed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isAdminAuthed(),
    () => false,
  );
}

// --- Pagamentos API ---
export function getPagamentos(): Pagamento[] {
  ensureSeed();
  return read<Pagamento[]>(PAGAMENTOS_KEY, []);
}

export function savePagamento(p: Omit<Pagamento, "id"> & { id?: string }): Pagamento {
  const list = getPagamentos();
  if (p.id) {
    const next = list.map((x) => (x.id === p.id ? ({ ...x, ...p } as Pagamento) : x));
    write(PAGAMENTOS_KEY, next);
    return next.find((x) => x.id === p.id)!;
  }
  const created: Pagamento = { ...p, id: `pg-${Date.now()}` };
  write(PAGAMENTOS_KEY, [...list, created]);
  return created;
}

export function deletePagamento(id: string) {
  write(PAGAMENTOS_KEY, getPagamentos().filter((x) => x.id !== id));
}

export function usePagamentos(): Pagamento[] {
  return useSyncExternalStore(subscribe, () => getPagamentos(), () => []);
}

// --- Despesas API ---
export function getDespesas(): Despesa[] {
  ensureSeed();
  return read<Despesa[]>(DESPESAS_KEY, []);
}

export function saveDespesa(d: Omit<Despesa, "id"> & { id?: string }): Despesa {
  const list = getDespesas();
  if (d.id) {
    const next = list.map((x) => (x.id === d.id ? ({ ...x, ...d } as Despesa) : x));
    write(DESPESAS_KEY, next);
    return next.find((x) => x.id === d.id)!;
  }
  const created: Despesa = { ...d, id: `dp-${Date.now()}` };
  write(DESPESAS_KEY, [...list, created]);
  return created;
}

export function deleteDespesa(id: string) {
  write(DESPESAS_KEY, getDespesas().filter((x) => x.id !== id));
}

export function useDespesas(): Despesa[] {
  return useSyncExternalStore(subscribe, () => getDespesas(), () => []);
}

// ============================================================
// Onda 2 — APIs: Colaboradoras, Presenças, Atrasos
// ============================================================

export type Atraso = {
  local: LocalAmbiente;
  esperado: number;
  feito: number;
  faltando: number;
  ultimaLimpezaMs?: number;
  horasSemLimpeza: number;
};

export function getAtrasos(unitId: string): Atraso[] {
  const unit = getUnitById(unitId);
  if (!unit || !unit.locais || !unit.locais.length) return [];
  const doDia = getCleaningsToday(unitId).filter((c) => c.status !== "reprovada");
  const agora = Date.now();
  const inicioDia = new Date().setHours(0, 0, 0, 0);
  const atrasos: Atraso[] = [];
  for (const local of unit.locais) {
    const esperado = getFrequenciaEsperada(local.tipo, local);
    const feitas = doDia.filter((c) => c.localId === local.id);
    const feito = feitas.length;
    if (feito >= esperado) continue;
    const janelaHoras = 24 / esperado;
    const ultima = [...feitas].sort((a, b) => b.timestamp - a.timestamp)[0];
    const refMs = ultima?.timestamp ?? inicioDia;
    const horasSem = (agora - refMs) / 3_600_000;
    if (horasSem >= janelaHoras) {
      atrasos.push({
        local,
        esperado,
        feito,
        faltando: esperado - feito,
        ultimaLimpezaMs: ultima?.timestamp,
        horasSemLimpeza: horasSem,
      });
    }
  }
  return atrasos.sort((a, b) => b.horasSemLimpeza - a.horasSemLimpeza);
}

export function getColaboradoras(): Colaboradora[] {
  ensureSeed();
  return read<Colaboradora[]>(COLABORADORAS_KEY, []);
}

export function getColaboradorasByUnit(unitId: string): Colaboradora[] {
  return getColaboradoras().filter((c) => c.unitId === unitId);
}

export function saveColaboradora(c: Omit<Colaboradora, "id"> & { id?: string }): Colaboradora {
  const list = getColaboradoras();
  if (c.id) {
    const next = list.map((x) => (x.id === c.id ? ({ ...x, ...c } as Colaboradora) : x));
    write(COLABORADORAS_KEY, next);
    return next.find((x) => x.id === c.id)!;
  }
  const created: Colaboradora = { ...c, id: `col-${Date.now()}` };
  write(COLABORADORAS_KEY, [...list, created]);
  return created;
}

export function deleteColaboradora(id: string) {
  write(COLABORADORAS_KEY, getColaboradoras().filter((x) => x.id !== id));
}

export function useColaboradoras(): Colaboradora[] {
  return useSyncExternalStore(subscribe, () => getColaboradoras(), () => []);
}

export function getPresencas(): Presenca[] {
  ensureSeed();
  return read<Presenca[]>(PRESENCAS_KEY, []);
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function togglePresenca(colaboradoraId: string, unitId: string, turno: Turno): Presenca {
  const data = todayIso();
  const list = getPresencas();
  const existente = list.find(
    (p) => p.colaboradoraId === colaboradoraId && p.data === data && p.turno === turno,
  );
  const agora = Date.now();
  if (!existente) {
    const created: Presenca = { id: `pr-${agora}`, colaboradoraId, unitId, data, turno, checkin: agora };
    write(PRESENCAS_KEY, [...list, created]);
    return created;
  }
  if (existente.checkin && !existente.checkout) {
    const updated = { ...existente, checkout: agora };
    write(PRESENCAS_KEY, list.map((p) => (p.id === existente.id ? updated : p)));
    return updated;
  }
  // ciclo completo → registra novo checkin
  const created: Presenca = { id: `pr-${agora}`, colaboradoraId, unitId, data, turno, checkin: agora };
  write(PRESENCAS_KEY, [...list, created]);
  return created;
}

export function deletePresenca(id: string) {
  write(PRESENCAS_KEY, getPresencas().filter((p) => p.id !== id));
}

export function usePresencas(): Presenca[] {
  return useSyncExternalStore(subscribe, () => getPresencas(), () => []);
}

export function getPresencasDoDia(unitId?: string, data = todayIso()): Presenca[] {
  return getPresencas().filter((p) => p.data === data && (!unitId || p.unitId === unitId));
}

// ============================================================
// Onda 3 — Auditoria Anti-Fraude: QR Code + PIN pessoal
// ============================================================

function randomToken(): string {
  const bytes = new Uint8Array(9);
  if (isBrowser() && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}

/** Retorna o qrToken do local, gerando e persistindo se ainda não existir. */
export function ensureLocalQrToken(unitId: string, localId: string): string {
  const units = getUnits();
  const unit = units.find((u) => u.id === unitId);
  if (!unit) return "";
  const local = (unit.locais ?? []).find((l) => l.id === localId);
  if (!local) return "";
  if (local.qrToken) return local.qrToken;
  const token = randomToken();
  const nextLocais = (unit.locais ?? []).map((l) =>
    l.id === localId ? { ...l, qrToken: token } : l,
  );
  const nextUnits = units.map((u) => (u.id === unitId ? { ...u, locais: nextLocais } : u));
  write(UNITS_KEY, nextUnits);
  return token;
}

/** Formato do payload do QR: OXV:<unitId>:<qrToken> */
export function buildQrPayload(unitId: string, qrToken: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/q/${unitId}/${qrToken}`;
}

export function parseQrPayload(raw: string): { unitId: string; token: string } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Formato novo (URL): https://.../q/<unitId>/<token>
  const url = trimmed.match(/\/q\/([^/\s?#]+)\/([^/\s?#]+)/);
  if (url) return { unitId: url[1], token: url[2] };
  const parts = trimmed.split(":");
  if (parts.length < 3 || parts[0] !== "OXV") return null;
  return { unitId: parts[1], token: parts.slice(2).join(":") };
}

/** Localiza o local pela leitura do QR dentro de uma unidade. */
export function findLocalByQr(unitId: string, raw: string): LocalAmbiente | null {
  const parsed = parseQrPayload(raw);
  if (!parsed || parsed.unitId !== unitId) return null;
  const unit = getUnitById(unitId);
  return (unit?.locais ?? []).find((l) => l.qrToken === parsed.token) ?? null;
}

/** Verifica o PIN pessoal de uma colaboradora da unidade. */
export function verificarPinColaboradora(
  unitId: string,
  pin: string,
): Colaboradora | null {
  if (!pin) return null;
  return (
    getColaboradorasByUnit(unitId).find(
      (c) => c.ativo && !!c.pin && c.pin === pin,
    ) ?? null
  );
}
