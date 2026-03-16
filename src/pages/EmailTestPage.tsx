import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const EmailTestPage = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  const emailTypes = [
    { id: 'signup', label: 'Confirmação de Email' },
    { id: 'recovery', label: 'Recuperação de Senha' },
    { id: 'invite', label: 'Convite' },
    { id: 'magiclink', label: 'Magic Link' },
    { id: 'email_change', label: 'Mudança de Email' },
  ];

  const loadPreview = async (type: string) => {
    setLoading(type);
    setPreviewType(type);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-email-hook/preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_LOVABLE_API_KEY || ''}`,
          },
          body: JSON.stringify({ type }),
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load preview');
      }
      
      const html = await response.text();
      setPreviewHtml(html);
    } catch (error) {
      console.error('Error loading preview:', error);
      // Fallback: mostra mensagem indicando que precisa de API key
      setPreviewHtml(`
        <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
          <h2>Preview não disponível</h2>
          <p>Para visualizar os templates, use a opção "Preview email" no painel Cloud.</p>
          <p>Tipo selecionado: ${type}</p>
        </div>
      `);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <SEOHead
        title="Testar Emails — Chronos Education"
        description="Visualizar templates de email"
        canonical="/test-emails"
      />
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Testar Templates de Email</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Selecionar Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emailTypes.map((type) => (
                  <Button
                    key={type.id}
                    variant={previewType === type.id ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => loadPreview(type.id)}
                    disabled={loading === type.id}
                  >
                    {loading === type.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {type.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    style={{ width: '100%', height: '600px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    title="Email Preview"
                  />
                ) : (
                  <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                    Selecione um template para visualizar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailTestPage;
