import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import {
  ALERGENO_META,
  KIT_ALERGENOS,
  TIPOS_LIMPEZA,
  TIPO_LIMPEZA_META,
} from "@/lib/oxyvra-industrial";
import { CORES_LIMPEZA, CORES_LIMPEZA_LIST } from "@/lib/oxyvra-store";

export default defineTool({
  name: "protocolo_industrial",
  title: "Protocolo industrial (PPOH)",
  description:
    "Retorna os tipos de limpeza PPOH (pré-operacional, troca de lote, pós-operacional, CIP, COP), o código de cores de kits e os alérgenos travados por cor.",
  inputSchema: {
    tipoLimpeza: z
      .enum(["pre_operacional", "troca_lote", "pos_operacional", "cip", "cop"])
      .optional()
      .describe("Retorna apenas o protocolo deste tipo de limpeza."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ tipoLimpeza }) => {
    const tipos = (tipoLimpeza ? [tipoLimpeza] : TIPOS_LIMPEZA).map((t) => ({
      ...TIPO_LIMPEZA_META[t],
    }));
    const kits = CORES_LIMPEZA_LIST.map((cor) => ({
      cor,
      label: CORES_LIMPEZA[cor].label,
      uso: CORES_LIMPEZA[cor].uso,
      alergenos: KIT_ALERGENOS[cor].map((a) => ALERGENO_META[a].label),
    }));
    const dados = { tiposLimpeza: tipos, kitsPorCor: kits };
    return {
      content: [{ type: "text", text: JSON.stringify(dados, null, 2) }],
      structuredContent: dados,
    };
  },
});
