import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { brand, brandSub, brandText, button, container, darkModeCss, footer, h1, main, textDark } from "./_estilo";

interface EmailChangeEmailProps {
  siteName: string;
  oldEmail: string;
  email: string;
  newEmail: string;
  confirmationUrl: string;
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Confirme seu novo e-mail no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandText}>OXYVRA</Text>
          <Text style={brandSub}>Biossegurança e conformidade sanitária</Text>
        </Section>
        <Heading style={h1}>Confirme seu novo e-mail</Heading>
        <Text style={textDark}>
          Recebemos um pedido para trocar o e-mail da conta no {siteName} de {oldEmail || email} para{" "}
          {newEmail || email}. Confirme clicando no botão abaixo.
        </Text>
        <Button className="dm-btn" style={button} href={confirmationUrl}>
          Confirmar novo e-mail
        </Button>
        <Text style={footer}>Se você não pediu esta troca, ignore este e-mail.</Text>
      </Container>
    </Body>
  </Html>
);

export default EmailChangeEmail;
