import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { obterAssinatura } from "@/lib/assinatura.functions";
import {
  exigeMarcaDaguaTeste,
  recursoLiberado,
  seloPublicoAtivo,
  contaLiberada,
  limiteUnidades,
  type AssinaturaResumo,
  type RecursoOxyvra,
} from "@/lib/planos-oxyvra";

/** Assinatura da organização logada (cria o trial de 7 dias na primeira leitura). */
export function useAssinatura() {
  const carregar = useServerFn(obterAssinatura);
  const query = useQuery({
    queryKey: ["assinatura"],
    queryFn: () => carregar({ data: {} }),
    staleTime: 30_000,
  });

  const assinatura = (query.data ?? null) as AssinaturaResumo | null;

  return {
    ...query,
    assinatura,
    marcaDagua: exigeMarcaDaguaTeste(assinatura),
    seloAtivo: seloPublicoAtivo(assinatura),
    liberada: contaLiberada(assinatura),
    unidadesPermitidas: limiteUnidades(assinatura),
    temRecurso: (r: RecursoOxyvra) => recursoLiberado(assinatura, r),
  };
}
