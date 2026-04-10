import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <main
      className="container container--narrow"
      style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', paddingBlock: 'var(--space-10)' }}
    >
      <section
        style={{
          width: '100%',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-8)',
          display: 'grid',
          gap: 'var(--space-4)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-xl)' }}>Essa pagina nao foi encontrada</h1>
        <p style={{ color: 'var(--color-text-muted)', marginInline: 'auto' }}>
          Talvez o link esteja incompleto ou a pagina tenha sido movida.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button onClick={() => navigate('/')}>Ir para o inicio</Button>
        </div>
      </section>
    </main>
  );
}
