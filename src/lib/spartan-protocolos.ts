// Protocolos Spartan: vínculo automático entre local/rotina, produto obrigatório,
// cor do kit e trava de tempo de contato (dwell time).
import type { CorLimpeza, LocalAmbiente } from "@/lib/oxyvra-store";

export type ProdutoSpartan = {
  id: string;
  nome: string;
  categoria: string;
  diluicaoLabel: string;
  diluicaoRatio: number; // 1:X (0 = pronto uso)
  dwellSegundos: number;
  corKit: CorLimpeza;
  precoPorLitro: number;
  taxaAplicacaoLM2: number;
};

export const PRODUTOS_SPARTAN: Record<string, ProdutoSpartan> = {
  peroxy_4d: {
    id: "peroxy_4d",
    nome: "Peroxy 4D",
    categoria: "Desinfetante Hospitalar / Superfícies Críticas",
    diluicaoLabel: "1:40 (Desinfecção) / 1:100 (Limpeza)",
    diluicaoRatio: 40,
    dwellSegundos: 600,
    corKit: "azul",
    precoPorLitro: 35,
    taxaAplicacaoLM2: 0.05,
  },
  clean_by_peroxy: {
    id: "clean_by_peroxy",
    nome: "Clean by Peroxy",
    categoria: "Limpador Multiuso e Desinfetante Geral",
    diluicaoLabel: "1:40 (Geral) / 1:100 (Manutenção)",
    diluicaoRatio: 40,
    dwellSegundos: 300,
    corKit: "verde",
    precoPorLitro: 22,
    taxaAplicacaoLM2: 0.05,
  },
  sparzyme: {
    id: "sparzyme",
    nome: "Sparzyme",
    categoria: "Detergente Enzimático (Remoção de Matéria Orgânica)",
    diluicaoLabel: "1:200 (Imersão de Instrumentos)",
    diluicaoRatio: 200,
    dwellSegundos: 300,
    corKit: "amarelo",
    precoPorLitro: 48,
    taxaAplicacaoLM2: 0.05,
  },
  cloroclean: {
    id: "cloroclean",
    nome: "Cloroclean",
    categoria: "Detergente Alcalino Clorado / Alvejante",
    diluicaoLabel: "1:20 (Pesada) / 1:50 (Sanitização)",
    diluicaoRatio: 20,
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPorLitro: 28,
    taxaAplicacaoLM2: 0.06,
  },
  ic_115: {
    id: "ic_115",
    nome: "IC-115 / Grill Cleaner",
    categoria: "Desengordurante Alcalino Pesado",
    diluicaoLabel: "Puro a 1:10 (Coifas, Chapas e Exaustores)",
    diluicaoRatio: 10,
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPorLitro: 32,
    taxaAplicacaoLM2: 0.08,
  },
  xpress_t4: {
    id: "xpress_t4",
    nome: "Xpress Antisseptical T-4",
    categoria: "Sabonete Antisséptico para Mãos",
    diluicaoLabel: "Pronto Uso",
    diluicaoRatio: 0,
    dwellSegundos: 30,
    corKit: "branco",
    precoPorLitro: 18,
    taxaAplicacaoLM2: 0,
  },
};

export type ProtocoloSpartan = {
  produto: ProdutoSpartan;
  corKitExigida: CorLimpeza;
  dwellSegundos: number;
  instrucao: string;
};

type Regra = {
  produtoId: keyof typeof PRODUTOS_SPARTAN;
  corKit?: CorLimpeza;
  dwellSegundos?: number;
  instrucao: string;
  /** Palavras-chave no tipo/nome do local */
  termos: string[];
};

