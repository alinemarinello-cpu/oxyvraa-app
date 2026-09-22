import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { carregarUnidade, salvarLocais } from "@/lib/painel-db";
import { CORES_LIMPEZA, getAmbienteMeta } from "@/lib/oxyvra-store";
import { OxyvraLogo } from "@/components/OxyvraLogo";

export const Route = createFileRoute("/_authenticated/etiquetas/$unitId")({
  head: () => ({
    meta: [
      { title: "Etiquetas de QR Code — Oxyvra" },
      {
        name: "description",
        content: "Folha de etiquetas com QR Code por ambiente para impressão e colagem em campo.",
      },
      { property: "og:title", content: "Etiquetas de QR Code — Oxyvra" },
      {
        property: "og:description",
        content: "Folha de etiquetas com QR Code por ambiente para impressão e colagem em campo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Etiquetas,
});

function Etiquetas() {
  const { unitId } = Route.useParams();
  const unidade = useQuery({
    queryKey: ["unidade", unitId],
    queryFn: () => carregarUnidade(unitId),
  });
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    const gerar = async () => {
      const u = unidade.data;
      if (!u) return;
      let locais = u.locais ?? [];
      if (locais.some((l) => !l.qrToken)) locais = await salvarLocais(unitId, locais);
      const mapa: Record<string, string> = {};
      for (const l of locais) {
        mapa[l.id] = await QRCode.toDataURL(`${window.location.origin}/q/${unitId}/${l.qrToken}`, {
          margin: 1,
          width: 320,
        });
      }
      setQrs(mapa);
    };
    void gerar();
  }, [unidade.data, unitId]);

  const locais = unidade.data?.locais ?? [];

  return (
    <div className="mx-auto max-w-5xl p-6 print:p-0">
      <style>{`@media print { .no-print { display: none !important } .etiqueta { break-inside: avoid } }`}</style>

      <header className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-foreground">
            Etiquetas de QR Code — {unidade.data?.nome ?? "carregando…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {locais.length} etiqueta(s). Use “Imprimir” e escolha <b>Salvar como PDF</b> para gerar
            o arquivo em lote.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground"
        >
          <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {locais.map((l) => {
          const meta = getAmbienteMeta(l.tipo);
          const cor = CORES_LIMPEZA[l.cor ?? "azul"];
          return (
            <article
              key={l.id}
              className="etiqueta flex flex-col items-center gap-2 rounded-xl border-2 border-primary bg-white p-3 text-center"
            >
              <OxyvraLogo className="h-6" />
              <p className="text-[11px] font-black uppercase tracking-widest text-primary">
                {unidade.data?.nome}
              </p>
              {qrs[l.id] ? (
                <img src={qrs[l.id]} alt={`QR Code do ambiente ${l.nome}`} className="w-32" />
              ) : (
                <div className="h-32 w-32 animate-pulse rounded bg-muted" />
              )}
              <p className="text-sm font-black leading-tight text-primary">
                {meta.emoji} {l.nome}
              </p>
              <p className="text-[11px] font-bold text-muted-foreground">{meta.label}</p>
              <span
                className="rounded-full px-3 py-1 text-[11px] font-black text-white"
                style={{ backgroundColor: cor?.hex ?? "#0B2238" }}
              >
                KIT {cor?.label?.toUpperCase()}
              </span>
            </article>
          );
        })}
      </div>

      {!locais.length && !unidade.isLoading && (
        <p className="text-sm text-muted-foreground">
          Cadastre ambientes nesta unidade para gerar as etiquetas.
        </p>
      )}
    </div>
  );
}
