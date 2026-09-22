import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardCheck,
  CloudOff,
  Cloud,
  HeartPulse,
  History,
  Home,
} from "lucide-react";

/** Barra superior com conectividade e pendências de sincronização. */
export function BarraStatus({
  online,
  pendentes,
  titulo,
  subtitulo,
}: {
  online: boolean;
  pendentes: number;
  titulo: string;
  subtitulo?: string;
}) {
  return (
    <header className="bg-navy px-4 pb-4 pt-5 text-primary-foreground">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-black leading-tight">{titulo}</h1>
          {subtitulo && (
            <p className="truncate text-xs text-primary-foreground/70">{subtitulo}</p>
          )}
        </div>
        <span
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            online ? "bg-teal text-teal-foreground" : "bg-warning text-warning-foreground"
          }`}
          aria-live="polite"
        >
          {online ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
          {online ? "Online" : "Offline"}
          {pendentes > 0 && (
            <span className="rounded-full bg-black/20 px-1.5">{pendentes}</span>
          )}
        </span>
      </div>
      {!online && pendentes > 0 && (
        <p className="mt-2 rounded-xl bg-warning/20 px-3 py-2 text-xs font-bold">
          {pendentes} registro(s) guardado(s) no aparelho. Enviaremos assim que a internet
          voltar.
        </p>
      )}
    </header>
  );
}

/** Navegação inferior fixa do app de campo ILPI. */
export function NavInferior() {
  const rota = useRouterState({ select: (s) => s.location.pathname });
  const itens = [
    { to: "/ilpi", rotulo: "Turno", Icone: Home },
    { to: "/ilpi/checklists", rotulo: "Checklists", Icone: ClipboardCheck },
    { to: "/ilpi/sinais", rotulo: "Sinais", Icone: HeartPulse },
    { to: "/ilpi/auditoria", rotulo: "Histórico", Icone: History },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
      <ul className="mx-auto flex max-w-3xl">
        {itens.map(({ to, rotulo, Icone }) => {
          const ativo = to === "/ilpi" ? rota === "/ilpi" : rota.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-bold ${
                  ativo ? "text-teal" : "text-muted-foreground"
                }`}
              >
                <Icone className="h-5 w-5" aria-hidden />
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Cartao({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-4 ${className}`}>
      {children}
    </section>
  );
}

export function Contador({
  valor,
  rotulo,
  tom = "neutro",
}: {
  valor: number | string;
  rotulo: string;
  tom?: "neutro" | "ok" | "alerta" | "risco";
}) {
  const cores = {
    neutro: "bg-secondary text-navy",
    ok: "bg-teal/15 text-teal",
    alerta: "bg-warning/20 text-warning",
    risco: "bg-destructive/15 text-destructive",
  } as const;
  return (
    <div className={`rounded-2xl p-3 text-center ${cores[tom]}`}>
      <p className="text-2xl font-black tabular-nums">{valor}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide">{rotulo}</p>
    </div>
  );
}
