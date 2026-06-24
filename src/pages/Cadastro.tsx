import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../lib/firebase';
import db from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import {
  saveConsent,
  saveConsentToFirestore,
  POLICY_VERSION,
  type ConsentRecord,
} from '../lib/useConsent';

// ┓ Estilos inline reutilizáveis ┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓
const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  fontSize: 'var(--text-base)',
  background: 'var(--color-surface-2)',
  color: 'var(--color-text)',
  width: '100%',
  boxSizing: 'border-box',
};

const checkRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 'var(--space-3)',
  padding: 'var(--space-4)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  cursor: 'pointer',
};

const checkboxStyle: React.CSSProperties = {
  marginTop: 2,
  width: 18,
  height: 18,
  flexShrink: 0,
  accentColor: 'var(--color-primary)',
  cursor: 'pointer',
};

// ┓ Modal LGPD ┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓
interface LgpdModalProps {
  onAccept: (record: ConsentRecord) => void;
  onCancel: () => void;
}

function LgpdModal({ onAccept, onCancel }: LgpdModalProps) {
  const [terms,          setTerms]          = useState(false);
  const [privacyPolicy,  setPrivacyPolicy]  = useState(false);
  const [healthData,     setHealthData]     = useState(false);
  const [communications, setCommunications] = useState(false);

  const mandatoryOk = terms && privacyPolicy && healthData;

  function handleAccept() {
    const record: ConsentRecord = {
      version:        POLICY_VERSION,
      acceptedAt:     new Date().toISOString(),
      terms,
      privacyPolicy,
      healthData,
      communications,
    };
    onAccept(record);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        maxWidth: 560,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
            💊 Privacidade e consentimento
          </h2>
          <p style={{ color: '#ffffff', fontSize: 'var(--text-sm)', lineHeight: 1.6 }}>
            Antes de criar sua conta, leia e aceite os termos abaixo. Os itens marcados com
            {' '}<span style={{ color: '#f08080' }}>*</span> são obrigatórios para o funcionamento do VIGIL.
          </p>
        </div>

        <div style={{
          background: 'rgba(240,128,128,0.08)',
          border: '1px solid rgba(240,128,128,0.25)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          fontSize: 'var(--text-sm)',
          color: '#ffffff',
          lineHeight: 1.6,
        }}>
          ♠<strong style={{ color: 'var(--color-text)' }}>Aviso importante:</strong> O VIGIL é um
          programa de treino cognitivo e <strong>não é um instrumento de diagnóstico clínico</strong>.
          Os relatórios gerados por IA têm caráter informativo e não substituem avaliação por
          profissional de saúde habilitado.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>

          <label style={checkRowStyle}>
            <input type="checkbox" style={checkboxStyle} checked={terms} onChange={e => setTerms(e.target.checked)} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6 }}>
              <span style={{ color: '#f08080' }}>*</span>{' '}
              Li e aceito os <strong>Termos de Uso</strong> do VIGIL. Entendo que se trata
              de um programa de treino cognitivo para fins educativos, sem fins diagnósticos.
            </span>
          </label>

          <label style={checkRowStyle}>
            <input type="checkbox" style={checkboxStyle} checked={privacyPolicy} onChange={e => setPrivacyPolicy(e.target.checked)} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6 }}>
              <span style={{ color: '#f08080' }}>*</span>{' '}
              Li e aceito a{' '}
              <Link
                to="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-primary)' }}
                onClick={e => e.stopPropagation()}
              >
                Política de Privacidade
              </Link>
              , incluindo o armazenamento do meu e-mail nos servidores do Google Firebase.
            </span>
          </label>

          <label style={{
            ...checkRowStyle,
            border: '1px solid rgba(108,142,245,0.35)',
            background: 'rgba(108,142,245,0.06)',
          }}>
            <input type="checkbox" style={checkboxStyle} checked={healthData} onChange={e => setHealthData(e.target.checked)} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.6 }}>
              <span style={{ color: '#f08080' }}>*</span>{' '}
              <strong>Consinto</strong> que o VIGIL colete e processe meus{' '}
              <strong>dados de desempenho cognitivo</strong> (tempo de reação, acurácia,
              padrões de erro) para gerar relatórios informativos por inteligência artificial.
              Esses dados são tratados como <strong>dados de saúde</strong> conforme a LGPD
              (Art. 5º, II) e serão processados pelo modelo Gemini (Google). Posso
              revogar este consentimento a qualquer momento pelo e-mail privacidade@vigil.app.
            </span>
          </label>

          <label style={{ ...checkRowStyle, opacity: 0.85 }}>
            <input type="checkbox" style={checkboxStyle} checked={communications} onChange={e => setCommunications(e.target.checked)} />
            <span style={{ fontSize: 'var(--text-sm)', color: '#ffffff', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--color-text-faint)', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Opcional —  </span>
              Aceito receber e-mails sobre novidades, atualizações e dicas do VIGIL.
              Posso cancelar a qualquer momento.
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: '#ffffff',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!mandatoryOk}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: mandatoryOk ? 'var(--color-primary)' : 'var(--color-surface-offset)',
              color: mandatoryOk ? 'white' : 'var(--color-text-faint)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              cursor: mandatoryOk ? 'pointer' : 'not-allowed',
              transition: 'var(--transition)',
            }}
          >
            Aceitar e criar conta
          </button>
        </div>

        <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', textAlign: 'center' }}>
          Ao aceitar, você concorda com o tratamento conforme a LGPD (Lei nº 13.709/2018).
          Registro de consentimento salvo localmente e no servidor com data e versão da política.
        </p>
      </div>
    </div>
  );
}

