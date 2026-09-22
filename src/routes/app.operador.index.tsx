import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { QrCode, AlertTriangle, WifiOff } from "lucide-react";
import { QrScanner } from "@/components/QrScanner";
import { parseQrPayload, getUnitById, setCurrentUnit, useHydrated } from "@/lib/oxyvra-store";
import { falar } from "@/lib/operador-voz";

export const Route = createFileRoute("/app/operador/")({
  head: () => ({
    meta: [
      { title: "Oxyvra Campo — Escanear área para higienizar" },
      {
        name: "description",
        content:
          "Tela do operador: escaneie o QR Code da suíte, trocador ou cozinha e siga as tarefas guiadas por cores, tempo de contato e foto.",
      },
      { property: "og:title", content: "Oxyvra Campo — Escanear área para higienizar" },
      {
        property: "og:description",
        content: "Escaneie o QR da área e execute a higienização com registro automático.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OperadorHome,
});

function OperadorHome() {
  const navigate = useNavigate();
  const hidratado = useHydrated();
  const [scanner, setScanner] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function aoLer(raw: string) {
    setScanner(false);
    const lido = parseQrPayload(raw);
    if (!lido) {
      setErro("Este QR Code não é do Oxyvra. Procure a etiqueta colada na área.");
      return;
    }
    const unit = getUnitById(lido.unitId);
    if (!unit) {
      setErro("Esta unidade ainda não foi liberada neste aparelho. Entre com o PIN da unidade.");
      return;
    }
    const local = (unit.locais ?? []).find((l) => l.qrToken === lido.token);
    if (!local) {
      setErro("Este QR não corresponde a nenhuma área cadastrada nesta unidade.");
      return;
    }
    setCurrentUnit(unit.id);
    setErro(null);
    void navigate({
      to: "/app/operador/$unitId/$token",
      params: { unitId: unit.id, token: lido.token! },
    });
  }

  return (
    <main className="min-h-screen bg-background flex flex-col px-5 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-black text-navy leading-tight">Vamos higienizar</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Encoste a câmera na etiqueta da área. O app faz o resto.
        </p>
      </header>

      <div className="flex-1 flex items-center justify-center py-8">
        <button
          onClick={() => {
            setErro(null);
            setScanner(true);
            falar("Aponte a câmera para o QR Code da área.");
          }}
          className="w-full max-w-sm min-h-[220px] rounded-[2rem] bg-navy text-primary-foreground flex flex-col items-center justify-center gap-4 px-6 py-10 shadow-xl active:scale-[0.98] transition-transform"
        >
          <QrCode className="w-20 h-20 text-gold" aria-hidden />
          <span className="text-2xl font-black leading-tight text-center">
            Escanear QR Code
            <br />
            da Área / UH
          </span>
        </button>
      </div>

      {erro && (
        <div className="mx-auto w-full max-w-sm rounded-2xl bg-destructive/10 p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto" aria-hidden />
          <p className="mt-2 text-sm font-bold text-destructive">{erro}</p>
          <Link
            to="/entrar"
            className="mt-3 inline-flex min-h-[48px] items-center rounded-xl bg-navy px-5 font-black text-primary-foreground"
          >
            Entrar com PIN da unidade
          </Link>
        </div>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <WifiOff className="w-4 h-4" aria-hidden /> Sem internet? Pode trabalhar normalmente — tudo
        sobe sozinho depois.
      </p>

      {hidratado && scanner && (
        <QrScanner onDetected={aoLer} onClose={() => setScanner(false)} />
      )}
    </main>
  );
}
