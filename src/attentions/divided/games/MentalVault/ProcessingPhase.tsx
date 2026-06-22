// src/attentions/divided/games/MentalVault/ProcessingPhase.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ProcessingTrialResult, RoundCondition } from './types';

interface Props {
  trialsCount: number;
  condition: RoundCondition;
  onComplete: (results: ProcessingTrialResult[]) => void;
}

const VALID_DIGITS = [1, 2, 3, 4, 6, 7, 8, 9]; // Exclui 5

export const ProcessingPhase: React.FC<Props> = ({
  trialsCount,
  condition,
  onComplete,
}) => {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [digit, setDigit] = useState<number>(1);
  const [color, setColor] = useState<'blue' | 'red' | 'default'>('default');
  const [rule, setRule] = useState<'even-odd' | 'greater-less'>('even-odd');

  const resultsRef = useRef<ProcessingTrialResult[]>([]);
  const trialStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Evita re-entry ou cliques duplos durante a transição
  const transitioningRef = useRef<boolean>(false);

  // Inicializa ou avança para a próxima tentativa
  useEffect(() => {
    // Sorteia o dígito
    const nextDigit = VALID_DIGITS[Math.floor(Math.random() * VALID_DIGITS.length)];
    setDigit(nextDigit);

    // Define cor e regra de acordo com a condição
    if (condition === 'pure') {
      setColor('default');
      setRule('even-odd');
    } else {
      // Condição mista: sorteia Azul (even-odd) ou Vermelho (greater-less)
      const isBlue = Math.random() < 0.5;
      setColor(isBlue ? 'blue' : 'red');
      setRule(isBlue ? 'even-odd' : 'greater-less');
    }

    trialStartTimeRef.current = performance.now();
    transitioningRef.current = false;

    // Timer de 750ms para omissão/timeout
    timerRef.current = setTimeout(() => {
      handleTimeout();
    }, 750);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentTrial, condition]);

  // Função para lidar com timeout (usuário não respondeu a tempo)
  const handleTimeout = () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    const reactionTimeMs = 750;
    const correctAnswer = getCorrectAnswer(digit, rule);

    const newResult: ProcessingTrialResult = {
      digit,
      color,
      rule,
      selectedAnswer: 'timeout',
      correctAnswer,
      isCorrect: false,
      reactionTimeMs,
    };

    saveAndAdvance(newResult);
  };

  // Determina o botão correto com base nas regras cognitivas
  const getCorrectAnswer = (val: number, activeRule: 'even-odd' | 'greater-less'): 'left' | 'right' => {
    if (activeRule === 'even-odd') {
      // Par = Direita, Ímpar = Esquerda
      return val % 2 === 0 ? 'right' : 'left';
    } else {
      // Maior que 5 = Direita, Menor que 5 = Esquerda
      return val > 5 ? 'right' : 'left';
    }
  };

  // Processa a resposta do usuário
  const handleAnswer = (answer: 'left' | 'right') => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    // Cancela o timer de timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const reactionTimeMs = Math.round(performance.now() - trialStartTimeRef.current);
    const correctAnswer = getCorrectAnswer(digit, rule);
    const isCorrect = answer === correctAnswer;

    const newResult: ProcessingTrialResult = {
      digit,
      color,
      rule,
      selectedAnswer: answer,
      correctAnswer,
      isCorrect,
      reactionTimeMs,
    };

    saveAndAdvance(newResult);
  };

  // Salva o resultado e decide se encerra a fase ou avança
  const saveAndAdvance = (resultItem: ProcessingTrialResult) => {
    resultsRef.current.push(resultItem);

    if (currentTrial + 1 >= trialsCount) {
      onComplete(resultsRef.current);
    } else {
      setCurrentTrial((prev) => prev + 1);
    }
  };

  // Estilização das cores
  const getDigitColor = () => {
    if (color === 'blue') return '#6c8ef5'; // Azul
    if (color === 'red') return '#f08080';  // Vermelho
    return 'var(--color-text)';             // Padrão
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '380px',
      gap: 'var(--space-4)',
    },
    legendBox: {
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      width: '100%',
      maxWidth: '380px',
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-muted)',
      lineHeight: 1.5,
    },
    legendTitle: {
      fontWeight: 700,
      marginBottom: 'var(--space-2)',
      color: 'var(--color-text)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      textAlign: 'center' as const,
    },
    digitDisplay: {
      fontSize: '120px',
      fontWeight: 900,
      color: getDigitColor(),
      fontFamily: 'monospace',
      lineHeight: 1,
      height: '140px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.1s ease',
    },
    buttonRow: {
      display: 'flex',
      gap: 'var(--space-4)',
      width: '100%',
      maxWidth: '380px',
      marginTop: 'var(--space-2)',
    },
    btn: {
      flex: 1,
      padding: 'var(--space-4) 0',
      fontSize: '16px',
      fontWeight: 700,
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--color-surface-2)',
      border: '2px solid var(--color-border)',
      color: 'var(--color-text)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      userSelect: 'none' as const,
    },
    progressIndicator: {
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-muted)',
      marginTop: 'var(--space-2)',
    },
  };

  return (
    <div style={styles.container}>
      {/* Caixa de Legenda de Regras */}
      <div style={styles.legendBox}>
        {condition === 'pure' ? (
          <>
            <div style={styles.legendTitle}>Regra Ativa</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>⬅️ ESQUERDA = ÍMPAR</span>
              <span>PAR = DIREITA ➡️</span>
            </div>
          </>
        ) : (
          <>
            <div style={styles.legendTitle}>Instruções de Cores</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8aaaf7' }}>
                <span>🔵 Azul (Par/Ímpar):</span>
                <span>ÍMPAR = ⬅️ | PAR = ➡️</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f08080' }}>
                <span>🔴 Vermelho (&gt; ou &lt; 5):</span>
                <span>&lt; 5 = ⬅️ | &gt; 5 = ➡️</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dígito Gigante */}
      <div style={styles.digitDisplay}>{digit}</div>

      {/* Botões Esquerda / Direita */}
      <div style={styles.buttonRow}>
        <button
          style={{ ...styles.btn, borderColor: 'rgba(255, 255, 255, 0.1)' }}
          onClick={() => handleAnswer('left')}
        >
          ESQUERDA
        </button>
        <button
          style={{ ...styles.btn, borderColor: 'rgba(255, 255, 255, 0.1)' }}
          onClick={() => handleAnswer('right')}
        >
          DIREITA
        </button>
      </div>

      <p style={styles.progressIndicator}>
        Dígito {currentTrial + 1} de {trialsCount}
      </p>
    </div>
  );
};
