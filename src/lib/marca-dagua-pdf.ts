// Marca d'água diagonal aplicada aos PDFs enquanto a assinatura não estiver ativa
// (status TRIALING ou PAST_DUE).
import type jsPDF from "jspdf";

export const TEXTO_MARCA_DAGUA = "TESTE — SEM VALIDADE SANITÁRIA";

/** Carimba todas as páginas do PDF com a marca d'água vermelha em diagonal. */
export function aplicarMarcaDaguaTeste(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.saveGraphicsState();
    // @ts-expect-error GState existe em runtime no jsPDF
    doc.setGState(new doc.GState({ opacity: 0.16 }));
    doc.setTextColor(220, 60, 60);
    doc.setFontSize(34);
    doc.text(TEXTO_MARCA_DAGUA, w / 2, h / 2, { align: "center", angle: 35 });
    doc.restoreGraphicsState();
  }
}
