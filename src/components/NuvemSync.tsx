import { useEffect, useState } from "react";
import { Cloud, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { sincronizarNuvem, type SyncResult } from "@/lib/oxyvra-cloud";

export function NuvemSync() {
  const [rodando, setRodando] = useState(false);
  const [res, setRes] = useState<SyncResult | null>(null);
  const [ultima, setUltima] = useState<string | null>(null);

  useEffect(() => {
    setUltima(window.localStorage.getItem("oxyvra:ultima-sync"));
  }, []);

  async function rodar() {
    setRodando(true);
    const r = await sincronizarNuvem();
    setRes(r);
    if (!r.erro) {
      const agora = new Date().toLocaleString("pt-BR");
      window.localStorage.setItem("oxyvra:ultima-sync", agora);
      setUltima(agora);
    }
    setRodando(false);
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Cloud className="w-5 h-5 text-gold" />
        <div>
          <p className="font-black text-navy">Sincronização com a nuvem</p>
          <p className="text-xs text-navy/60">
            Envia unidades, equipes, limpezas, fotos e intercorrências para o banco de dados e traz
            o que foi registrado em outros aparelhos.
          </p>
        </div>
      </div>

      <button
        onClick={rodar}
        disabled={rodando}
        className="rounded-xl bg-navy text-gold font-black px-4 py-3 text-sm flex items-center gap-2 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${rodando ? "animate-spin" : ""}`} />
        {rodando ? "Sincronizando…" : "Sincronizar agora"}
      </button>

      {ultima && <p className="text-xs text-navy/50">Última sincronização: {ultima}</p>}

      {res && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-bold flex items-start gap-2 ${
            res.erro ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {res.erro ? (
            <AlertTriangle className="w-4 h-4 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5" />
          )}
          <span>
            {res.erro
              ? res.erro
              : `${res.enviados} registros enviados · ${res.fotos} fotos na nuvem · ${res.recebidos} recebidos`}
          </span>
        </div>
      )}
    </div>
  );
}
