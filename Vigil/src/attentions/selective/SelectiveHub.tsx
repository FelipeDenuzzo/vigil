import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import VisualSearchHunt from './games/VisualSearchHunt/VisualSearchHunt';

type ActiveGame = 'visual-search-hunt' | null;

export const SelectiveHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = React.useState<ActiveGame>(null);

  const handleEnd = () => {
    // keep simple: close game view when finished
    setActiveGame(null);
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button variant="ghost" onClick={() => navigate('/treinar')} style={{ marginBottom: 'var(--space-4)' }}>
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-selective)' }}>Atenção Seletiva</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Esta modalidade treina sua capacidade de se concentrar em um único estímulo, ignorando distrações e informações irrelevantes ao redor.
        </p>
      </header>

      <section>
        {activeGame === 'visual-search-hunt' ? (
          <div className="container" style={{ paddingTop: 'var(--space-4)' }}>
            <Button variant="ghost" onClick={() => setActiveGame(null)} style={{ marginBottom: 'var(--space-4)' }}>
              ← Voltar
            </Button>
            <VisualSearchHunt onEnd={handleEnd} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              <Card
                interactive
                accent="var(--color-selective)"
                onClick={() => setActiveGame('visual-search-hunt')}
              >
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  🔍 Caça ao Alvo
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Encontre todas as figuras que correspondem ao alvo antes que o tempo acabe. Cuidado com as distrações.
                </p>
              </Card>
            </div>

            <Card style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                Exercícios chegando em breve. Volte para a tela principal e explore outro tipo de atenção.
              </p>
              <Button variant="secondary" onClick={() => navigate('/treinar')}>
                Voltar à seleção
              </Button>
            </Card>
          </>
        )}
      </section>
    </div>
  );
};