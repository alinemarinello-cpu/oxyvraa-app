import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { OxyvraLogo } from "@/components/OxyvraLogo";
import {
  obterResponsavelConta,
  salvarResponsavelConta,
} from "@/lib/compliance.functions";
import { PassosOnboarding, campoCls, rotuloCls } from "@/components/OnboardingPassos";

export const Route = createFileRoute("/_authenticated/onboarding/step-1")({
  head: () => ({
    meta: [
      { title: "Cadastro rápido — Oxyvra Conformidade" },
      {
        name: "description",
        content:
          "Comece em 1 minuto: informe nome, e-mail, WhatsApp e CNPJ/CPF para liberar o teste grátis de 7 dias do Oxyvra Conformidade.",
      },
      { property: "og:title", content: "Cadastro rápido — Oxyvra Conformidade" },
      {
        property: "og:description",
        content: "Primeiro passo do onboarding da conformidade sanitária da sua clínica.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Etapa1,
});

/** Máscara de WhatsApp no formato brasileiro. */
function mascaraWhatsapp(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Máscara de CPF (11 dígitos) ou CNPJ (14 dígitos). */
function mascaraDocumento(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function Etapa1() {
  const navigate = useNavigate();
  const ler = useServerFn(obterResponsavelConta);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [documento, setDocumento] = useState("");

  const { data } = useQuery({
    queryKey: ["responsavel-conta"],
    queryFn: () => ler({ data: {} }),
  });

  useEffect(() => {
    if (!data) return;
    const d = data as Record<string, string | null>;
    setNome((v) => v || (d.responsavel_nome ?? ""));
    setEmail((v) => v || (d.responsavel_email ?? d.email_contato ?? ""));
    setWhatsapp((v) => v || mascaraWhatsapp(d.responsavel_telefone ?? ""));
    setDocumento((v) => v || mascaraDocumento(d.cnpj ?? d.responsavel_cpf ?? ""));
  }, [data]);

  const salvar = useMutation({
    mutationFn: salvarResponsavelConta,
    onSuccess: () => navigate({ to: "/onboarding/step-2" }),
    onError: (e: Error) => toast.error(e.message || "Não foi possível salvar seus dados."),
  });

  const enviar = () => {
    if (nome.trim().length < 3) return toast.error("Informe seu nome completo.");
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email.trim()))
      return toast.error("Informe um e-mail válido.");
    if (whatsapp.replace(/\D/g, "").length < 10)
      return toast.error("Informe o WhatsApp com DDD.");
    const doc = documento.replace(/\D/g, "");
    if (doc.length !== 11 && doc.length !== 14)
      return toast.error("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).");

    const somenteCnpj = doc.length === 14;
    salvar.mutate({
      data: {
        responsavel_nome: nome.trim(),
        responsavel_email: email.trim(),
        responsavel_telefone: whatsapp,
        email_contato: email.trim(),
        ...(somenteCnpj ? { cnpj: documento } : { responsavel_cpf: documento }),
      },
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 px-4 py-8">
      <OxyvraLogo className="h-10" />
      <PassosOnboarding atual={1} />

      <h1 className="text-2xl font-black text-foreground">Vamos começar pelo básico</h1>
      <p className="text-sm text-muted-foreground">
        São 3 passos rápidos. No fim você ativa 7 dias grátis, sem cartão de crédito.
      </p>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <label className={rotuloCls}>Nome completo</label>
          <input
            className={campoCls}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className={rotuloCls}>E-mail</label>
          <input
            className={campoCls}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className={rotuloCls}>WhatsApp</label>
          <input
            className={campoCls}
            inputMode="tel"
            placeholder="(11) 99999-9999"
            value={whatsapp}
            onChange={(e) => setWhatsapp(mascaraWhatsapp(e.target.value))}
          />
        </div>
        <div>
          <label className={rotuloCls}>CNPJ ou CPF</label>
          <input
            className={campoCls}
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            value={documento}
            onChange={(e) => setDocumento(mascaraDocumento(e.target.value))}
          />
        </div>

        <button
          onClick={enviar}
          disabled={salvar.isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal text-sm font-black text-teal-foreground disabled:opacity-60"
        >
          {salvar.isPending ? "Salvando…" : "Continuar"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
