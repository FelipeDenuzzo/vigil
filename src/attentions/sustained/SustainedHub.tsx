import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { LabirintosProlongadosGame } from './games/LongMazes/LabirintosProlongadosGame';
import { LongMazesEvaluationContainer } from './games/LongMazes/LongMazesEvaluationContainer';
import type { MazeFullSessionLog } from './games/LongMazes/types';

import FruitWatchGame from './games/FruitWatch/FruitWatchGame';
import { FruitWatchEvaluationContainer } from './games/FruitWatch/FruitWatchEvaluationContainer';
import type { PhaseRawResult } from './games/FruitWatch/types';

type ActiveGame = 'long-mazes' | 'fruit-watch' | 'result-long-mazes' | 'result-fruit-watch' | null;

const ENABLE_LONG_MAZES = true;

export const SustainedHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeGame,  setActiveGame]  = useState<ActiveGame>(null);
  const [sessionLog,  setSessionLog]  = useState<MazeFullSessionLog | null>(null);
  const [fruitResults, setFruitResults] = useState<PhaseRawResult[] | null>(null);
  const [sessionId,   setSessionId]   = useState<string>('');

  const handleBack = () => {
    if (activeGame !== null) {
      setActiveGame(null);
      setSessionLog(null);
      setFruitResults(null);
    } else {
      navigate('/treinar');
    }
  };

  const handleLongMazesComplete = (log: MazeFullSessionLog) => {
    const id = uuidv4();
    setSessionId(id);
    setSessionLog(log);
    setActiveGame('result-long-mazes');
  };

  const handleFruitWatchComplete = (res: PhaseRawResult[]) => {
    const id = uuidv4();
    setSessionId(id);
    setFruitResults(res);
    setActiveGame('result-fruit-watch');
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button variant="ghost" onClick={handleBack} style={{ marginBottom: 'var(--space-4)' }}>
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-sustained)' }}>Atenção Sustentada</h1>
        <p style={{ color: '#ffffff', marginTop: 'var(--space-2)' }}>
          Esta modalidade treina sua capacidade de manter o foco por períodos longos, aumentando a resistência cognitiva perante o cansaço.
        </p>
      </header>

      <section>
        {activeGame === 'long-mazes' && (
          <div style={{ height: '600px' }}>
            <LabirintosProlongadosGame
              onComplete={handleLongMazesComplete}
            />
          </div>
        )}

        {activeGame === 'fruit-watch' && (
          <div style={{ minHeight: '600px', width: '100%' }}>
            <FruitWatchGame
              onComplete={handleFruitWatchComplete}
            />
          </div>
        )}

        {activeGame === 'result-long-mazes' && sessionLog && (
          <LongMazesEvaluationContainer
            log={sessionLog}
            sessionId={sessionId}
            onRepeat={() => {
              setSessionLog(null);
              setActiveGame('long-mazes');
            }}
          />
        )}

        {activeGame === 'result-fruit-watch' && fruitResults && (
          <FruitWatchEvaluationContainer
            results={fruitResults}
            sessionId={sessionId}
            onRepeat={() => {
              setFruitResults(null);
              setActiveGame('fruit-watch');
            }}
          />
        )}

        {activeGame === null && (
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
                  <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff' }}>
                    Navegue por labirintos estendidos para testar e treinar a manutenção do seu foco.
                  </p>
                </Card>
              )}

              <Card
                interactive
                accent="var(--color-sustained)"
                onClick={() => setActiveGame('fruit-watch')}
              >
                <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                  🥷 Foco Ninja
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff' }}>
                  Realize uma contagem mental silenciosa de figuras-alvo e teste sua estabilidade e resistência atencional.
                </p>
              </Card>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
