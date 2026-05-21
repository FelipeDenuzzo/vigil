import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import VisualSearchHunt from './games/VisualSearchHunt/VisualSearchHunt';
import VisualSearchEvaluationScreen from './games/VisualSearchHunt/VisualSearchEvaluationScreen';

type ActiveGame = 'visual-search-hunt' | 'evaluation' | null;

export const SelectiveHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = React.useState<ActiveGame>(null);

  const [lastResultSessionId, setLastResultSessionId] = React.useState<string | null>(null);

  const handleEnd = (result: any) => {
    // result should be a GameResult; keep backward compatibility if only sessionId provided
    const sessionId = result?.sessionId ?? (result && typeof result === 'object' ? result.sessionId : null);
    if (sessionId) {
      setLastResultSessionId(sessionId);
      setActiveGame('evaluation');
      return;
    }

    // fallback: close the game view
    setActiveGame(null);
  };

  if (activeGame === 'visual-search-hunt') {
    return (
      <div
        className="container"
        style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}
      >
        <Button
          variant="ghost"
          onClick={() => setActiveGame(null)}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← Voltar
        </Button>

        <VisualSearchHunt onEnd={handleEnd} />
      </div>
    );
  }

  if (activeGame === 'evaluation' && lastResultSessionId) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
        <Button variant="ghost" onClick={() => setActiveGame(null)} style={{ marginBottom: 'var(--space-4)' }}>
          ← Voltar
        </Button>

        <VisualSearchEvaluationScreen sessionId={lastResultSessionId} onClose={() => setActiveGame(null)} />
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}
    >
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button
          variant="ghost"
          onClick={() => navigate('/treinar')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← Voltar
        </Button>

        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-selective)' }}>
          Atenção Seletiva
        </h1>

        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Esta modalidade treina sua capacidade de se concentrar em um único estímulo,
          ignorando distrações e informações irrelevantes ao redor.
        </p>
      </header>

      <section>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <Card
            interactive
            accent="var(--color-selective)"
            onClick={() => setActiveGame('visual-search-hunt')}
          >
            <p
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                marginBottom: 'var(--space-2)',
              }}
            >
              🔍 Caça ao Alvo
            </p>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Encontre todas as figuras que correspondem ao alvo antes que o tempo acabe.
              Cuidado com as distrações.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};