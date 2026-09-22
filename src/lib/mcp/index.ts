import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listarAmbientes from "./tools/listar-ambientes";
import checklistAmbiente from "./tools/checklist-ambiente";
import catalogoProdutos from "./tools/catalogo-produtos";
import calcularDiluicao from "./tools/calcular-diluicao";
import protocoloIndustrial from "./tools/protocolo-industrial";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "oxyvra-clean-app",
  title: "Oxyvra Clean App",
  version: "0.1.0",
  instructions:
    "Ferramentas de referência da Oxyvra Biossegurança: ambientes e código de cores, checklists de higienização, catálogo de produtos Spartan com diluições, cálculo de consumo por m² e protocolos industriais PPOH/alérgenos. Somente dados públicos de referência — não expõe registros de unidades ou clientes.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),

  tools: [
    listarAmbientes,
    checklistAmbiente,
    catalogoProdutos,
    calcularDiluicao,
    protocoloIndustrial,
  ],
});
