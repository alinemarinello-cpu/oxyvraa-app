import { defineTool } from "@lovable.dev/mcp-js";
import { AMBIENTES_ALL, AMBIENTES_META, CORES_LIMPEZA, CORES_LIMPEZA_LIST } from "@/lib/oxyvra-store";

export default defineTool({
  name: "listar_ambientes",
  title: "Listar ambientes",
  description:
    "Lista os tipos de ambiente padrão da Oxyvra (banheiros, salas, refeitório, etc.) e o código de cores de limpeza utilizado.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const ambientes = AMBIENTES_ALL.map((a) => {
      const meta = AMBIENTES_META[a];
      return { id: a, label: meta.label, emoji: meta.emoji, descricao: meta.sub };
    });
    const cores = CORES_LIMPEZA_LIST.map((c) => CORES_LIMPEZA[c]);
    const dados = { ambientes, cores };
    return {
      content: [{ type: "text", text: JSON.stringify(dados, null, 2) }],
      structuredContent: dados,
    };
  },
});
