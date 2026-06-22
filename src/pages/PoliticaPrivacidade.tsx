import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section style={{ marginBottom: 'var(--space-10)' }}>
    <h2 style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary)', marginBottom: 'var(--space-4)' }}>
      {title}
    </h2>
    <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, fontSize: 'var(--text-base)' }}>
      {children}
    </div>
  </section>
);

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ marginBottom: 'var(--space-4)' }}>{children}</p>
);

const Li: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li style={{ marginBottom: 'var(--space-2)', paddingLeft: 'var(--space-2)' }}>{children}</li>
);

export const PoliticaPrivacidade: React.FC = () => {
  const navigate = useNavigate();

  // navigate(-1) não funciona quando não há histórico (acesso direto à URL).
  // Fallback para /cadastro que é a origem mais comum deste link.
  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/cadastro');
    }
  }

  return (
    <div className="container" style={{ maxWidth: 800, paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-16)' }}>
      <Button variant="ghost" onClick={handleBack} style={{ marginBottom: 'var(--space-8)' }}>
        ← Voltar
      </Button>

      <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Política de Privacidade</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-10)', fontSize: 'var(--text-sm)' }}>
        Versão 1.0 — última atualização: junho de 2026
      </p>

      <Section title="1. Quem somos">
        <P>
          O VIGIL é um programa digital de treino cognitivo desenvolvido por Felipe Denuzzo
          ("nós", "nosso"). Este documento descreve como coletamos, usamos, armazenamos e
          protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de
          Dados Pessoais (LGPD — Lei nº 13.709/2018).
        </P>
      </Section>

      <Section title="2. Dados que coletamos">
        <P>Coletamos as seguintes categorias de dados:</P>
        <ul style={{ paddingLeft: 'var(--space-6)' }}>
          <Li><strong>Dados de identificação:</strong> endereço de e-mail, usado exclusivamente para autenticação via Firebase Authentication.</Li>
          <Li><strong>Dados de desempenho cognitivo:</strong> métricas geradas durante os treinos (tempo de reação, acurácia, número de tentativas, padrões de erro). Esses dados são classificados como <strong>dados de saúde</strong> nos termos do Art. 5º, II da LGPD e exigem consentimento explícito.</Li>
          <Li><strong>Laudos gerados por IA:</strong> relatórios de avaliação produzidos pelo modelo Gemini (Google) com base nos dados de desempenho, armazenados no Firebase Storage.</Li>
          <Li><strong>Dados técnicos:</strong> logs de acesso e erros, retidos automaticamente pelo Google Cloud Run por até 30 dias.</Li>
        </ul>
      </Section>

      <Section title="3. Como usamos seus dados">
        <ul style={{ paddingLeft: 'var(--space-6)' }}>
          <Li>Autenticação e acesso seguro à plataforma.</Li>
          <Li>Geração de laudos cognitivos personalizados via IA.</Li>
          <Li>Exibição do seu histórico de treinos.</Li>
          <Li>Melhoria contínua do produto (dados agregados e anonimizados).</Li>
          <Li>Envio de comunicações sobre novidades — <strong>apenas com seu consentimento opcional</strong>.</Li>
        </ul>
      </Section>

      <Section title="4. Base legal">
        <P>Tratamos seus dados com base nas seguintes hipóteses legais previstas na LGPD:</P>
        <ul style={{ paddingLeft: 'var(--space-6)' }}>
          <Li><strong>Consentimento (Art. 7º, I):</strong> para dados de desempenho cognitivo e laudos.</Li>
          <Li><strong>Execução de contrato (Art. 7º, V):</strong> para dados de autenticação.</Li>
          <Li><strong>Legítimo interesse (Art. 7º, IX):</strong> para logs técnicos de segurança.</Li>
        </ul>
      </Section>

      <Section title="5. Compartilhamento de dados">
        <P>Seus dados são processados pelos seguintes suboperadores:</P>
        <ul style={{ paddingLeft: 'var(--space-6)' }}>
          <Li><strong>Google Firebase</strong> (Authentication, Firestore, Storage) — armazenamento seguro na infraestrutura Google Cloud.</Li>
          <Li><strong>Google Gemini / Vertex AI</strong> — processamento dos dados de desempenho para geração dos laudos. Os dados são enviados ao modelo de IA para produção do relatório e não são usados para treinamento do modelo conforme os termos da API do Google.</Li>
          <Li><strong>Google Cloud Run</strong> — execução do serviço de avaliação (vigil-evaluator) na região southamerica-east1 (São Paulo).</Li>
        </ul>
        <P>Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins publicitários.</P>
      </Section>

      <Section title="6. Retenção dos dados">
        <ul style={{ paddingLeft: 'var(--space-6)' }}>
          <Li>Dados de autenticação: mantidos enquanto a conta estiver ativa.</Li>
          <Li>Histórico de sessões e laudos: mantidos por até 2 anos ou até a exclusão da conta.</Li>
          <Li>Logs técnicos: até 30 dias (política padrão do Google Cloud).</Li>
        </ul>
      </Section>

      <Section title="7. Seus direitos (LGPD Art. 18)">
        <P>Você tem direito a:</P>
        <ul style={{ paddingLeft: 'var(--space-6)' }}>
          <Li>Confirmar a existência de tratamento dos seus dados.</Li>
          <Li>Acessar os dados que temos sobre você.</Li>
          <Li>Corrigir dados incompletos ou desatualizados.</Li>
          <Li>Solicitar a anonimização, bloqueio ou eliminação dos dados.</Li>
          <Li>Revogar o consentimento a qualquer momento.</Li>
          <Li>Portabilidade dos dados a outro fornecedor.</Li>
        </ul>
        <P>
          Para exercer qualquer um desses direitos, entre em contato pelo e-mail:
          {' '}<strong>privacidade@vigil.app</strong>. Responderemos em até 15 dias úteis.
        </P>
      </Section>

      <Section title="8. Aviso sobre saúde">
        <P>
          <strong>O VIGIL é um programa de treino cognitivo e NÃO é um instrumento de diagnóstico clínico.</strong>
          Os laudos gerados por inteligência artificial têm caráter informativo e educativo.
          Eles não substituem avaliação neuropsicológica, psicológica ou médica realizada
          por profissional habilitado. Em caso de dúvidas sobre sua saúde cognitiva,
          consulte um profissional de saúde certificado.
        </P>
      </Section>

      <Section title="9. Segurança">
        <P>
          Adotamos medidas técnicas e organizacionais para proteger seus dados contra
          acesso não autorizado, incluindo: autenticação por e-mail/senha com Firebase Auth,
          comunicação exclusivamente via HTTPS, armazenamento em infraestrutura Google Cloud
          com criptografia em repouso e em trânsito, e controle de acesso por regras
          de segurança do Firestore.
        </P>
      </Section>

      <Section title="10. Alterações desta política">
        <P>
          Podemos atualizar esta política periodicamente. Em caso de alterações relevantes,
          notificaremos você por e-mail ou por aviso no aplicativo. A versão atual sempre
          estará disponível nesta página com a data da última atualização.
        </P>
      </Section>

      <Section title="11. Contato">
        <P>
          Controlador de dados: Felipe Denuzzo<br />
          E-mail: <strong>privacidade@vigil.app</strong>
        </P>
      </Section>

      <div style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: 'var(--space-8)',
        marginTop: 'var(--space-4)',
        color: 'var(--color-text-faint)',
        fontSize: 'var(--text-sm)',
        textAlign: 'center',
      }}>
        VIGIL — Política de Privacidade v1.0 — Lei nº 13.709/2018 (LGPD)
      </div>
    </div>
  );
};
