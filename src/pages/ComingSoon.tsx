import { Link } from 'react-router-dom';

export function ComingSoon() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: 'var(--color-background)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        color: 'var(--color-primary)', 
        fontSize: '3rem', 
        marginBottom: '1rem' 
      }}>
        Em breve
      </h1>
      <p style={{ 
        color: 'var(--color-text)', 
        fontSize: '1.2rem',
        marginBottom: '2rem',
        maxWidth: '500px',
        lineHeight: '1.5'
      }}>
        Uma nova forma de treinar e acompanhar sua atenção está chegando.
      </p>
      <Link 
        to="/cadastro" 
        style={{ 
          padding: '12px 24px', 
          backgroundColor: 'var(--color-primary)', 
          color: '#fff', 
          borderRadius: '8px', 
          textDecoration: 'none', 
          fontWeight: 'bold',
          fontSize: '1.1rem',
          transition: 'opacity 0.2s'
        }}
      >
        Ir para o Cadastro
      </Link>
    </div>
  );
}
