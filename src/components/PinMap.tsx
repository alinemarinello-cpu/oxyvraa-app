import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import { getCurrentPosition } from "@/lib/oxyvra-store";

export type UnitMarker = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  emoji?: string;
  color?: string; // hex, cor de status
  onClick?: () => void;
};

type Props = {
  mode: "pin" | "view";
  height?: number;
  // Modo pin (edição)
  value?: { lat: number; lng: number } | null;
  onChange?: (v: { lat: number; lng: number } | null) => void;
  radiusMeters?: number;
  // Modo view (múltiplos marcadores)
  markers?: UnitMarker[];
  fitToMarkers?: boolean;
};

let leafletCssInjected = false;
function ensureLeafletCss() {
  if (leafletCssInjected || typeof document === "undefined") return;
  if (!document.querySelector("link[data-leaflet]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-leaflet", "1");
    document.head.appendChild(link);
  }
  leafletCssInjected = true;
}

export function PinMap({
  mode,
  height = 300,
  value,
  onChange,
  radiusMeters = 150,
  markers = [],
  fitToMarkers = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const multiRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Inicializa mapa
  useEffect(() => {
    let cancelled = false;
    ensureLeafletCss();
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const initial: [number, number] =
        value ? [value.lat, value.lng]
        : markers[0] ? [markers[0].lat, markers[0].lng]
        : [-22.9709, -46.9959]; // Valinhos/SP fallback

      const map = L.map(containerRef.current, {
        center: initial,
        zoom: value || markers.length ? 16 : 12,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      mapRef.current = map;

      if (mode === "pin" && onChange) {
        map.on("click", (e: any) => {
          onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }

      setReady(true);
      // Fix render size after mount
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marker no modo pin
  useEffect(() => {
    if (!ready || mode !== "pin") return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      if (value) {
        const icon = L.divIcon({
          className: "oxy-pin",
          html: `<div style="background:#D4AF37;border:3px solid #0B2238;width:26px;height:26px;border-radius:50%;box-shadow:0 4px 10px rgba(0,0,0,.4);"></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        markerRef.current = L.marker([value.lat, value.lng], { icon }).addTo(map);
        circleRef.current = L.circle([value.lat, value.lng], {
          radius: radiusMeters,
          color: "#0B2238",
          fillColor: "#D4AF37",
          fillOpacity: 0.15,
          weight: 2,
        }).addTo(map);
      }
    })();
  }, [ready, value, radiusMeters, mode]);

  // Múltiplos marcadores no modo view
  useEffect(() => {
    if (!ready || mode !== "view") return;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;
      multiRef.current.forEach((m) => map.removeLayer(m));
      multiRef.current = [];
      const bounds: [number, number][] = [];
      for (const m of markers) {
        const color = m.color ?? "#0B2238";
        const icon = L.divIcon({
          className: "oxy-marker",
          html: `<div style="background:${color};border:3px solid white;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">${m.emoji ?? "📍"}</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });
        const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
        marker.bindTooltip(m.label, { direction: "top", offset: [0, -30] });
        if (m.onClick) marker.on("click", m.onClick);
        multiRef.current.push(marker);
        bounds.push([m.lat, m.lng]);
      }
      if (fitToMarkers && bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 16);
      }
    })();
  }, [ready, markers, mode, fitToMarkers]);

  const useMyLocation = async () => {
    if (!onChange) return;
    setLoading(true);
    setErr(null);
    try {
      const p = await getCurrentPosition();
      onChange({ lat: p.lat, lng: p.lng });
      mapRef.current?.setView([p.lat, p.lng], 17);
    } catch (e: any) {
      setErr(e?.message ?? "Não foi possível obter a localização.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="rounded-xl overflow-hidden border border-border bg-secondary"
      />
      {mode === "pin" && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs font-bold text-navy bg-secondary hover:bg-gold/20 px-3 py-2 rounded-lg border border-border disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
            Usar minha localização
          </button>
          {value && onChange && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs font-bold text-destructive hover:underline"
            >
              Remover pin
            </button>
          )}
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Clique no mapa para posicionar o pin.
          </p>
          {err && <p className="text-xs text-destructive w-full">{err}</p>}
        </div>
      )}
    </div>
  );
}
