// Motor de cálculos e precificação de insumos químicos Spartan (Oxyvra).
// Recebe segmento + ambiente + tamanho + frequência + preço do litro concentrado
// e devolve produto indicado, diluição, dwell time, volumes e custos.
import type { CorLimpeza } from "@/lib/oxyvra-store";

export type SegmentoPrecificacao =
  | "educacional"
  | "saude_odonto"
  | "estetica_beleza"
  | "alimenticio_cozinhas"
  | "hotelaria_pousadas"
  | "moteis"
  | "industria_alimenticia";

export const SEGMENTOS: { id: SegmentoPrecificacao; label: string }[] = [
  { id: "educacional", label: "Educacional (Escolas, Berçários, Creches)" },
  { id: "saude_odonto", label: "Saúde e Odontologia" },
  { id: "estetica_beleza", label: "Estética e Beleza" },
  { id: "alimenticio_cozinhas", label: "Alimentício e Cozinhas" },
  { id: "hotelaria_pousadas", label: "Hotelaria e Pousadas" },
  { id: "moteis", label: "Motéis e Alta Rotatividade" },
  { id: "industria_alimenticia", label: "Indústria Alimentícia e Frigoríficos" },
];

/** Como o "tamanho" é interpretado no cálculo do volume por aplicação. */
export type BaseConsumo =
  | { tipo: "ml_m2"; ml: number; unidadeLabel: "m²" }
  | { tipo: "litros_fixos"; litros: number; unidadeLabel: string }
  | { tipo: "ml_unidade"; ml: number; unidadeLabel: string };

export type PerfilAmbiente = {
  id: string;
  segmento: SegmentoPrecificacao;
  label: string;
  produto: string;
  /** Fator de diluição 1:X. 1 = pronto uso. */
  fatorDiluicao: number;
  diluicaoLabel: string;
  consumo: BaseConsumo;
  dwellSegundos: number;
  corKit: CorLimpeza;
  precoPadraoLitro: number;
};

