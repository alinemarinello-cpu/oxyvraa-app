import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { CATALOGO_SPARTAN } from "@/lib/oxyvra-store";

export default defineTool({
  name: "catalogo_produtos",
  title: "Catálogo de produtos Spartan",
  description:
    "Lista o catálogo de produtos químicos Spartan usados pela Oxyvra, com diluições, uso recomendado, grau alimentício e verticais aplicáveis.",
  inputSchema: {
    vertical: z
      .enum(["educacional", "industria_alimenticia"])
      .optional()
      .describe("Filtra os produtos aplicáveis a uma vertical."),
    busca: z.string().optional().describe("Filtro por texto no nome ou uso do produto."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ vertical, busca }) => {
    const termo = busca?.trim().toLowerCase();
    const produtos = CATALOGO_SPARTAN.filter(
      (p) =>
        (!vertical || p.verticais.includes(vertical)) &&
        (!termo ||
          p.nome.toLowerCase().includes(termo) ||
          p.usoRecomendado.toLowerCase().includes(termo)),
    );
    return {
      content: [{ type: "text", text: JSON.stringify(produtos, null, 2) }],
      structuredContent: { produtos },
    };
  },
});
