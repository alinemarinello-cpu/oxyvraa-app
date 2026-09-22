import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { brand, brandSub, brandText, button, container, darkModeCss, footer, h1, main, textDark } from "./_estilo";

interface MagicLinkEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Seu link de acesso ao {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandText}>OXYVRA</Text>
          <Text style={brandSub}>Biossegurança e conformidade sanitária</Text>
        </Section>
        <Heading style={h1}>Seu link de acesso</Heading>
        <Text style={textDark}>
          Clique no botão abaixo para entrar no {siteName}. O link é pessoal e vale por tempo limitado.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Entrar agora
        </Button>
        <Text style={footer}>Se você não pediu este acesso, ignore este e-mail.</Text>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;
