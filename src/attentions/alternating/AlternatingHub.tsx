import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import ColorShapePlay from './ColorShapePlay';
import InsetosPlay from './InsetosPlay';

type ActiveGame = 'color-shape' | 'insetos' | null;

export const AlternatingHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);

  const handleBack = () => {
    if (activeGame !== null) {
      setActiveGame(null);
    } else {
      navigate('/treinar');
    }
  };

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}
    >
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button
          variant="ghost"
          onClick={handleBack}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-alternating)' }}>
          Atenção Alternada
        </h1>
        <p style={{ color: '#ffffff', marginTop: 'var(--space-2)' }}>
          Esta modalidade fortalece sua capacidade de alternar o foco entre diferentes tipos de tarefas de forma rápida e fluida.
        </p>
      </header>

      <section>
        {activeGame === 'color-shape' && (
          <div style={{ width: '100%', minHeight: '600px' }}>
            <ColorShapePlay onClose={() => setActiveGame(null)} />
          </div>
        )}

        {activeGame === 'insetos' && (
          <div style={{ width: '100%', minHeight: '600px' }}>
            <InsetosPlay onClose={() => setActiveGame(null)} />
          </div>
        )}

        {activeGame === null && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-6)',
            }}
          >
            <Card
              interactive
              accent="var(--color-alternating)"
              onClick={() => setActiveGame('color-shape')}
            >
              <p
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                }}
              >
                🎨 Cor ou Forma
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: '#ffffff',
                }}
              >
                Você verá uma figura na tela e precisa responder pela cor ou pela
                forma — a cada rodada, a regra pode mudar.
              </p>
            </Card>

            <Card
              interactive
              accent="var(--color-alternating)"
              onClick={() => setActiveGame('insetos')}
            >
              <p
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                }}
              >
                🐜 Insetos
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: '#ffffff',
                }}
              >
                Formigas e joaninhas se movem pela tela — toque rapidamente nos
                insetos do grupo ativo quando eles piscarem!
              </p>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
};
