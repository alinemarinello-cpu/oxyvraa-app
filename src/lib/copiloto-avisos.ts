// Regras puras da matriz de notificações do Copiloto (usadas pelo worker e pelo app).
import {
  DIAS_AVISO_PADRAO,
  concluidaHoje,
  devidaHoje,
  diasAte,
  type Agendamento,
  type Licenca,
} from "@/lib/copiloto-db";

export type AvisoGerado = {
  channel: "PUSH" | "WHATSAPP" | "EMAIL";
  severity: "INFO" | "ALERTA" | "CRITICO";
  task_type: string;
  title: string;
  message: string;
  action_path: string;
  dedupe_key: string;
};

const MENSAGENS: Record<string, string> = {
  CHECKLIST_ABERTURA: "Bom dia! Registre a checagem de abertura em 40s antes do 1º paciente.",
  LIMPEZA_ENTRE_PACIENTES: "Troca de turno: registre a limpeza e desinfecção entre atendimentos.",
  CHECKLIST_FECHAMENTO: "Antes de fechar: registre o checklist de fechamento do dia.",
  TESTE_BIOLOGICO:
    "Hoje é dia do Teste Biológico na autoclave. Toque aqui para registrar a foto da ampola.",
  DOSIMETRIA: "Lembrete: enviar os dosímetros do Raio-X para leitura laboratorial do mês.",
  ESTOQUE_INTEGRADORES:
    "Revisão do mês: confira o estoque de integradores Tipo 5/6 e a validade das embalagens.",
};

/** Constrói os avisos do dia a partir da agenda, das licenças e do teste biológico. */
export function montarAvisos(entrada: {
  agenda: Agendamento[];
  licencas: Licenca[];
  diasSemBiologico: number | null;
  hoje?: Date;
}): AvisoGerado[] {
  const hoje = entrada.hoje ?? new Date();
  const dia = hoje.toISOString().slice(0, 10);
  const avisos: AvisoGerado[] = [];

  for (const a of entrada.agenda) {
    if (!devidaHoje(a, hoje) || concluidaHoje(a, hoje)) continue;
    const biologico = a.task_type === "TESTE_BIOLOGICO";
    avisos.push({
      channel: "PUSH",
      severity: biologico ? "ALERTA" : "INFO",
      task_type: a.task_type,
      title: a.title,
      message: MENSAGENS[a.task_type] ?? (a.description || a.title),
      action_path: "/hoje",
      dedupe_key: `${a.task_type}-${dia}`,
    });
    if (biologico) {
      avisos.push({
        channel: "WHATSAPP",
        severity: "ALERTA",
        task_type: a.task_type,
        title: a.title,
        message: MENSAGENS["TESTE_BIOLOGICO"]!,
        action_path: "/hoje",
        dedupe_key: `${a.task_type}-wpp-${dia}`,
      });
    }
  }

  if (entrada.diasSemBiologico === null || entrada.diasSemBiologico >= 7) {
    const atraso =
      entrada.diasSemBiologico === null
        ? "Nenhum teste biológico registrado até agora."
        : `Último teste biológico há ${entrada.diasSemBiologico} dias.`;
    for (const canal of ["PUSH", "WHATSAPP"] as const) {
      avisos.push({
        channel: canal,
        severity: "CRITICO",
        task_type: "TESTE_BIOLOGICO_ATRASADO",
        title: "Teste biológico atrasado",
        message: `ATENÇÃO: teste biológico atrasado. ${atraso} A Pasta da Vigilância está com pendência crítica.`,
        action_path: "/hoje",
        dedupe_key: `biologico-atrasado-${canal}-${dia}`,
      });
    }
  }

  for (const l of entrada.licencas) {
    const dias = diasAte(l.expiration_date, hoje);
    const janelas = l.alert_lead_days?.length ? l.alert_lead_days : DIAS_AVISO_PADRAO;
    if (dias < 0) {
      avisos.push({
        channel: "PUSH",
        severity: "CRITICO",
        task_type: "LICENCA_VENCIDA",
        title: l.title,
        message: `${l.title} está vencido há ${Math.abs(dias)} dia(s). Anexe o documento renovado.`,
        action_path: "/painel/pastas",
        dedupe_key: `licenca-${l.id}-vencida-${dia}`,
      });
    } else if (janelas.includes(dias)) {
      for (const canal of ["PUSH", "EMAIL"] as const) {
        avisos.push({
          channel: canal,
          severity: dias <= 7 ? "ALERTA" : "INFO",
          task_type: "LICENCA_A_VENCER",
          title: l.title,
          message: `${l.title} vence em ${dias} dia(s). Anexe o novo documento renovado aqui.`,
          action_path: "/painel/pastas",
          dedupe_key: `licenca-${l.id}-${dias}-${canal}`,
        });
      }
    }
  }

  return avisos;
}
