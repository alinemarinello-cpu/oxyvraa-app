// Estilos compartilhados dos e-mails Oxyvra (navy #0B2238 / dourado #D4AF37).
export const main = { backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" };
export const container = { padding: "24px", maxWidth: "560px" };
export const brand = {
  backgroundColor: "#0B2238",
  borderRadius: "12px",
  padding: "18px 20px",
  margin: "0 0 24px",
};
export const brandText = {
  color: "#D4AF37",
  fontSize: "18px",
  fontWeight: "bold" as const,
  margin: "0",
  letterSpacing: "0.5px",
};
export const brandSub = { color: "#ffffff", fontSize: "12px", margin: "4px 0 0" };
export const h1 = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "#0B2238",
  margin: "0 0 16px",
};
export const text = {
  fontSize: "14px",
  color: "#44506180",
  lineHeight: "1.6",
  margin: "0 0 22px",
};
export const textDark = {
  fontSize: "14px",
  color: "#334155",
  lineHeight: "1.6",
  margin: "0 0 22px",
};
export const button = {
  backgroundColor: "#0B2238",
  color: "#D4AF37",
  fontSize: "14px",
  fontWeight: "bold" as const,
  border: "1px solid #0B2238",
  borderRadius: "10px",
  padding: "13px 22px",
  textDecoration: "none",
};
export const codigo = {
  fontSize: "30px",
  fontWeight: "bold" as const,
  letterSpacing: "6px",
  color: "#0B2238",
  margin: "0 0 22px",
};
export const footer = {
  fontSize: "11px",
  color: "#94a3b8",
  lineHeight: "1.6",
  margin: "30px 0 0",
};
// Renderizado como texto: manter sem >, & ou aspas.
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #D4AF37 !important; color: #0B2238 !important; }
  }
  [data-ogsc] .dm-btn { background-color: #D4AF37 !important; color: #0B2238 !important; }
  [data-ogsb] .dm-btn { background-color: #D4AF37 !important; color: #0B2238 !important; }
`;
