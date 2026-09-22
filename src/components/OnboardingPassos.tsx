const PASSOS = ["Seus dados", "Porte da clínica", "Plano e teste grátis"];

export const campoCls =
  "mt-1 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground";
export const rotuloCls = "text-xs font-bold uppercase tracking-wide text-muted-foreground";

/** Trilha visual dos 3 passos do onboarding. */
export function PassosOnboarding({ atual }: { atual: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2">
      {PASSOS.map((p, i) => {
        const n = i + 1;
        const feito = n <= atual;
        return (
          <li key={p} className="flex flex-1 flex-col gap-1">
            <span
              className={`h-1.5 w-full rounded-full ${feito ? "bg-teal" : "bg-secondary"}`}
              aria-hidden
            />
            <span
              className={`text-[11px] font-bold ${
                n === atual ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {n}. {p}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