// Ordem importa: a primeira regra correspondente vence.
const REGRAS: Regra[] = [
  // ---- Rede pública municipal: travas químicas por equipamento ----
  // Salas sensoriais / TEA: exclusivamente produto sem fragrância e hipoalergênico.
  {
    produtoId: "clean_by_peroxy",
    corKit: "azul",
    dwellSegundos: 300,
    instrucao:
      "Sala sensorial / TEA: usar SOMENTE Clean by Peroxy (sem fragrância, hipoalergênico e biodegradável). Proibido produto perfumado ou clorado. 5 min de contato, secagem completa e 10 min de ventilação antes de liberar o atendimento.",
    termos: [
      "sensorial",
      "integracao sensorial",
      "integração sensorial",
      "tea",
      "autis",
      "piscina de bolinha",
      "bolinha",
      "balanco",
      "balanço",
      "estimulo tatil",
      "estímulo tátil",
    ],
  },
  {
    produtoId: "cloroclean",
    corKit: "vermelho",
    dwellSegundos: 600,
    instrucao:
      "Merenda escolar (FNDE / RDC 216): Cloroclean 1:50 em pisos, bancadas e área de carnes. Enxaguar com água potável antes de retomar a produção.",
    termos: ["merenda", "cozinha escolar", "cozinha publica", "cozinha pública", "despensa merenda"],
  },
  {
    produtoId: "sparzyme",
    corKit: "amarelo",
    dwellSegundos: 300,
    instrucao:
      "CME odontológico público (RDC 15): imersão do instrumental em Sparzyme 1:200 por 5 min, enxágue, secagem e embalagem com indicador químico antes da autoclave.",
    termos: ["cme odonto", "expurgo odonto", "instrumental odonto", "esterilizacao odonto"],
  },
  {
    produtoId: "peroxy_4d",
    corKit: "amarelo",
    dwellSegundos: 600,
    instrucao:
      "Cadeira odontológica e sugadores: desinfetar com Peroxy 4D 1:40 entre cada paciente, 10 min de contato (RDC 15/2012).",
    termos: ["cadeira odonto", "sugador", "consultorio odonto", "saude bucal", "saúde bucal"],
  },
  {
    produtoId: "peroxy_4d",
    corKit: "vermelho",
    dwellSegundos: 600,
    instrucao:
      "CAPS / residência terapêutica: desinfecção de dormitórios, banheiros coletivos e oficinas com Peroxy 4D, 10 min de contato.",
    termos: ["caps", "residencia terapeutica", "residência terapêutica", "oficina terapeutica", "acolhimento"],
  },
  // ---- Academias e centros esportivos ----
  {
    produtoId: "peroxy_4d",
    corKit: "vermelho",
    dwellSegundos: 300,
    instrucao:
      "Vestiários, chuveiros, saunas e pisos úmidos da academia: Peroxy 4D com Kit Vermelho e 5 min de tempo de contato antes de liberar o ambiente.",
    termos: [
      "vestiario academia",
      "vestiário academia",
      "chuveiro",
      "sauna",
      "piso umido",
      "piso úmido",
      "area molhada",
      "área molhada",
      "lava-pes",
      "lava pés",
      "borda de piscina",
    ],
  },
  {
    produtoId: "clean_by_peroxy",
    corKit: "azul",
    dwellSegundos: 300,
    instrucao:
      "Equipamentos de academia (estofados, halteres, esteiras, bikes e colchonetes): SOMENTE Clean by Peroxy com Kit Azul — produto neutro que não resseca couro nem vinil. Proibido clorado. 5 min de contato.",
    termos: [
      "musculacao",
      "musculação",
      "ergometria",
      "estofado",
      "halter",
      "anilha",
      "esteira",
      "bike",
      "spinning",
      "eliptico",
      "elíptico",
      "colchonete",
      "tatame",
      "pilates",
      "cross",
      "funcional",
      "luta",
      "danca",
      "dança",
      "academia",
      "sala de peso",
    ],
  },
  // Linha infantil (berçários, creches e educação infantil): produtos peroxidados
  // obrigatórios e trava de 3 a 5 min antes do enxágue/liberação.
  {
    produtoId: "clean_by_peroxy",
    corKit: "azul",
    dwellSegundos: 180,
    instrucao:
      "Trocador de fraldas: desinfetar a superfície com Clean by Peroxy a cada troca, aguardar 3 min de ação, enxaguar e secar antes do próximo bebê.",
    termos: ["trocador", "fraldario", "fraldário", "troca de fralda"],
  },
  {
    produtoId: "clean_by_peroxy",
    corKit: "verde",
    dwellSegundos: 300,
    instrucao:
      "Brinquedos e mordedores: imersão/aplicação de Clean by Peroxy por 5 min, enxágue abundante em água potável e secagem completa antes de voltar ao uso (ABNT NBR 14318).",
    termos: ["brinquedo", "mordedor", "brinquedoteca", "parquinho", "tatame"],
  },
  {
    produtoId: "peroxy_4d",
    corKit: "azul",
    dwellSegundos: 300,
    instrucao:
      "Berços, colchonetes e berçário: desinfecção com Peroxy 4D, 5 min de tempo de contato, enxágue e secagem antes de receber o bebê.",
    termos: ["berco", "berço", "bercario", "berçário", "colchonete", "sala do soninho", "repouso"],
  },
  {
    produtoId: "clean_by_peroxy",
    corKit: "verde",
    dwellSegundos: 300,
    instrucao:
      "Lactário: higienizar bancadas, mamadeiras e utensílios com Clean by Peroxy, 5 min de contato e enxágue em água potável.",
    termos: ["lactario", "lactário", "mamadeira", "leite materno"],
  },
  {
    produtoId: "sparzyme",
    instrucao:
      "CME / instrumentais: imersão mínima de 5 min em solução enzimática antes da secagem e autoclavagem.",
    termos: ["cme", "instrument", "esteriliz", "autoclave", "expurgo"],
  },
  {
    produtoId: "xpress_t4",
    instrucao:
      "Lavatório / barreira sanitária: sabonete antisséptico pronto uso, 30 s de fricção nas mãos.",
    termos: ["lavatorio", "lavatório", "lava_maos", "lava mãos", "barreira_sanitaria", "barreira sanit", "pia de higien"],
  },
  {
    produtoId: "ic_115",
    instrucao:
      "Cozinha quente: aplicar desengordurante em coifas, chapas, fogões e exaustores. Kit vermelho obrigatório.",
    termos: ["coifa", "chapa", "exaust", "fogao", "fogão", "grill", "cozinha quente", "fritadeira"],
  },
  {
    produtoId: "cloroclean",
    instrucao:
      "Hidromassagem / jacuzzi / sauna: recirculação do desinfetante por 10 min para eliminar biofilme das tubulações.",
    termos: ["hidro", "jacuzzi", "sauna", "piscina", "ofuro"],
  },
  {
    produtoId: "cloroclean",
    instrucao:
      "Área de manipulação: desinfecção de tábuas, moedores e bancadas por 10 min de contato.",
    termos: ["acougue", "açougue", "corte", "manipulacao", "manipulação", "esteira_producao", "camara_fria", "padaria", "peixaria"],
  },
  {
    produtoId: "peroxy_4d",
    corKit: "amarelo",
    instrucao:
      "Sala de atendimento: desinfecção de macas, cadeiras e bancadas entre pacientes, 10 min de contato.",
    termos: ["consultorio", "consultório", "cabine", "atendimento", "enfermaria", "odonto", "clinic", "procedimento"],
  },
  {
    produtoId: "peroxy_4d",
    corKit: "vermelho",
    instrucao:
      "Sanitários e superfícies de alto contato: desinfecção com 10 min de tempo de contato. Kit vermelho.",
    termos: ["banheiro", "sanit", "vestiario", "vestiário", "wc", "toalete"],
  },
  {
    produtoId: "clean_by_peroxy",
    corKit: "verde",
    instrucao: "Cozinha e refeitório: limpeza de superfícies leves e pisos com 5 min de contato.",
    termos: ["cozinha", "refeitorio", "refeitório", "buffet", "copa"],
  },
  {
    produtoId: "clean_by_peroxy",
    corKit: "azul",
    instrucao:
      "Quartos, suítes e áreas comuns: limpeza de pisos, vidros e mobiliário com 5 min de contato.",
    termos: [
      "quarto",
      "suite",
      "suíte",
      "dormitorio",
      "sala",
      "recepcao",
      "recepção",
      "corredor",
      "patio",
      "pátio",
      "biblioteca",
      "secretaria",
      "brinquedoteca",
      "fraldario",
      "fraldário",
      "area comum",
    ],
  },
];

