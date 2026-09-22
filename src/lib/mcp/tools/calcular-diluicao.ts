import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getCatalogoById, CATALOGO_SPARTAN } from "@/lib/oxyvra-store";

export default defineTool({
  name: "calcular_diluicao",
  title: "Calcular diluição e consumo",
  description:
    "Calcula quantos litros de solução e quantos ml de produto concentrado são necessários para higienizar uma área (m²), conforme a diluição Spartan.",
  inputSchema: {
    produtoId: z
      .string()
      .describe("Id do produto no catálogo Spartan (ver ferramenta catalogo_produtos)."),
    areaM2: z.number().positive().describe("Área do ambiente em metros quadrados."),
    modo: z
      .enum(["desinfeccao", "manutencao"])
      .default("desinfeccao")
      .describe("Regime de diluição a aplicar."),
    litrosPorM2: z
      .number()
      .positive()
      .default(0.05)
      .describe("Consumo de solução pronta por m². Padrão 0,05 L/m²."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ produtoId, areaM2, modo, litrosPorM2 }) => {
    const produto = getCatalogoById(produtoId);
    if (!produto) {
      throw new ToolError(
        `Produto "${produtoId}" não encontrado. Ids válidos: ${CATALOGO_SPARTAN.map((p) => p.id).join(", ")}`,
      );
    }
    const diluicao =
      modo === "manutencao" ? produto.diluicaoManutencao : produto.diluicaoDesinfeccao;
    const litrosSolucao = areaM2 * litrosPorM2;
    const mlConcentrado = (litrosSolucao * 1000) / diluicao;
    const dados = {
      produto: produto.nome,
      modo,
      diluicao: `1:${diluicao}`,
      areaM2,
      litrosSolucao: Number(litrosSolucao.toFixed(2)),
      mlConcentrado: Number(mlConcentrado.toFixed(1)),
      requerEnxague: produto.requerEnxague ?? false,
      grauAlimenticio: produto.grauAlimenticio ?? false,
      usoRecomendado: produto.usoRecomendado,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(dados, null, 2) }],
      structuredContent: dados,
    };
  },
});
