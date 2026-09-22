import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { brand, brandSub, brandText, button, container, darkModeCss, footer, h1, main, textDark } from "./_estilo";

interface SignupEmailProps {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
}

export const SignupEmail = ({ siteName, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirme seu e-mail para ativar a conta no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandText}>OXYVRA</Text>
          <Text style={brandSub}>Biossegurança e conformidade sanitária</Text>
        </Section>
        <Heading style={h1}>Confirme seu e-mail</Heading>
        <Text style={textDark}>
          Boas-vindas ao {siteName}. Para ativar a conta de {recipient}, confirme o e-mail clicando no
          botão abaixo.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirmar meu e-mail
        </Button>
        <Text style={footer}>
          Se você não criou esta conta, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default SignupEmail;