function normalizar(v: string) {
  return v.toLowerCase().trim();
}

/** Resolve o protocolo Spartan obrigatório para um local (por tipo/nome do ambiente). */
export function protocoloDoLocal(local: {
  tipo?: string;
  nome?: string;
} | null | undefined): ProtocoloSpartan | null {
  if (!local) return null;
  const alvo = `${normalizar(local.tipo ?? "")} ${normalizar(local.nome ?? "")}`;
  const regra = REGRAS.find((r) => r.termos.some((t) => alvo.includes(normalizar(t))));
  if (!regra) return null;
  const produto = PRODUTOS_SPARTAN[regra.produtoId]!;
  return {
    produto,
    corKitExigida: regra.corKit ?? produto.corKit,
    dwellSegundos: regra.dwellSegundos ?? produto.dwellSegundos,
    instrucao: regra.instrucao,
  };
}

export type DosagemSpartan = {
  litrosSolucao: number;
  litrosConcentrado: number;
  mlConcentrado: number;
  litrosAgua: number;
  custo: number;
  prontoUso: boolean;
};

/** Calculadora: volume de solução, dosagem de concentrado e custo por área. */
export function calcularDosagemSpartan(
  produto: ProdutoSpartan,
  areaM2: number,
  litrosPorM2?: number,
): DosagemSpartan {
  const taxa = litrosPorM2 ?? produto.taxaAplicacaoLM2;
  const litrosSolucao = Math.max(0, areaM2) * taxa;
  const prontoUso = produto.diluicaoRatio <= 0;
  const litrosConcentrado = prontoUso ? litrosSolucao : litrosSolucao / (produto.diluicaoRatio + 1);
  return {
    litrosSolucao,
    litrosConcentrado,
    mlConcentrado: litrosConcentrado * 1000,
    litrosAgua: litrosSolucao - litrosConcentrado,
    custo: litrosConcentrado * produto.precoPorLitro,
    prontoUso,
  };
}

export type ChecagemKit = { bloqueado: boolean; mensagem: string };

/** Trava antifraude: a cor do kit do local precisa bater com a cor exigida pelo protocolo. */
export function validarKitSpartan(
  protocolo: ProtocoloSpartan | null,
  corDoLocal: CorLimpeza | undefined,
  labelCor: (c: CorLimpeza) => string,
): ChecagemKit {
  if (!protocolo || !corDoLocal) return { bloqueado: false, mensagem: "" };
  if (corDoLocal === protocolo.corKitExigida) return { bloqueado: false, mensagem: "" };
  return {
    bloqueado: true,
    mensagem: `Kit Incompatível: Para este local use o Kit ${labelCor(
      protocolo.corKitExigida,
    )} com ${protocolo.produto.nome}`,
  };
}

/** Área do local com fallback conservador para o cálculo. */
export function areaDoLocal(local: LocalAmbiente | null | undefined, padrao = 20): number {
  return local?.areaM2 && local.areaM2 > 0 ? local.areaM2 : padrao;
}
