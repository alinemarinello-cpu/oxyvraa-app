// Copiloto de Conformidade: agenda de tarefas, vencimentos de licenças e avisos.
// Regra de ouro: o profissional não precisa memorizar prazos — o sistema calcula
// o que fazer, como fazer e quando fazer.
import { supabase } from "@/integrations/supabase/client";

/* ---------------------------------- tipos ---------------------------------- */

export type Frequencia = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export const ROTULO_FREQ: Record<Frequencia, string> = {
  DAILY: "Todo dia",
  WEEKLY: "Toda semana",
  MONTHLY: "Todo mês",
  YEARLY: "Todo ano",
};

export type Agendamento = {
  id: string;
  organizacao_id: string;
  task_type: string;
  title: string;
  description: string | null;
  frequency: Frequencia;
  due_date: string;
  weekday: number | null;
  hora: string | null;
  assigned_role: string;
  is_completed: boolean;
  last_completed_at: string | null;
};

export type Licenca = {
  id: string;
  organizacao_id: string;
  document_type: string;
  title: string;
  expiration_date: string;
  alert_lead_days: number[];
  status: "EM_DIA" | "PROXIMO_VENCIMENTO" | "VENCIDO";
  notes: string | null;
};

export type Notificacao = {
  id: string;
  organizacao_id: string;
  channel: "PUSH" | "WHATSAPP" | "EMAIL";
  severity: "INFO" | "ALERTA" | "CRITICO";
  task_type: string | null;
  title: string;
  message: string;
  action_path: string | null;
  sent_at: string;
  read_at: string | null;
};

/* ------------------------- catálogo de tarefas padrão ------------------------- */

export const DIAS_AVISO_PADRAO = [30, 15, 7, 1];

/** Rotina mínima de uma clínica de saúde/estética (RDC 222/2018, RDC 1.002/2025, NR-32). */
export const TAREFAS_PADRAO: {
  task_type: string;
  title: string;
  description: string;
  frequency: Frequencia;
  weekday?: number;
  hora: string;
  assigned_role: string;
}[] = [
  {
    task_type: "CHECKLIST_ABERTURA",
    title: "Checklist de abertura",
    description: "Checagem rápida das estações antes do primeiro atendimento (2 min).",
    frequency: "DAILY",
    hora: "07:30",
    assigned_role: "operador",
  },
  {
    task_type: "LIMPEZA_ENTRE_PACIENTES",
    title: "Limpeza e desinfecção entre atendimentos",
    description: "Trocar barreiras, desinfetar o equipo e cumprir o tempo de contato.",
    frequency: "DAILY",
    hora: "12:00",
    assigned_role: "operador",
  },
  {
    task_type: "CHECKLIST_FECHAMENTO",
    title: "Checklist de fechamento",
    description: "Encerramento do dia: superfícies, resíduos e expurgo em ordem.",
    frequency: "DAILY",
    hora: "18:30",
    assigned_role: "operador",
  },
  {
    task_type: "TESTE_BIOLOGICO",
    title: "Teste biológico da autoclave",
    description: "Rodar a ampola-teste na carga e registrar a foto do resultado.",
    frequency: "WEEKLY",
    weekday: 1,
    hora: "08:00",
    assigned_role: "operador",
  },
  {
    task_type: "ESTOQUE_INTEGRADORES",
    title: "Revisar integradores e embalagens",
    description:
      "Conferir estoque de integradores Tipo 5/6 e a validade das embalagens de esterilização.",
    frequency: "MONTHLY",
    hora: "09:00",
    assigned_role: "gestor",
  },
  {
    task_type: "DOSIMETRIA",
    title: "Enviar dosímetros do Raio-X",
    description: "Encaminhar os dosímetros da equipe para leitura laboratorial do mês.",
    frequency: "MONTHLY",
    hora: "09:00",
    assigned_role: "gestor",
  },
];

/* ------------------------------- modo guiado ------------------------------- */

export type Guia = { passos: string[]; rotuloBotao: string; destino: string };

