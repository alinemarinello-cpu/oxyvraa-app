import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getChecklist, getTempoMinimoSeg, getFrequenciaEsperada } from "@/lib/oxyvra-store";

export default defineTool({
  name: "checklist_ambiente",
  title: "Checklist do ambiente",
  description:
    "Retorna o checklist padrão de higienização de um ambiente, o tempo mínimo de execução e a frequência esperada por dia.",
  inputSchema: {
    ambiente: z
      .string()
      .describe("Id do ambiente, ex.: banheiros, salas, refeitorio, cozinha, consultorios."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ ambiente }) => {
    const dados = {
      ambiente,
      itens: getChecklist(ambiente),
      tempoMinimoSeg: getTempoMinimoSeg(ambiente),
      frequenciaEsperadaPorDia: getFrequenciaEsperada(ambiente),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(dados, null, 2) }],
      structuredContent: dados,
    };
  },
});
