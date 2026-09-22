import { useEffect, useState } from "react";
import { CloudOff, UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { onFilaChange, estaOnline } from "@/lib/oxyvra-offline";
import { contarPendentes, enviarAgora } from "@/lib/oxyvra-sync";

/** Faixa fixa que avisa a equipe quando está sem internet ou com registros na fila. */
export function StatusRede() {
  const [pendentes, setPendentes] = useState(0);
  const [online, setOnline] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const atualizar = () => {
      void contarPendentes().then((n) => vivo && setPendentes(n));
      setOnline(estaOnline());
    };
    atualizar();
    const off = onFilaChange(atualizar);
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    const t = window.setInterval(atualizar, 15_000);
    return () => {
      vivo = false;
      off();
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
      window.clearInterval(t);
    };
  }, []);

  if (online && pendentes === 0 && !msg) return null;

  async function enviar() {
    setEnviando(true);
    const r = await enviarAgora();
    setMsg(r.ok ? "Dados enviados para a nuvem." : (r.erro ?? "Falha ao enviar."));
    setEnviando(false);
    void contarPendentes().then(setPendentes);
    window.setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-3 pb-3 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-navy text-navy-foreground shadow-elevated px-4 py-3 flex items-center gap-3">
        {online ? (
          <UploadCloud className="w-5 h-5 text-gold shrink-0" />
        ) : (
          <CloudOff className="w-5 h-5 text-gold shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black truncate">
            {msg ?? (online ? "Registros aguardando envio" : "Modo offline ativo")}
          </p>
          <p className="text-[11px] text-white/70 truncate">
            {pendentes > 0
              ? `${pendentes} registro(s) salvos no aparelho${online ? " — enviando…" : " — sobem sozinhos ao voltar a internet"}`
              : "Você pode continuar trabalhando normalmente."}
          </p>
        </div>
        {online && pendentes > 0 && (
          <button
            onClick={enviar}
            disabled={enviando}
            className="shrink-0 rounded-xl bg-gold text-navy font-black text-xs px-3 py-2 disabled:opacity-60 flex items-center gap-1"
          >
            {enviando ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Enviar
          </button>
        )}
      </div>
    </div>
  );
}