export const GUIAS: Record<string, Guia> = {
  CHECKLIST_ABERTURA: {
    passos: [
      "Leia o QR Code da estação (recepção, equipo, expurgo…).",
      "Marque cada item conferido na tela.",
      "Tire a foto da estação já higienizada — a data, a hora e o local entram na imagem.",
    ],
    rotuloBotao: "Abrir checklist",
    destino: "/saude",
  },
  LIMPEZA_ENTRE_PACIENTES: {
    passos: [
      "Troque as barreiras descartáveis do equipo.",
      "Aplique o produto e aguarde o tempo de contato mostrado na tela.",
      "Fotografe o equipo pronto para o próximo atendimento.",
    ],
    rotuloBotao: "Registrar limpeza",
    destino: "/saude",
  },
  CHECKLIST_FECHAMENTO: {
    passos: [
      "Confira o expurgo, os resíduos e as superfícies.",
      "Marque os itens na tela e registre a foto final.",
    ],
    rotuloBotao: "Abrir checklist",
    destino: "/saude",
  },
  TESTE_BIOLOGICO: {
    passos: [
      "Coloque a ampola-teste junto com a carga da autoclave.",
      "Após o ciclo, incube a ampola pelo tempo indicado pelo fabricante.",
      "Tire a foto da ampola mostrando a cor do resultado (negativo = aprovado).",
    ],
    rotuloBotao: "Capturar foto e salvar",
    destino: "/saude",
  },
  ESTOQUE_INTEGRADORES: {
    passos: [
      "Conte os integradores químicos Tipo 5/6 disponíveis e anote o lote.",
      "Confira a validade das embalagens (papel grau cirúrgico e rolos).",
      "Reponha o que estiver abaixo do mínimo antes do fim do mês.",
    ],
    rotuloBotao: "Abrir estoque",
    destino: "/painel/estoque",
  },
  DOSIMETRIA: {
    passos: [
      "Recolha os dosímetros de todos os operadores.",
      "Envie ao laboratório e guarde o comprovante.",
      "Ao receber o relatório, anexe na pasta de laudos.",
    ],
    rotuloBotao: "Abrir pasta de laudos",
    destino: "/painel/pastas",
  },
  LICENCA: {
    passos: [
      "Providencie o documento renovado com o órgão responsável.",
      "Fotografe ou salve o PDF no celular.",
      "Anexe na pasta e informe a nova data de validade.",
    ],
    rotuloBotao: "Anexar documento",
    destino: "/painel/pastas",
  },
};

export function guiaDe(taskType: string): Guia {
  return GUIAS[taskType] ?? GUIAS["LICENCA"]!;
}

/* --------------------------------- cálculos --------------------------------- */

