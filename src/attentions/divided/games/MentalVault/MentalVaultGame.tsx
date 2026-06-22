// src/attentions/divided/games/MentalVault/MentalVaultGame.tsx
import React, { useState, useRef } from 'react';
import { MentalVaultPhase, GameConfig, ProcessingTrialResult, RoundResult } from './types';
import { EncodingPhase } from './EncodingPhase';
import { ProcessingPhase } from './ProcessingPhase';
import { RecallPhase } from './RecallPhase';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';

interface Props {
  sessionId: string;
  onClose?: () => void;
}

const CONSONANTS_POOL = 'BCDFGHJKLMNPQRSTVWXYZ';

function generateConsonants(length: number): string[] {
  const letters: string[] = [];
  const pool = CONSONANTS_POOL.split('');
  for (let i = 0; i < length; i++) {
    if (pool.length === 0) break;
    const randomIndex = Math.floor(Math.random() * pool.length);
    letters.push(pool.splice(randomIndex, 1)[0]);
  }
  return letters;
}

const CONFIG_BY_LEVEL: Record<number, GameConfig> = {
  1: { consonantsCount: 3, displayDurationMs: 1500, classificationTrials: 8, condition: 'pure' },
  2: { consonantsCount: 4, displayDurationMs: 1300, classificationTrials: 8, condition: 'pure' },
  3: { consonantsCount: 4, displayDurationMs: 1200, classificationTrials: 8, condition: 'mixed' },
  4: { consonantsCount: 5, displayDurationMs: 1100, classificationTrials: 8, condition: 'mixed' },
  5: { consonantsCount: 6, displayDurationMs: 900,  classificationTrials: 8, condition: 'mixed' },
};

