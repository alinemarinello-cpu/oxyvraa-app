import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { brand, brandSub, brandText, codigo, container, darkModeCss, footer, h1, main, textDark } from "./_estilo";

interface ReauthenticationEmailProps {
  token: string;
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Seu código de verificação Oxyvra</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandText}>OXYVRA</Text>
          <Text style={brandSub}>Biossegurança e conformidade sanitária</Text>
        </Section>
        <Heading style={h1}>Seu código de verificação</Heading>
        <Text style={textDark}>Use o código abaixo para confirmar esta ação na sua conta.</Text>
        <Text style={codigo}>{token}</Text>
        <Text style={footer}>Se você não solicitou este código, ignore este e-mail.</Text>
      </Container>
    </Body>
  </Html>
);

export default ReauthenticationEmail;