// ┓ Página de cadastro ┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓┓
export default function Cadastro() {
  const [nome,     setNome]     = useState('');
  const [idade,    setIdade]    = useState('');
  const [email,     setEmail]     = useState('');
  const [senha,     setSenha]     = useState('');
  const [erro,      setErro]      = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!nome.trim()) { setErro('Preencha seu nome.'); return; }
    const idadeNum = Number(idade);
    if (!idade || idadeNum < 5 || idadeNum > 120) { setErro('Informe uma idade válida (5 a 120).'); return; }
    if (!email || !senha || senha.length < 6) {
      setErro('Preencha o e-mail e uma senha com mínimo 6 caracteres.');
      return;
    }
    setShowModal(true);
  }

  async function handleConsentAccepted(record: ConsentRecord) {
    setShowModal(false);
    setLoading(true);
    setErro('');
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = credential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        nome: nome.trim(),
        idade: Number(idade),
        email,
        accessStatus: 'pending',
        role: 'user',
        createdAt: serverTimestamp(),
      });

      saveConsent(record);
      await saveConsentToFirestore(uid, record);

      navigate('/aguardando-acesso');
    } catch (error: any) {
      const code = error?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setErro('Este e-mail já está cadastrado. Faça login.');
      } else if (code === 'auth/invalid-email') {
        setErro('Endereço de e-mail inválido.');
      } else if (code === 'auth/weak-password') {
        setErro('Senha muito fraca. Use ao menos 6 caracteres.');
      } else {
        setErro('Erro ao cadastrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {showModal && (
        <LgpdModal
          onAccept={handleConsentAccepted}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 24px' }}>
        <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>Criar conta</h1>
        <p style={{ color: '#ffffff', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-8)' }}>
          Crie sua conta para começar a treinar. Você precisará aceitar os termos de uso
          e a política de privacidade antes de continuar.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Idade"
            value={idade}
            onChange={e => setIdade(e.target.value)}
            min={5}
            max={120}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Senha (mínimo 6 caracteres)"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          {erro && (
            <p style={{
              color: '#f08080',
              fontSize: 'var(--text-sm)',
              padding: 'var(--space-3)',
              background: 'rgba(240,128,128,0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(240,128,128,0.2)',
            }}>
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: loading ? 'var(--color-surface-offset)' : 'var(--color-primary)',
              color: 'white',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {loading ? 'Criando conta…' : 'Continuar'}
          </button>
        </form>

        <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: '#ffffff' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)' }}>Entrar</Link>
        </p>

        <p style={{ marginTop: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          Ao criar sua conta, você será solicitado a aceitar nossa{' '}
          <Link to="/privacidade" style={{ color: 'var(--color-text-faint)', textDecoration: 'underline' }}>
            Política de Privacidade
          </Link>
          {' '}conforme a LGPD (Lei nº 13.709/2018).
        </p>
      </div>
    </>
  );
}
