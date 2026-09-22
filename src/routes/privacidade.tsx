import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Mail, Lock, MapPin, Camera, FileText, User, Database } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Oxyvra Biossegurança" },
      {
        name: "description",
        content:
          "Política de Privacidade da Oxyvra Biossegurança. Saiba como tratamos seus dados pessoais e de localização conforme a LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — Oxyvra Biossegurança" },
      {
        property: "og:description",
        content: "Transparência no tratamento de dados pessoais e de localização.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-secondary px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-navy">Política de Privacidade</h1>
          <p className="text-sm text-navy/60 mt-1">Oxyvra Biossegurança — LGPD / Lei nº 13.709/2018</p>
          <p className="text-xs text-navy/50 mt-0.5">Última atualização: 11 de agosto de 2026</p>
        </div>

        <section className="rounded-2xl border border-navy/10 bg-white p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">1. Quem somos</h2>
              <p className="text-sm text-navy/70 mt-1 leading-relaxed">
                A Oxyvra Biossegurança é uma plataforma de gestão e auditoria de higienização de ambientes coletivos. Somos a controladora dos dados pessoais tratados por meio deste aplicativo e site.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">2. Dados que coletamos</h2>
              <ul className="text-sm text-navy/70 mt-1 space-y-1 list-disc pl-4 leading-relaxed">
                <li><strong>E-mail e nome:</strong> para autenticação e identificação do responsável técnico.</li>
                <li><strong>Localização precisa:</strong> apenas durante o registro do serviço, para validar presença na unidade contratada (geofencing de 150 m).</li>
                <li><strong>Fotos da câmera:</strong> capturadas ao vivo como evidência da higienização. Não acessamos a galeria do dispositivo.</li>
                <li><strong>Metadados técnicos:</strong> data/hora, IP aproximado, hash de hardware e coordenadas GPS para compor o laudo de auditoria.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">3. Finalidade do tratamento</h2>
              <p className="text-sm text-navy/70 mt-1 leading-relaxed">
                Os dados são usados exclusivamente para: (i) identificar o responsável pela execução do serviço; (ii) comprovar que a higienização ocorreu no local e horário corretos; (iii) gerar relatórios e laudos auditáveis para contratos públicos e privados; (iv) manter o histórico de conformidade exigido por órgãos reguladores e normas técnicas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">4. Compartilhamento</h2>
              <p className="text-sm text-navy/70 mt-1 leading-relaxed">
                Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins publicitários. Os dados de auditoria são acessíveis apenas ao contratante da unidade e aos gestores por ele autorizados. Informações agregadas e anonimizadas podem compor selos públicos de transparência (ex.: selo Oxyvra Safe).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">5. Localização e câmera</h2>
              <p className="text-sm text-navy/70 mt-1 leading-relaxed">
                A localização e a câmera são solicitadas <strong>apenas no momento do registro do serviço</strong>. Não há rastreamento em segundo plano, não acessamos a galeria de fotos e não utilizamos esses dados para publicidade ou perfilamento.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">6. Retenção e segurança</h2>
              <p className="text-sm text-navy/70 mt-1 leading-relaxed">
                Os registros de higienização são mantidos pelo prazo necessário ao cumprimento das obrigações contratuais e legais (incluindo ANVISA e normas ISO), podendo ser arquivados de forma append-only e imutável para garantir a cadeia de auditoria. Utilizamos criptografia em trânsito (HTTPS/TLS) e controle de acesso por autenticação.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">7. Seus direitos (LGPD)</h2>
              <p className="text-sm text-navy/70 mt-1 leading-relaxed">
                Você pode solicitar acesso, correção, anonimização, bloqueio ou eliminação dos seus dados pessoais, exceto quando a manutenção for necessária para cumprimento de obrigação legal ou exercício de direito em processo judicial. Para exercer seus direitos, envie um e-mail para o canal abaixo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-gold mt-0.5 shrink-0" />
            <div>
              <h2 className="font-black text-navy">8. Contato</h2>
              <p className="text-sm text-navy/70 mt-1 leading-relaxed">
                Dúvidas, solicitações ou reclamações sobre privacidade podem ser enviadas para: <strong>suporte@oxyvra.com</strong>
              </p>
            </div>
          </div>
        </section>

        <div className="text-center">
          <Link to="/" className="text-xs font-bold text-navy/60 underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
