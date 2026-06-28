import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import MentalVaultPlay from './MentalVaultPlay';
import SelectiveListeningPlay from './SelectiveListeningPlay';

type ActiveGame = 'cofre-mental' | 'escuta-seletiva' | null;

export const DividedHub: React.FC = () => {
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
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-divided)' }}>Atenção Dividida</h1>
        <p style={{ color: '#ffffff', marginTop: 'var(--space-2)' }}>
          Esta modalidade desafia você a focar em múltiplos pontos ao mesmo tempo, dividindo sua atenção com eficiência.
        </p>
      </header>

      <section>
        {activeGame === 'cofre-mental' && (
          <div style={{ width: '100%', minHeight: '600px' }}>
            <MentalVaultPlay onClose={() => setActiveGame(null)} />
          </div>
        )}

        {activeGame === 'escuta-seletiva' && (
          <div style={{ width: '100%', minHeight: '600px' }}>
            <SelectiveListeningPlay onClose={() => setActiveGame(null)} />
          </div>
        )}

        {activeGame === null && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
            <Card
              interactive
              accent="var(--color-divided)"
              onClick={() => setActiveGame('cofre-mental')}
            >
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                🔐 Cofre Mental
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff' }}>
                Guarde uma sequência de letras e classifique dígitos sob divisão de atenção para abrir o cofre.
              </p>
            </Card>

            <Card
              interactive
              accent="var(--color-divided)"
              onClick={() => setActiveGame('escuta-seletiva')}
            >
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                🎧 Escuta Seletiva
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff' }}>
                Filtre interferências sonoras concorrentes prestando atenção apenas na voz indicada.
              </p>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
};