// Seletor de unidade e utilitários visuais compartilhados pelo módulo RDC 1.002/2025.
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { listarUnidades } from "@/lib/compliance-db";

const CHAVE = "oxyvra_rdc_unidade";

/** Unidade selecionada no módulo RDC (null = clínica principal / sem filial). */
export function useUnidadeRdc() {
  const [unitId, setUnitId] = useState<string | null>(null);

  useEffect(() => {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) setUnitId(salvo);
  }, []);

  const definir = useCallback((valor: string | null) => {
    setUnitId(valor);
    if (valor) localStorage.setItem(CHAVE, valor);
    else localStorage.removeItem(CHAVE);
  }, []);

  return { unitId, definirUnidade: definir };
}

export function useUnidades() {
  return useQuery({ queryKey: ["rdc-unidades"], queryFn: listarUnidades, staleTime: 60_000 });
}

export function SeletorUnidade({
  unitId,
  onChange,
}: {
  unitId: string | null;
  onChange: (v: string | null) => void;
}) {
  const { data: unidades } = useUnidades();
  return (
    <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
      Unidade
      <select
        value={unitId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-bold text-foreground"
      >
        <option value="">Clínica principal</option>
        {(unidades ?? []).map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Barra({ valor }: { valor: number }) {
  const cor = valor >= 85 ? "bg-emerald-500" : valor >= 60 ? "bg-teal" : valor >= 35 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="h-2 w-full rounded-full bg-border">
      <div className={`h-2 rounded-full ${cor}`} style={{ width: `${Math.max(2, valor)}%` }} />
    </div>
  );
}
