import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DIAS_AVISO_PADRAO,
  diasAte,
  excluirLicenca,
  listarLicencas,
  salvarLicenca,
  statusLicenca,
} from "@/lib/copiloto-db";
import { TIPOS_LICENCA } from "@/lib/saude-conformidade-db";

const campo = "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm";

const ETIQUETA = {
  VENCIDO: "bg-destructive text-destructive-foreground",
  PROXIMO_VENCIMENTO: "bg-amber-500 text-white",
  EM_DIA: "bg-teal text-teal-foreground",
} as const;

/** Controle de vencimento de licenças e laudos, com avisos automáticos 30/15/7/1 dias antes. */
export function PrazosLicencas({ organizacaoId }: { organizacaoId?: string }) {
  const qc = useQueryClient();
  const licencas = useQuery({ queryKey: ["copiloto-licencas"], queryFn: listarLicencas });
  const [tipo, setTipo] = useState<string>(TIPOS_LICENCA[0].id);
  const [venc, setVenc] = useState("");
  const [salvando, setSalvando] = useState(false);

  const adicionar = async () => {
    if (!organizacaoId) return;
    if (!venc) {
      toast.error("Informe a data de vencimento.");
      return;
    }
    setSalvando(true);
    try {
      await salvarLicenca({
        organizacao_id: organizacaoId,
        document_type: tipo,
        title: TIPOS_LICENCA.find((t) => t.id === tipo)?.label ?? tipo,
        expiration_date: venc,
      });
      setVenc("");
      await qc.invalidateQueries({ queryKey: ["copiloto-licencas"] });
      toast.success("Prazo cadastrado. Avisaremos 30, 15, 7 e 1 dia antes.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-black text-foreground">
        <CalendarClock className="h-4 w-4" /> Prazos de licenças e laudos
      </h3>
      <p className="text-xs text-muted-foreground">
        O copiloto avisa a equipe com {DIAS_AVISO_PADRAO.join(", ")} dias de antecedência.
      </p>

      <div className="grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[2fr_1fr_auto]">
        <select className={campo} value={tipo} onChange={(e) => setTipo(e.target.value)}>
          {TIPOS_LICENCA.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <input type="date" className={campo} value={venc} onChange={(e) => setVenc(e.target.value)} />
        <button
          disabled={salvando}
          onClick={() => void adicionar()}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-teal px-4 text-sm font-black text-teal-foreground"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <ul className="space-y-2">
        {(licencas.data ?? []).map((l) => {
          const st = statusLicenca(l);
          const dias = diasAte(l.expiration_date);
          return (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 text-sm"
            >
              <div>
                <p className="font-bold text-foreground">{l.title}</p>
                <p className="text-xs text-muted-foreground">
                  Vence em {new Date(`${l.expiration_date}T12:00:00`).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-black ${ETIQUETA[st]}`}>
                  {st === "VENCIDO"
                    ? `Vencido há ${Math.abs(dias)} d`
                    : st === "PROXIMO_VENCIMENTO"
                      ? `Faltam ${dias} d`
                      : "Em dia"}
                </span>
                <button
                  onClick={async () => {
                    await excluirLicenca(l.id);
                    await qc.invalidateQueries({ queryKey: ["copiloto-licencas"] });
                  }}
                  className="rounded-xl border border-border p-2 text-muted-foreground"
                  aria-label={`Remover ${l.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
        {!(licencas.data ?? []).length && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum prazo cadastrado ainda.
          </li>
        )}
      </ul>
    </section>
  );
}
