import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { brand, brandSub, brandText, button, container, darkModeCss, footer, h1, main, textDark } from "./_estilo";

interface RecoveryEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Criar uma nova senha no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandText}>OXYVRA</Text>
          <Text style={brandSub}>Biossegurança e conformidade sanitária</Text>
        </Section>
        <Heading style={h1}>Criar uma nova senha</Heading>
        <Text style={textDark}>
          Recebemos um pedido para redefinir a senha da sua conta no {siteName}. Clique no botão abaixo
          para escolher uma nova senha.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Criar nova senha
        </Button>
        <Text style={footer}>
          Se você não pediu a troca de senha, pode ignorar este e-mail — sua senha continua a mesma.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default RecoveryEmail;
