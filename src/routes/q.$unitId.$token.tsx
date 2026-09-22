import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, QrCode, AlertTriangle } from "lucide-react";
import { getUnitById, setCurrentUnit, useHydrated } from "@/lib/oxyvra-store";

export const Route = createFileRoute("/q/$unitId/$token")({
  head: () => ({
    meta: [
      { title: "Oxyvra — Abrir ambiente pelo QR" },
      {
        name: "description",
        content: "Leitura do QR Code do ambiente para iniciar a higienização registrada.",
      },
      { property: "og:title", content: "Oxyvra — Abrir ambiente pelo QR" },
      {
        property: "og:description",
        content: "Leitura do QR Code do ambiente para iniciar a higienização registrada.",
      },
    ],
  }),
  component: QrRedirect,
});

function QrRedirect() {
  const { unitId, token } = useParams({ from: "/q/$unitId/$token" });
  const navigate = useNavigate();
  const hidratado = useHydrated();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!hidratado) return;
    const unit = getUnitById(unitId);
    if (!unit) {
      setErro("Esta unidade ainda não foi liberada neste aparelho. Entre com o PIN da unidade.");
      return;
    }
    const local = (unit.locais ?? []).find((l) => l.qrToken === token);
    if (!local) {
      setErro("Este QR Code não corresponde a nenhum ambiente cadastrado nesta unidade.");
      return;
    }
    setCurrentUnit(unit.id);
    void navigate({
      to: "/app/operador/$unitId/$token",
      params: { unitId: unit.id, token },
      replace: true,
    });
  }, [hidratado, unitId, token, navigate]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        {erro ? (
          <>
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto" aria-hidden />
            <h1 className="text-xl font-black text-navy mt-3">QR não reconhecido</h1>
            <p className="text-muted-foreground mt-2">{erro}</p>
            <Link
              to="/entrar"
              className="inline-block mt-5 rounded-xl bg-navy px-5 py-3 font-bold text-primary-foreground"
            >
              Entrar com PIN
            </Link>
          </>
        ) : (
          <>
            <QrCode className="w-10 h-10 text-navy mx-auto" aria-hidden />
            <h1 className="text-xl font-black text-navy mt-3">Abrindo ambiente…</h1>
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto mt-4" aria-hidden />
          </>
        )}
      </div>
    </main>
  );
}