export const MentalVaultGame: React.FC<Props> = ({ sessionId, onClose }) => {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<MentalVaultPhase>('instructions');

  // Dados da rodada ativa
  const [targetLetters, setTargetLetters] = useState<string[]>([]);
  const [processingResults, setProcessingResults] = useState<ProcessingTrialResult[]>([]);
  const [userRecall, setUserRecall] = useState<string[]>([]);

  // Histórico de rodadas concluídas
  const roundHistoryRef = useRef<RoundResult[]>([]);

  const activeConfig = CONFIG_BY_LEVEL[level] || CONFIG_BY_LEVEL[1];

  const handleStartGame = () => {
    startNewRound();
  };

  const startNewRound = () => {
    const letters = generateConsonants(activeConfig.consonantsCount);
    setTargetLetters(letters);
    setProcessingResults([]);
    setUserRecall([]);
    setPhase('encoding');
  };

  const handleEncodingComplete = () => {
    setPhase('processing');
  };

  const handleProcessingComplete = (results: ProcessingTrialResult[]) => {
    setProcessingResults(results);
    setPhase('recall');
  };

  const handleRecallComplete = (answers: string[]) => {
    setUserRecall(answers);

    // Calcular se a rodada foi um sucesso
    const isRecallCorrect = answers.every((val, idx) => val === targetLetters[idx]);

    const correctProcessingCount = processingResults.filter((r) => r.isCorrect).length;
    const processingAccuracy = (correctProcessingCount / activeConfig.classificationTrials) * 100;
    const processingAvgRtMs = processingResults.reduce((acc, r) => acc + r.reactionTimeMs, 0) / activeConfig.classificationTrials;

    const roundResult: RoundResult = {
      roundNumber: roundHistoryRef.current.length + 1,
      config: activeConfig,
      targetLetters,
      userRecallLetters: answers,
      isRecallCorrect,
      processingAccuracy,
      processingAvgRtMs,
    };

    roundHistoryRef.current.push(roundResult);
    setPhase('feedback');
  };

  const handleFeedbackNext = () => {
    const lastResult = roundHistoryRef.current[roundHistoryRef.current.length - 1];

    // Condição de sucesso para avançar de nível:
    // Acertar a sequência inteira E ter pelo menos 80% de precisão nos dígitos
    const success = lastResult.isRecallCorrect && lastResult.processingAccuracy >= 80;

    if (success) {
      if (level < 5) {
        setLevel((prev) => prev + 1);
      }
    }

    startNewRound();
  };

  const handleFinishSession = () => {
    setPhase('summary');
  };

  // Renderizar as telas correspondentes
  const renderContent = () => {
    switch (phase) {
      case 'instructions':
        return (
          <Card style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-lg)' }}>
              🔐 Instruções do Jogo
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', textAlign: 'left', fontSize: '15px', lineHeight: '1.6' }}>
              O **Cofre Mental** é um desafio de atenção dividida e memória de trabalho.
              <br /><br />
              1. **Memorize**: Uma sequência de consoantes aparecerá no centro. Guarde-as na ordem exata.
              <br /><br />
              2. **Decodifique (Classificação de dígitos)**: Responda a uma sequência de 8 dígitos de 1 a 9 (excluindo o 5) muito rápido!
              <br />
              * **Condição Pura (Níveis 1-2)**: Regra única: ÍMPAR = Esquerda | PAR = Direita.
              * **Condição Mista (Níveis 3-5)**: A cor do dígito muda a regra!
                * 🔵 **Azul**: ÍMPAR = Esquerda | PAR = Direita.
                * 🔴 **Vermelho**: &lt; 5 = Esquerda | &gt; 5 = Direita.
              <br />
              3. **Abra o cofre**: Responda as letras da sequência na mesma ordem.
            </p>
            <Button
              variant="primary"
              onClick={handleStartGame}
              style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}
            >
              Iniciar Cofre
            </Button>
          </Card>
        );

      case 'encoding':
        return (
          <EncodingPhase
            letters={targetLetters}
            displayDurationMs={activeConfig.displayDurationMs}
            onComplete={handleEncodingComplete}
          />
        );

      case 'processing':
        return (
          <ProcessingPhase
            trialsCount={activeConfig.classificationTrials}
            condition={activeConfig.condition}
            onComplete={handleProcessingComplete}
          />
        );

      case 'recall':
        return (
          <RecallPhase
            targetLetters={targetLetters}
            onComplete={handleRecallComplete}
          />
        );

      case 'feedback': {
        const lastResult = roundHistoryRef.current[roundHistoryRef.current.length - 1];
        const isSuccessful = lastResult.isRecallCorrect && lastResult.processingAccuracy >= 80;

        return (
          <Card style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: '450px', margin: '0 auto' }}>
            {isSuccessful ? (
              <h3 style={{ color: 'var(--color-sustained)', fontSize: '48px', marginBottom: 'var(--space-2)' }}>🎉</h3>
            ) : (
              <h3 style={{ color: 'var(--color-selective)', fontSize: '48px', marginBottom: 'var(--space-2)' }}>🔒</h3>
            )}
            <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
              {isSuccessful ? 'Cofre Aberto!' : 'Cofre Trancado'}
            </h2>

            <div style={{ textAlign: 'left', marginBottom: 'var(--space-6)', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>
                Sequência de letras: {lastResult.isRecallCorrect ? '✅ Acertou!' : '❌ Errou'}
              </p>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                Precisão de Dígitos: {Math.round(lastResult.processingAccuracy)}% (Ideal: &gt;= 80%)
              </p>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                Tempo Médio de Reação: {Math.round(lastResult.processingAvgRtMs)}ms
              </p>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                Condição: {lastResult.config.condition === 'pure' ? 'Pura' : 'Mista'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={handleFinishSession} style={{ flex: 1 }}>
                Encerrar Treino
              </Button>
              <Button
                variant="primary"
                onClick={handleFeedbackNext}
                style={{ flex: 1.5, backgroundColor: 'var(--color-divided)' }}
              >
                {isSuccessful && level < 5 ? 'Avançar Nível' : 'Jogar Novamente'}
              </Button>
            </div>
          </Card>
        );
      }

      case 'summary':
        return (
          <Card style={{ padding: 'var(--space-8)', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-4)' }}>🏁 Treino Concluído</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
              Você completou a sessão de treino do Cofre Mental!
            </p>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', textAlign: 'left' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Rodadas Jogadas: {roundHistoryRef.current.length}</p>
              <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>Nível Máximo Alcançado: {level}</p>
            </div>

            <Button variant="primary" onClick={onClose} style={{ backgroundColor: 'var(--color-divided)', width: '100%' }}>
              Voltar ao Hub
            </Button>
          </Card>
        );
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: 'var(--space-4)' }}>
      {phase !== 'instructions' && phase !== 'summary' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          <span>Nível {level} ({activeConfig.condition === 'pure' ? 'Puro' : 'Misto'})</span>
          <span>Fase: {phase === 'encoding' ? 'Codificação' : phase === 'processing' ? 'Processamento' : 'Recall'}</span>
        </div>
      )}
      {renderContent()}
    </div>
  );
};