export const PERFIS_AMBIENTE: PerfilAmbiente[] = [
  // ===== Educacional (escolas, berçários, creches) =====
  {
    id: "edu_sala",
    segmento: "educacional",
    label: "Salas de aula, corredores e áreas comuns",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 8, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "verde",
    precoPadraoLitro: 22,
  },
  {
    id: "edu_banheiro",
    segmento: "educacional",
    label: "Banheiros e sanitários",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 35,
  },
  {
    id: "edu_refeitorio",
    segmento: "educacional",
    label: "Refeitório, copa e cozinha escolar",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "verde",
    precoPadraoLitro: 22,
  },
  {
    id: "edu_trocador",
    segmento: "educacional",
    label: "Trocador de fraldas (berçário/creche)",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 180,
    corKit: "azul",
    precoPadraoLitro: 22,
  },
  {
    id: "edu_brinquedos",
    segmento: "educacional",
    label: "Brinquedos, mordedores e brinquedoteca",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_unidade", ml: 50, unidadeLabel: "item(ns)" },
    dwellSegundos: 300,
    corKit: "verde",
    precoPadraoLitro: 22,
  },
  {
    id: "edu_lactario",
    segmento: "educacional",
    label: "Lactário / preparo de mamadeiras",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "verde",
    precoPadraoLitro: 22,
  },
  {
    id: "edu_lavatorio",
    segmento: "educacional",
    label: "Lavatórios e pias de higienização de mãos",
    produto: "Xpress Antisseptical T-4",
    fatorDiluicao: 1,
    diluicaoLabel: "Pronto uso",
    consumo: { tipo: "ml_unidade", ml: 2, unidadeLabel: "lavagem(ns)" },
    dwellSegundos: 30,
    corKit: "branco",
    precoPadraoLitro: 18,
  },

  // ===== Saúde e Odontologia =====
  {
    id: "saude_consultorio",
    segmento: "saude_odonto",
    label: "Consultórios, salas de atendimento e procedimento",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "amarelo",
    precoPadraoLitro: 35,
  },
  {
    id: "saude_cme",
    segmento: "saude_odonto",
    label: "CME / instrumentais (cuba de imersão)",
    produto: "Sparzyme",
    fatorDiluicao: 200,
    diluicaoLabel: "1:200",
    consumo: { tipo: "litros_fixos", litros: 5, unidadeLabel: "cuba(s)" },
    dwellSegundos: 300,
    corKit: "amarelo",
    precoPadraoLitro: 48,
  },
  {
    id: "saude_banheiro",
    segmento: "saude_odonto",
    label: "Banheiros e sanitários",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 35,
  },
  {
    id: "saude_lavatorio",
    segmento: "saude_odonto",
    label: "Lavatórios e pias (barreira sanitária)",
    produto: "Xpress Antisseptical T-4",
    fatorDiluicao: 1,
    diluicaoLabel: "Pronto uso",
    consumo: { tipo: "ml_unidade", ml: 2, unidadeLabel: "lavagem(ns)" },
    dwellSegundos: 30,
    corKit: "branco",
    precoPadraoLitro: 18,
  },

  // ===== Estética e Beleza =====
  {
    id: "est_sala",
    segmento: "estetica_beleza",
    label: "Salas de procedimento (estética/harmonização)",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "amarelo",
    precoPadraoLitro: 35,
  },
  {
    id: "est_macas",
    segmento: "estetica_beleza",
    label: "Macas, cadeiras e mobiliário entre clientes",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_unidade", ml: 30, unidadeLabel: "item(ns)" },
    dwellSegundos: 600,
    corKit: "amarelo",
    precoPadraoLitro: 35,
  },
  {
    id: "est_instrumentais",
    segmento: "estetica_beleza",
    label: "Instrumentais (imersão enzimática)",
    produto: "Sparzyme",
    fatorDiluicao: 200,
    diluicaoLabel: "1:200",
    consumo: { tipo: "litros_fixos", litros: 3, unidadeLabel: "cuba(s)" },
    dwellSegundos: 300,
    corKit: "amarelo",
    precoPadraoLitro: 48,
  },
  {
    id: "est_banheiro",
    segmento: "estetica_beleza",
    label: "Banheiros e vestiários",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 35,
  },
  {
    id: "est_lavatorio",
    segmento: "estetica_beleza",
    label: "Lavatórios e pias de higienização de mãos",
    produto: "Xpress Antisseptical T-4",
    fatorDiluicao: 1,
    diluicaoLabel: "Pronto uso",
    consumo: { tipo: "ml_unidade", ml: 2, unidadeLabel: "lavagem(ns)" },
    dwellSegundos: 30,
    corKit: "branco",
    precoPadraoLitro: 18,
  },

  // ===== Alimentício e Cozinhas =====
  {
    id: "alim_cozinha_quente",
    segmento: "alimenticio_cozinhas",
    label: "Cozinha quente (chapas, coifas e exaustores)",
    produto: "IC-115 / Grill Cleaner",
    fatorDiluicao: 10,
    diluicaoLabel: "1:10",
    consumo: { tipo: "ml_m2", ml: 20, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 32,
  },
  {
    id: "alim_corte",
    segmento: "alimenticio_cozinhas",
    label: "Açougue / corte / manipulação",
    produto: "Cloroclean",
    fatorDiluicao: 50,
    diluicaoLabel: "1:50",
    consumo: { tipo: "ml_m2", ml: 15, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 28,
  },
  {
    id: "alim_refeitorio",
    segmento: "alimenticio_cozinhas",
    label: "Cozinha, refeitório e bufê (superfícies leves)",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "verde",
    precoPadraoLitro: 22,
  },
  {
    id: "alim_lavatorio",
    segmento: "alimenticio_cozinhas",
    label: "Lavatórios e pias de higienização de mãos",
    produto: "Xpress Antisseptical T-4",
    fatorDiluicao: 1,
    diluicaoLabel: "Pronto uso",
    consumo: { tipo: "ml_unidade", ml: 2, unidadeLabel: "lavagem(ns)" },
    dwellSegundos: 30,
    corKit: "branco",
    precoPadraoLitro: 18,
  },

  // ===== Hotelaria e Pousadas =====
  {
    id: "hot_quartos",
    segmento: "hotelaria_pousadas",
    label: "Quartos, suítes e áreas de passagem",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 8, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "azul",
    precoPadraoLitro: 22,
  },
  {
    id: "hot_banheiros",
    segmento: "hotelaria_pousadas",
    label: "Banheiros e metais",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 35,
  },
  {
    id: "hot_comuns",
    segmento: "hotelaria_pousadas",
    label: "Recepção, corredores e áreas comuns",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 8, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "verde",
    precoPadraoLitro: 22,
  },
  {
    id: "hot_lavatorio",
    segmento: "hotelaria_pousadas",
    label: "Lavatórios e pias (qualquer área)",
    produto: "Xpress Antisseptical T-4",
    fatorDiluicao: 1,
    diluicaoLabel: "Pronto uso",
    consumo: { tipo: "ml_unidade", ml: 2, unidadeLabel: "lavagem(ns)" },
    dwellSegundos: 30,
    corKit: "branco",
    precoPadraoLitro: 18,
  },

  // ===== Motéis e Alta Rotatividade =====
  {
    id: "mot_suite",
    segmento: "moteis",
    label: "Suítes e quartos de alta rotatividade",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "azul",
    precoPadraoLitro: 22,
  },
  {
    id: "mot_hidro",
    segmento: "moteis",
    label: "Hidromassagens / jacuzzis / ofurôs",
    produto: "Cloroclean",
    fatorDiluicao: 50,
    diluicaoLabel: "1:50",
    consumo: { tipo: "litros_fixos", litros: 10, unidadeLabel: "banheira(s)" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 28,
  },
  {
    id: "mot_banheiro",
    segmento: "moteis",
    label: "Banheiros e sanitários das suítes",
    produto: "Peroxy 4D",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 35,
  },
  {
    id: "mot_lavatorio",
    segmento: "moteis",
    label: "Lavatórios e pias de higienização de mãos",
    produto: "Xpress Antisseptical T-4",
    fatorDiluicao: 1,
    diluicaoLabel: "Pronto uso",
    consumo: { tipo: "ml_unidade", ml: 2, unidadeLabel: "lavagem(ns)" },
    dwellSegundos: 30,
    corKit: "branco",
    precoPadraoLitro: 18,
  },

  // ===== Indústria Alimentícia e Frigoríficos =====
  {
    id: "ind_manipulacao",
    segmento: "industria_alimenticia",
    label: "Área de manipulação / corte / esteira",
    produto: "Cloroclean",
    fatorDiluicao: 50,
    diluicaoLabel: "1:50",
    consumo: { tipo: "ml_m2", ml: 15, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 28,
  },
  {
    id: "ind_camara",
    segmento: "industria_alimenticia",
    label: "Câmaras frias e áreas de processo",
    produto: "Cloroclean",
    fatorDiluicao: 20,
    diluicaoLabel: "1:20",
    consumo: { tipo: "ml_m2", ml: 20, unidadeLabel: "m²" },
    dwellSegundos: 600,
    corKit: "vermelho",
    precoPadraoLitro: 28,
  },
  {
    id: "ind_pisos",
    segmento: "industria_alimenticia",
    label: "Pisos, paredes e áreas comuns da planta",
    produto: "Clean by Peroxy",
    fatorDiluicao: 40,
    diluicaoLabel: "1:40",
    consumo: { tipo: "ml_m2", ml: 10, unidadeLabel: "m²" },
    dwellSegundos: 300,
    corKit: "verde",
    precoPadraoLitro: 22,
  },
  {
    id: "ind_lavatorio",
    segmento: "industria_alimenticia",
    label: "Lavatórios e pias de higienização de mãos",
    produto: "Xpress Antisseptical T-4",
    fatorDiluicao: 1,
    diluicaoLabel: "Pronto uso",
    consumo: { tipo: "ml_unidade", ml: 2, unidadeLabel: "lavagem(ns)" },
    dwellSegundos: 30,
    corKit: "branco",
    precoPadraoLitro: 18,
  },
];

export function perfisPorSegmento(segmento: SegmentoPrecificacao) {
  return PERFIS_AMBIENTE.filter((p) => p.segmento === segmento);
}

export function unidadeDoPerfil(perfil: PerfilAmbiente) {
  return perfil.consumo.unidadeLabel;
}

export type EntradaPrecificacao = {
  perfil: PerfilAmbiente;
  nomeAmbiente: string;
  /** m², cubas, banheiras ou lavagens — conforme a base de consumo do perfil. */
  tamanho: number;
  /** aplicações por dia (ou giros por dia). */
  frequenciaDiaria: number;
  diasNoMes: number;
  precoLitroConcentrado: number;
  observacoes?: string;
};

export type ResultadoPrecificacao = {
  volumeSolucaoLitros: number;
  custoLitroPronto: number;
  custoPorAplicacao: number;
  custoMensal: number;
  litrosConcentradoMensal: number;
  aplicacoesMes: number;
  prontoUso: boolean;
};

const r2 = (n: number) => Number(n.toFixed(2));
const r3 = (n: number) => Number(n.toFixed(3));

/** Volume de solução pronta (L) necessário por aplicação. */
export function volumeSolucaoPorAplicacao(perfil: PerfilAmbiente, tamanho: number) {
  const c = perfil.consumo;
  if (c.tipo === "litros_fixos") return c.litros * Math.max(tamanho, 0);
  return (Math.max(tamanho, 0) * c.ml) / 1000;
}

export function calcularPrecificacao(entrada: EntradaPrecificacao): ResultadoPrecificacao {
  const { perfil, tamanho, frequenciaDiaria, diasNoMes, precoLitroConcentrado } = entrada;
  const fd = Math.max(perfil.fatorDiluicao, 1);

  const volumeSolucao = volumeSolucaoPorAplicacao(perfil, tamanho);
  const custoLitroPronto = precoLitroConcentrado / fd;
  const custoPorAplicacao = volumeSolucao * custoLitroPronto;
  const aplicacoesMes = Math.max(frequenciaDiaria, 0) * Math.max(diasNoMes, 0);
  const custoMensal = custoPorAplicacao * aplicacoesMes;
  const litrosConcentradoMensal = (volumeSolucao * aplicacoesMes) / fd;

  return {
    volumeSolucaoLitros: r3(volumeSolucao),
    custoLitroPronto: r2(custoLitroPronto),
    custoPorAplicacao: r2(custoPorAplicacao),
    custoMensal: r2(custoMensal),
    litrosConcentradoMensal: r2(litrosConcentradoMensal),
    aplicacoesMes,
    prontoUso: fd === 1,
  };
}

export function formatarDwell(segundos: number) {
  return segundos < 60 ? `${segundos} seg` : `${Math.round(segundos / 60)} min`;
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