function mesmoDia(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** A tarefa é devida hoje conforme a frequência? */
export function devidaHoje(a: Agendamento, hoje = new Date()): boolean {
  if (a.frequency === "DAILY") return true;
  if (a.frequency === "WEEKLY") return hoje.getDay() === (a.weekday ?? 1);
  if (a.frequency === "MONTHLY") return hoje.getDate() === 1;
  const venc = new Date(`${a.due_date}T12:00:00`);
  return venc.getMonth() === hoje.getMonth() && venc.getDate() === hoje.getDate();
}

export function concluidaHoje(a: Agendamento, hoje = new Date()): boolean {
  if (!a.last_completed_at) return false;
  const q = new Date(a.last_completed_at);
  if (a.frequency === "DAILY") return mesmoDia(q, hoje);
  const dias = (hoje.getTime() - q.getTime()) / 86_400_000;
  if (a.frequency === "WEEKLY") return dias < 7;
  if (a.frequency === "MONTHLY") return dias < 28;
  return dias < 365;
}

export type Tarefa = {
  id: string;
  taskType: string;
  titulo: string;
  descricao: string;
  etiqueta: string;
  severidade: "INFO" | "ALERTA" | "CRITICO";
  feita: boolean;
  agendamentoId: string | null;
};

/** Monta o feed "O que fazer hoje" a partir da agenda e dos vencimentos. */
export function tarefasDeHoje(
  agenda: Agendamento[],
  licencas: Licenca[],
  hoje = new Date(),
): Tarefa[] {
  const tarefas: Tarefa[] = [];

  for (const a of agenda.filter((x) => devidaHoje(x, hoje))) {
    const feita = concluidaHoje(a, hoje);
    tarefas.push({
      id: `agenda-${a.id}`,
      taskType: a.task_type,
      titulo: a.title,
      descricao: a.description ?? "",
      etiqueta:
        a.frequency === "WEEKLY"
          ? `Hoje é dia — ${ROTULO_FREQ[a.frequency]}`
          : a.frequency === "MONTHLY"
            ? "Virada do mês"
            : "Ação rápida",
      severidade: feita ? "INFO" : a.task_type === "TESTE_BIOLOGICO" ? "ALERTA" : "INFO",
      feita,
      agendamentoId: a.id,
    });
  }

  for (const alerta of licencasEmAlerta(licencas, hoje)) {
    tarefas.push({
      id: `licenca-${alerta.licenca.id}`,
      taskType: "LICENCA",
      titulo: alerta.licenca.title,
      descricao: alerta.mensagem,
      etiqueta: alerta.dias < 0 ? "Documento vencido" : `Faltam ${alerta.dias} dia(s)`,
      severidade: alerta.dias < 0 ? "CRITICO" : alerta.dias <= 7 ? "ALERTA" : "INFO",
      feita: false,
      agendamentoId: null,
    });
  }

  const ordem = { CRITICO: 0, ALERTA: 1, INFO: 2 } as const;
  return tarefas.sort(
    (x, y) => Number(x.feita) - Number(y.feita) || ordem[x.severidade] - ordem[y.severidade],
  );
}

export function diasAte(data: string, hoje = new Date()): number {
  return Math.ceil((new Date(`${data}T12:00:00`).getTime() - hoje.getTime()) / 86_400_000);
}

export function statusLicenca(l: { expiration_date: string }, hoje = new Date()) {
  const dias = diasAte(l.expiration_date, hoje);
  if (dias < 0) return "VENCIDO" as const;
  if (dias <= 30) return "PROXIMO_VENCIMENTO" as const;
  return "EM_DIA" as const;
}

/** Licenças cujo prazo caiu numa das janelas de antecedência (30/15/7/1) ou já venceram. */
export function licencasEmAlerta(
  licencas: Licenca[],
  hoje = new Date(),
): { licenca: Licenca; dias: number; mensagem: string }[] {
  const saida: { licenca: Licenca; dias: number; mensagem: string }[] = [];
  for (const l of licencas) {
    const dias = diasAte(l.expiration_date, hoje);
    const janelas = l.alert_lead_days?.length ? l.alert_lead_days : DIAS_AVISO_PADRAO;
    const maior = Math.max(...janelas);
    if (dias < 0) {
      saida.push({
        licenca: l,
        dias,
        mensagem: `${l.title} venceu há ${Math.abs(dias)} dia(s). Anexe o documento renovado.`,
      });
    } else if (dias <= maior) {
      saida.push({
        licenca: l,
        dias,
        mensagem: `${l.title} vence em ${dias} dia(s). Anexe o novo documento renovado aqui.`,
      });
    }
  }
  return saida.sort((a, b) => a.dias - b.dias);
}

/* ----------------------------------- CRUD ----------------------------------- */

export async function listarAgenda(): Promise<Agendamento[]> {
  const { data, error } = await supabase
    .from("compliance_schedules")
    .select("*")
    .order("hora", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Agendamento[];
}

export async function criarAgendaPadrao(organizacaoId: string): Promise<void> {
  const existentes = await listarAgenda();
  const tipos = new Set(existentes.map((a) => a.task_type));
  const novos = TAREFAS_PADRAO.filter((t) => !tipos.has(t.task_type)).map((t) => ({
    organizacao_id: organizacaoId,
    task_type: t.task_type,
    title: t.title,
    description: t.description,
    frequency: t.frequency,
    weekday: t.weekday ?? null,
    hora: t.hora,
    assigned_role: t.assigned_role,
    due_date: new Date().toISOString().slice(0, 10),
  }));
  if (!novos.length) return;
  const { error } = await supabase.from("compliance_schedules").insert(novos);
  if (error) throw error;
}

export async function concluirTarefa(id: string): Promise<void> {
  const { error } = await supabase
    .from("compliance_schedules")
    .update({ is_completed: true, last_completed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function listarLicencas(): Promise<Licenca[]> {
  const { data, error } = await supabase
    .from("license_expirations")
    .select("*")
    .order("expiration_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Licenca[];
}

export async function salvarLicenca(entrada: {
  id?: string;
  organizacao_id: string;
  document_type: string;
  title: string;
  expiration_date: string;
  notes?: string | null;
}): Promise<void> {
  const registro = {
    organizacao_id: entrada.organizacao_id,
    document_type: entrada.document_type,
    title: entrada.title.trim(),
    expiration_date: entrada.expiration_date,
    notes: entrada.notes?.trim() || null,
    status: statusLicenca({ expiration_date: entrada.expiration_date }),
  };
  const q = entrada.id
    ? await supabase.from("license_expirations").update(registro).eq("id", entrada.id)
    : await supabase.from("license_expirations").insert(registro);
  if (q.error) throw q.error;
}

export async function excluirLicenca(id: string): Promise<void> {
  const { error } = await supabase.from("license_expirations").delete().eq("id", id);
  if (error) throw error;
}

export async function listarNotificacoes(limite = 30): Promise<Notificacao[]> {
  const { data, error } = await supabase
    .from("notification_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as unknown as Notificacao[];
}

export async function marcarNotificacaoLida(id: string): Promise<void> {
  const { error } = await supabase
    .from("notification_logs")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw error;
}
