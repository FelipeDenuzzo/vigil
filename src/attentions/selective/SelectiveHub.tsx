import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import VisualSearchHunt from './games/VisualSearchHunt/VisualSearchHunt';
import type { GameResult } from '../../shared/types';

type ActiveGame = 'visual-search-hunt' | null;

export const SelectiveHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = React.useState<ActiveGame>(null);

  const handleEnd = (_result: GameResult) => {
    setActiveGame(null);
  };

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-12)',
        paddingBottom: 'var(--space-12)',
      }}
    >
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button
          variant="ghost"
          onClick={() => {
            if (activeGame !== null) {
              setActiveGame(null);
            } else {
              navigate('/treinar');
            }
          }}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← Voltar
        </Button>
      </header>

      <section>
        {activeGame === 'visual-search-hunt' ? (
          <VisualSearchHunt onEnd={handleEnd} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Encontre todas as figuras que correspondem ao alvo antes que o tempo acabe.
                  Cuidado com as distrações.
                </p>
              </Card>

              <Card
                interactive
                accent="var(--color-selective)"
                onClick={() => navigate('/treinar/seletiva/achar-o-faltando')}
              >
                <p
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  🔎 Achar o Faltando
                </p>
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Compare duas grades quase idênticas e encontre o item que está faltando
                  ou a mais antes que o tempo acabe.
                </p>
              </Card>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default SelectiveHub;
