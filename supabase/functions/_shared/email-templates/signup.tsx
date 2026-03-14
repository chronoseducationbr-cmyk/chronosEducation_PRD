/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme o seu email — Chronos Education</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={logoUrl} alt="Chronos Education" height="36" style={{ margin: '0 auto' }} />
        </Section>
        <Section style={accentBar} />
        <Section style={content}>
          <Heading style={h1}>Confirme o seu email</Heading>
          <Text style={text}>
            Obrigado por se registrar na{' '}
            <Link href={siteUrl} style={link}>
              <strong>Chronos Education</strong>
            </Link>
            !
          </Text>
          <Text style={text}>
            Por favor, confirme o seu endereço de email (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) clicando no botão abaixo:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Confirmar Email
          </Button>
          <Text style={footer}>
            Se não criou uma conta, pode ignorar este email com segurança.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const logoUrl = 'https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png'
const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#042D45', padding: '32px 40px', borderRadius: '16px 16px 0 0', textAlign: 'center' as const }
const accentBar = { background: 'linear-gradient(135deg, #80ff00 0%, #6de600 100%)', height: '4px', fontSize: '0px', lineHeight: '0px' }
const content = { backgroundColor: '#f7f8f9', padding: '40px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#042D45', margin: '0 0 20px', fontFamily: "'Playfair Display', Georgia, serif" }
const text = { fontSize: '15px', color: '#476878', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: '#042D45', textDecoration: 'underline' }
const button = { backgroundColor: '#80ff00', color: '#042D45', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#9aa8b5', margin: '30px 0 0' }
