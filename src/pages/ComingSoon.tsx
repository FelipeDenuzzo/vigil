import { Link } from 'react-router-dom';

export function ComingSoon() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100dvh',
      backgroundColor: 'var(--color-bg)',
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(108, 142, 245, 0.15) 0%, transparent 60%)',
      padding: '24px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Glows */}
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'rgba(167, 108, 245, 0.1)',
        filter: 'blur(80px)',
        top: '10%',
        left: '15%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'rgba(245, 108, 158, 0.08)',
        filter: 'blur(80px)',
        bottom: '20%',
        right: '15%',
        pointerEvents: 'none'
      }} />

      {/* Main Card Content */}
      <div style={{
        maxWidth: '640px',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo Icon / Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
          animation: 'fadeIn 1s ease-out'
        }}>
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--color-primary)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 8px var(--color-primary-glow))' }}
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ffffff 30%, var(--color-primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
          }}>
            VIGIL
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 800,
          color: '#ffffff',
          lineHeight: '1.15',
          letterSpacing: '-0.02em',
          marginBottom: '20px',
        }}>
          Treine e acompanhe a sua <span style={{ color: 'var(--color-primary)' }}>atenção</span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)',
          color: 'rgba(232, 233, 240, 0.75)',
          fontSize: '1.2rem',
          lineHeight: '1.6',
          maxWidth: '520px',
          marginBottom: '40px',
          textWrap: 'pretty'
        }}>
          Uma plataforma baseada em evidências clínicas para exercitar o controle inibitório, foco e flexibilidade cognitiva com análise de IA.
        </p>

        {/* Buttons Action Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          width: '100%',
          maxWidth: '480px',
        }}>
          {/* Button: Acessar Meu Treino (Primary) */}
          <Link
            to="/login"
            style={{
              flex: '1 1 200px',
              padding: '16px 28px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-active) 100%)',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.05rem',
              boxShadow: '0 4px 20px rgba(108, 142, 245, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
              transition: 'transform 0.2s, filter 0.2s, box-shadow 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(108, 142, 245, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.filter = 'none';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(108, 142, 245, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
          >
            Acessar meu treino
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Button: Cadastrar (Secondary/Outline) */}
          <Link
            to="/cadastro"
            style={{
              flex: '1 1 200px',
              padding: '16px 28px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1.05rem',
              transition: 'transform 0.2s, background-color 0.2s, border-color 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            Criar conta
          </Link>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        fontFamily: 'var(--font-body)',
        fontSize: '0.85rem',
        color: 'var(--color-text-faint)',
        display: 'flex',
        gap: '16px'
      }}>
        <span>Vigil © 2026</span>
        <span>•</span>
        <Link to="/privacidade" style={{ textDecoration: 'underline', color: 'inherit' }}>
          Política de Privacidade
        </Link>
      </div>
    </div>
  );
}
