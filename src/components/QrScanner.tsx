import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { X, Loader2, Camera } from "lucide-react";

type Props = {
  onDetected: (raw: string) => void;
  onClose: () => void;
};

export function QrScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [erro, setErro] = useState<string>("");
  const detectedRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf: number | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
        setStatus("ready");
        canvasRef.current = document.createElement("canvas");
        tick();
      } catch (e) {
        const name = (e as { name?: string } | null)?.name;
        if (name === "NotAllowedError" || name === "SecurityError") {
          setErro(
            "Permissão de câmera negada. Ative a câmera nas configurações do aparelho para este app e tente novamente.",
          );
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setErro("Nenhuma câmera traseira encontrada neste dispositivo.");
        } else {
          setErro(e instanceof Error ? e.message : "Câmera indisponível");
        }
        setStatus("error");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || detectedRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
          if (code && code.data) {
            detectedRef.current = true;
            onDetected(code.data);
            return;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    start();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-navy text-white">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-gold" />
          <p className="font-black">Ler QR do local</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:bg-white/20"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-4 border-gold rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
        </div>
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-white bg-black/60">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Iniciando câmera…
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/70 p-6 text-center">
            <p className="font-black mb-2">Não foi possível abrir a câmera</p>
            <p className="text-sm opacity-80 mb-4">{erro}</p>
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gold text-navy font-black">
              Fechar
            </button>
          </div>
        )}
      </div>
      <div className="bg-navy text-white/80 text-center text-sm py-3">
        Aponte para o QR Code fixado no ambiente
      </div>
    </div>
  );
}
