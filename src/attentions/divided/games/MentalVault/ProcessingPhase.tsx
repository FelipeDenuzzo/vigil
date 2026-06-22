// src/attentions/divided/games/MentalVault/ProcessingPhase.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ProcessingTrialResult } from './types';
import { Button } from '../../../../shared/components/Button';

interface Props {
  trialsCount: number;
  onComplete: (results: ProcessingTrialResult[]) => void;
}

export const ProcessingPhase: React.FC<Props> = ({
  trialsCount,
  onComplete,
}) => {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [digit, setDigit] = useState(0);
  const resultsRef = useRef<ProcessingTrialResult[]>([]);
  const trialStartTimeRef = useRef<number>(0);

  // Gera novo dígito aleatório de 1 a 9 (exclui 0 para evitar ambiguidades se for o caso, 1-9 é padrão)
  const generateNewDigit = () => {
    let nextDigit = Math.floor(Math.random() * 9) + 1;
    // Evita repetir o mesmo dígito imediatamente para melhor experiência visual
    setDigit(nextDigit);
    trialStartTimeRef.current = performance.now();
  };

  useEffect(() => {
    generateNewDigit();
  }, [currentTrial]);

  const handleAnswer = (answer: 'even' | 'odd') => {
    const reactionTimeMs = Math.round(performance.now() - trialStartTimeRef.current);
    const correctAnswer: 'even' | 'odd' = digit % 2 === 0 ? 'even' : 'odd';
    const isCorrect = answer === correctAnswer;

    const newResult: ProcessingTrialResult = {
      digit,
      selectedAnswer: answer,
      correctAnswer,
      isCorrect,
      reactionTimeMs,
    };

    resultsRef.current.push(newResult);

    if (currentTrial + 1 >= trialsCount) {
      onComplete(resultsRef.current);
    } else {
      setCurrentTrial((prev) => prev + 1);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '350px',
      gap: 'var(--space-6)',
    },
    instruction: {
      fontSize: 'var(--text-lg)',
      fontWeight: 600,
      color: 'var(--color-text-muted)',
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      textAlign: 'center' as const,
    },
    digitDisplay: {
      fontSize: '96px',
      fontWeight: 900,
      color: 'var(--color-text)',
      fontFamily: 'monospace',
      lineHeight: 1,
    },
    buttonRow: {
      display: 'flex',
      gap: 'var(--space-4)',
      width: '100%',
      maxWidth: '320px',
    },
    btn: {
      flex: 1,
      padding: 'var(--space-4) 0',
      fontSize: '18px',
      fontWeight: 700,
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    },
    progressIndicator: {
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-muted)',
      marginTop: 'var(--space-2)',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.instruction}>Dígito é Par ou Ímpar?</h2>

      <div style={styles.digitDisplay}>{digit}</div>

      <div style={styles.buttonRow}>
        <button
          style={{ ...styles.btn, borderColor: 'var(--color-divided)' }}
          onClick={() => handleAnswer('odd')}
        >
          ÍMPAR
        </button>
        <button
          style={{ ...styles.btn, borderColor: 'var(--color-divided)' }}
          onClick={() => handleAnswer('even')}
        >
          PAR
        </button>
      </div>

      <p style={styles.progressIndicator}>
        Progresso: {currentTrial + 1} de {trialsCount}
      </p>
    </div>
  );
};
