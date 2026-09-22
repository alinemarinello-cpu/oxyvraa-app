/**
 * Número comercial da Oxyvra para os CTAs de WhatsApp dos funis públicos.
 * Formato internacional sem "+" (wa.me).
 */
export const WHATSAPP_OXYVRA = "5519998882050";

export function waLinkOxyvra(texto: string): string {
  return `https://wa.me/${WHATSAPP_OXYVRA}?text=${encodeURIComponent(texto)}`;
}
