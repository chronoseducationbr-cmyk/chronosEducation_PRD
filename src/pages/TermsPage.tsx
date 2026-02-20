import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import chronosLogo from "@/assets/chronos-logo-header.png";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary border-b border-primary-foreground/10 py-4 px-4 md:px-8">
        <div className="container-narrow flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={chronosLogo} alt="Chronos Education" className="h-8" />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar ao início
          </Link>
        </div>
      </header>

      <main className="container-narrow py-12 md:py-20 px-4 md:px-8">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-8">
          Termos e Condições
        </h1>

        <div className="prose prose-sm max-w-none text-foreground/80 space-y-8 text-justify">
          <p className="text-muted-foreground text-sm">
            Última atualização: {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">1. Objeto</h2>
            <p>
              Os presentes Termos e Condições regulam a utilização dos serviços educacionais oferecidos pela Chronos Education
              no âmbito do programa Dual Diploma, que permite aos alunos brasileiros obter simultaneamente o diploma
              de ensino médio brasileiro e o High School Diploma norte-americano.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">2. Inscrição e Matrícula</h2>
            <p>
              A inscrição no programa está sujeita à análise e aprovação da equipa pedagógica da Chronos Education.
              A matrícula é formalizada mediante o pagamento da taxa de inscrição e a assinatura do contrato
              de prestação de serviços educacionais.
            </p>
            <p>
              O responsável legal do aluno menor de 18 anos deverá assinar todos os documentos necessários
              para a efetivação da matrícula.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">3. Pagamentos</h2>
            <p>
              Os valores referentes à matrícula e às mensalidades serão informados no ato da inscrição e
              deverão ser pagos nas datas de vencimento estabelecidas. O atraso no pagamento poderá acarretar
              a suspensão do acesso à plataforma de estudos.
            </p>
            <p>
              Eventuais reajustes anuais serão comunicados com antecedência mínima de 30 (trinta) dias.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">4. Obrigações do Aluno</h2>
            <p>O aluno compromete-se a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cumprir as atividades e avaliações dentro dos prazos estabelecidos;</li>
              <li>Manter uma postura ética e respeitosa nas interações com professores e colegas;</li>
              <li>Não compartilhar credenciais de acesso à plataforma com terceiros;</li>
              <li>Manter os seus dados cadastrais atualizados.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo disponibilizado na plataforma, incluindo textos, vídeos, imagens e materiais
              didáticos, é de propriedade exclusiva da Chronos Education ou dos seus parceiros, sendo proibida a
              reprodução, distribuição ou comercialização sem autorização prévia por escrito.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">6. Cancelamento e Reembolso</h2>
            <p>
              O aluno poderá solicitar o cancelamento da matrícula a qualquer momento. O reembolso será
              calculado proporcionalmente ao período utilizado, descontadas eventuais taxas administrativas,
              conforme previsto no contrato de prestação de serviços.
            </p>
            <p>
              Solicitações de cancelamento devem ser realizadas por escrito através do email
              contato@chronoseducation.com.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">7. Proteção de Dados</h2>
            <p>
              A Chronos Education compromete-se a tratar os dados pessoais dos alunos e responsáveis em conformidade
              com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Os dados recolhidos serão
              utilizados exclusivamente para fins educacionais e administrativos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>
              A Chronos Education não se responsabiliza por interrupções no serviço causadas por fatores externos,
              incluindo falhas de internet, problemas técnicos de terceiros ou eventos de força maior.
              A empresa envidará todos os esforços para garantir a continuidade e qualidade do serviço.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">9. Alterações aos Termos</h2>
            <p>
              A Chronos Education reserva-se o direito de alterar estes Termos e Condições a qualquer momento,
              mediante comunicação prévia aos utilizadores. A continuidade na utilização dos serviços
              após a notificação constitui aceitação das alterações.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">10. Foro</h2>
            <p>
              Para a resolução de eventuais litígios decorrentes dos presentes Termos e Condições,
              fica eleito o foro da comarca de São Paulo, Estado de São Paulo, Brasil,
              com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-border">
            <p className="text-muted-foreground text-sm">
              Em caso de dúvidas sobre estes Termos e Condições, entre em contacto connosco através do
              email{" "}
              <a href="mailto:contato@chronoseducation.com" className="text-secondary-contrast hover:underline">
                contato@chronoseducation.com
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
