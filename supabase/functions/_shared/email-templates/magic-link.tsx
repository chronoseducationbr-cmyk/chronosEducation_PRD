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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>O seu link de acesso — Chronos Education</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={logoUrl} alt="Chronos Education" height="36" style={{ margin: '0 auto' }} />
        </Section>
        <Section style={accentBar} />
        <Section style={content}>
          <Heading style={h1}>O seu link de acesso</Heading>
          <Text style={text}>
            Clique no botão abaixo para acessar a sua conta na Chronos Education.
            Este link expira em breve.
          </Text>
          <Section style={{ textAlign: 'center' }}>
            <Button style={button} href={confirmationUrl}>
              Acessar Conta
            </Button>
          </Section>
          <Text style={footer}>
            Se não solicitou este link, ignore este email.<br />
            Este é um email automático. Não responda!
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const logoUrl = 'https://qqgfqjpgxoourayjlrwc.supabase.co/storage/v1/object/public/email-assets/chronos-logo-header.png'
const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto' }
const header = { backgroundColor: '#042D45', padding: '32px 40px', borderRadius: '16px 16px 0 0', textAlign: 'center' as const }
const accentBar = { background: 'linear-gradient(135deg, #80ff00 0%, #6de600 100%)', height: '4px', fontSize: '0px', lineHeight: '0px' }
const content = { backgroundColor: '#f7f8f9', padding: '40px', borderRadius: '0 0 16px 16px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#042D45', margin: '0 0 20px', fontFamily: "'Playfair Display', Georgia, serif" }
const text = { fontSize: '15px', color: '#476878', lineHeight: '1.6', margin: '0 0 25px' }
const button = { backgroundColor: '#80ff00', color: '#042D45', fontSize: '14px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none', display: 'inline-block' as const }
const footer = { fontSize: '12px', color: '#9aa8b5', margin: '30px 0 0' }
