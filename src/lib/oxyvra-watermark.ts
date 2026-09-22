// Aplica marca d'água digital anti-fraude sobre uma imagem em dataURL.
// Renderiza rodapé com: unidade, local, GPS, data/hora e PIN (últimos dígitos).

export type WatermarkInfo = {
  unidade: string;
  local?: string;
  lat?: number;
  lng?: number;
  pin?: string;
  quando?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function applyWatermark(
  dataUrl: string,
  info: WatermarkInfo,
): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const maxW = 1280;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);

    const when = new Date(info.quando ?? Date.now());
    const dataHora = when.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const gps =
      info.lat != null && info.lng != null
        ? `GPS ${info.lat.toFixed(5)}, ${info.lng.toFixed(5)}`
        : "GPS indisponível";
    const pinTag = info.pin ? `PIN •••${info.pin.slice(-2)}` : "";

    const padding = Math.round(w * 0.02);
    const lineH = Math.round(w * 0.03);
    const barH = lineH * 4 + padding * 2;
    ctx.fillStyle = "rgba(11, 34, 56, 0.78)";
    ctx.fillRect(0, h - barH, w, barH);

    ctx.fillStyle = "#D4AF37";
    ctx.font = `700 ${Math.round(lineH * 0.7)}px system-ui, -apple-system, sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText("OXYVRA • SELO DIGITAL", padding, h - barH + padding);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${Math.round(lineH * 0.82)}px system-ui, -apple-system, sans-serif`;
    const line1 = info.local
      ? `${info.unidade} — ${info.local}`
      : info.unidade;
    ctx.fillText(line1, padding, h - barH + padding + lineH);
    ctx.font = `500 ${Math.round(lineH * 0.72)}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(dataHora, padding, h - barH + padding + lineH * 2);
    ctx.fillText(`${gps}${pinTag ? "  •  " + pinTag : ""}`, padding, h - barH + padding + lineH * 3);

    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return dataUrl;
  }
}
