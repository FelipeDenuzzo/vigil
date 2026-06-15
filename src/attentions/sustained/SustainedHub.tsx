import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { LabirintosProlongadosGame } from './games/LongMazes/LabirintosProlongadosGame';

type ActiveGame = 'long-mazes' | null;

// Feature flag para isolar o jogo até que esteja concluído
const ENABLE_LONG_MAZES = true;

export const SustainedHub: React.FC = () => {
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
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button variant="ghost" onClick={handleBack} style={{ marginBottom: 'var(--space-4)' }}>
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-sustained)' }}>Atenção Sustentada</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Esta modalidade treina sua capacidade de manter o foco por períodos longos, aumentando a resistência cognitiva perante o cansaço.
        </p>
      </header>

      <section>
        {activeGame === 'long-mazes' ? (
          <div style={{ height: '600px' }}>
            <LabirintosProlongadosGame 
              onClose={() => setActiveGame(null)}
              onComplete={(result) => {
                console.log('Sessão finalizada', result);
                setActiveGame(null);
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              {ENABLE_LONG_MAZES && (
                <Card 
                  interactive 
                  accent="var(--color-sustained)"
                  onClick={() => setActiveGame('long-mazes')}
                >
                  <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                    🧩 Labirintos Prolongados
                  </p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    Navegue por labirintos estendidos para testar e treinar a manutenção do seu foco.
                  </p>
                </Card>
              )}
            </div>

            {!ENABLE_LONG_MAZES && (
              <Card style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
                  Exercícios chegando em breve. Volte para a tela principal e explore outro tipo de atenção.
                </p>
                <Button variant="secondary" onClick={() => navigate('/treinar')}>
                  Voltar à seleção
                </Button>
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
};