/**
 * Store local do Aplicativo de Campo — Lares de Idosos (ILPI).
 * Persistência em localStorage (offline-first) com fila de sincronização simples.
 * Independente do módulo odontológico.
 */
import { useEffect, useState } from "react";

const CHAVE = "oxyvra_ilpi_v1";

export type Residente = {
  id: string;
  nome: string;
  quarto: string;
  idade: number;
};

export type CategoriaChecklist =
  | "assistenciais"
  | "biosseguranca"
  | "residuos"
  | "saneantes";

export type ItemChecklist = {
  id: string;
  categoria: CategoriaChecklist;
  texto: string;
  norma?: string;
  feito: boolean;
  feitoEm?: number;
};

export type SinaisVitais = {
  id: string;
  residenteId: string;
  pas?: number;
  pad?: number;
  glicemia?: number;
  peso?: number;
  temperatura?: number;
  observacao?: string;
  quando: number;
  profissional: string;
};

export type Ocorrencia = {
  id: string;
  residenteId?: string;
  texto: string;
  quando: number;
  profissional: string;
};

export type LogAuditoria = {
  id: string;
  acao: string;
  detalhe: string;
  quando: number;
  profissional: string;
  sincronizado: boolean;
};

export type EstadoIlpi = {
  profissional: string;
  turno: string;
  residentes: Residente[];
  checklist: ItemChecklist[];
  sinais: SinaisVitais[];
  ocorrencias: Ocorrencia[];
  logs: LogAuditoria[];
};

export const CATEGORIAS: {
  id: CategoriaChecklist;
  titulo: string;
  descricao: string;
}[] = [
  {
    id: "assistenciais",
    titulo: "Cuidados assistenciais",
    descricao: "Banhos assistidos, roupas de cama e higiene pessoal",
  },
  {
    id: "biosseguranca",
    titulo: "Biossegurança e ambientes",
    descricao: "Desinfecção de quartos, banheiros e áreas comuns",
  },
  {
    id: "residuos",
    titulo: "Gerenciamento de resíduos",
    descricao: "Manejo, acondicionamento e descarte (RDC 222/2018)",
  },
  {
    id: "saneantes",
    titulo: "Controle de saneantes",
    descricao: "Produtos regularizados e diluição segura",
  },
];

function id() {
  return Math.random().toString(36).slice(2, 10);
}

function seed(): EstadoIlpi {
  const residentes: Residente[] = [
    { id: "r1", nome: "Dona Alzira Ramos", quarto: "101", idade: 84 },
    { id: "r2", nome: "Sr. Benedito Farias", quarto: "102", idade: 79 },
    { id: "r3", nome: "Dona Clarice Melo", quarto: "104", idade: 91 },
    { id: "r4", nome: "Sr. Domingos Prado", quarto: "107", idade: 76 },
  ];

  const base: [CategoriaChecklist, string, string | undefined][] = [
    ["assistenciais", "Banho assistido registrado para todos os residentes do turno", "RDC 502/2021"],
    ["assistenciais", "Troca de roupas de cama e banho realizada nos quartos ocupados", "RDC 502/2021"],
    ["assistenciais", "Higiene oral e cuidados pessoais individualizados executados", "RDC 502/2021"],
    ["assistenciais", "Mudança de decúbito dos residentes acamados a cada 2 horas", "RDC 502/2021"],
    ["biosseguranca", "Desinfecção de superfícies de alto toque dos quartos", "RDC 502/2021"],
    ["biosseguranca", "Higienização completa dos banheiros coletivos e individuais", "RDC 502/2021"],
    ["biosseguranca", "Limpeza terminal das áreas comuns (refeitório e convivência)", "RDC 502/2021"],
    ["biosseguranca", "Higienização das mãos e uso correto de EPI pela equipe", "RDC 502/2021"],
    ["residuos", "Fraldas descartáveis acondicionadas em saco branco leitoso identificado", "RDC 222/2018"],
    ["residuos", "Curativos e materiais biológicos segregados como grupo A", "RDC 222/2018"],
    ["residuos", "Perfurocortantes em caixa rígida abaixo da linha de 2/3", "RDC 222/2018"],
    ["residuos", "Abrigo externo de resíduos limpo, trancado e com coleta registrada", "RDC 222/2018"],
    ["saneantes", "Saneantes utilizados possuem registro/notificação ANVISA vigente", "RDC 222/2018"],
    ["saneantes", "Diluição conferida conforme rótulo e tabela de diluição afixada", "RDC 502/2021"],
    ["saneantes", "Frascos rotulados, datados e armazenados fora do alcance dos residentes", "RDC 502/2021"],
  ];

  return {
    profissional: "Enf. Marina Souza — COREN 123.456",
    turno: "Turno manhã (07:00 às 19:00)",
    residentes,
    checklist: base.map(([categoria, texto, norma]) => ({
      id: id(),
      categoria,
      texto,
      norma,
      feito: false,
    })),
    sinais: [],
    ocorrencias: [],
    logs: [],
  };
}

export function carregar(): EstadoIlpi {
  if (typeof window === "undefined") return seed();
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) {
      const s = seed();
      window.localStorage.setItem(CHAVE, JSON.stringify(s));
      return s;
    }
    return { ...seed(), ...(JSON.parse(bruto) as EstadoIlpi) };
  } catch {
    return seed();
  }
}

export function salvar(estado: EstadoIlpi) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify(estado));
  window.dispatchEvent(new CustomEvent("ilpi:mudou"));
}

export function novoLog(
  estado: EstadoIlpi,
  acao: string,
  detalhe: string,
  online: boolean,
): EstadoIlpi {
  const log: LogAuditoria = {
    id: id(),
    acao,
    detalhe,
    quando: Date.now(),
    profissional: estado.profissional,
    sincronizado: online,
  };
  return { ...estado, logs: [log, ...estado.logs] };
}

export function novoId() {
  return id();
}

/** Hook único de estado ILPI, compartilhado entre telas via evento. */
export function useIlpi() {
  const [estado, setEstado] = useState<EstadoIlpi | null>(null);

  useEffect(() => {
    setEstado(carregar());
    const ouvir = () => setEstado(carregar());
    window.addEventListener("ilpi:mudou", ouvir);
    return () => window.removeEventListener("ilpi:mudou", ouvir);
  }, []);

  function atualizar(fn: (e: EstadoIlpi) => EstadoIlpi) {
    setEstado((atual) => {
      const base = atual ?? carregar();
      const proximo = fn(base);
      salvar(proximo);
      return proximo;
    });
  }

  return { estado, atualizar };
}

/** Conectividade do aparelho, com contagem de registros aguardando envio. */
export function useConectividade(pendentes: number) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const set = () => setOnline(window.navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);
  return { online, pendentes };
}

export function formatarHora(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatarDataHora(ts: number) {
  return new Date(ts).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
