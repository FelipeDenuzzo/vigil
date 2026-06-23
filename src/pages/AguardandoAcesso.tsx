// src/pages/AguardandoAcesso.tsx
// Tela exibida para usuários cadastrados mas ainda sem aprovação.
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function AguardandoAcesso() {
  const { user, accessStatus, logout, refreshAccess } = useAuth();
  const navigate = useNavigate();

  // Se o acesso foi aprovado (ex: admin aprovou em outra aba), redireciona.
  useEffect(() => {
    if (accessStatus === 'approved') navigate('/treinar', { replace: true });
  }, [accessStatus, navigate]);

  async function handleRefresh() {
    await refreshAccess();
  }

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <div style={{
      maxWidth: 480,
      margin: '80px auto',
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-6)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 56 }}>⏳</div>

      <div>
        <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>
          Conta criada com sucesso!
        </h1>
        <p style={{ color: '#ffffff', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          Sua conta está sendo analisada. Assim que o acesso for liberado,
          você poderá entrar normalmente.
        </p>
      </div>

      {user?.email && (
        <div style={{
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--text-sm)',
          color: '#ffffff',
          width: '100%',
        }}>
          Conta registrada como <strong style={{ color: 'var(--color-text)' }}>{user.email}</strong>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
        <button
          onClick={handleRefresh}
          style={{
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: 'white',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Verificar acesso
        </button>

        <button
          onClick={handleLogout}
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: '#ffffff',
            fontSize: 'var(--text-sm)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
          }}
        >
          Sair
        </button>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', lineHeight: 1.6 }}>
        Se tiver dúvidas, entre em contato pelo e-mail{' '}
        <a
          href="mailto:contato@vigil.app"
          style={{ color: 'var(--color-text-faint)', textDecoration: 'underline' }}
        >
          contato@vigil.app
        </a>
      </p>
    </div>
  );
}
