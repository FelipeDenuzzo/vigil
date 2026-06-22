// src/attentions/divided/games/MentalVault/ProcessingPhase.tsx
import React, { useState, useEffect, useRef } from 'react';
import { TentativaFase2, CondicaoRodada } from './types';

interface Props {
  trialsCount: number;
  condition: CondicaoRodada;
  digitDurationMs: number;
  onComplete: (results: TentativaFase2[]) => void;
}

const VALID_DIGITS = [1, 2, 3, 4, 6, 7, 8, 9]; // Exclui 5

export const ProcessingPhase: React.FC<Props> = ({
  trialsCount,
  condition,
  digitDurationMs,
  onComplete,
}) => {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [digit, setDigit] = useState<number>(1);
  const [corOuRegra, setCorOuRegra] = useState<'azul' | 'vermelho' | 'padrao'>('padrao');
  const [activeRule, setActiveRule] = useState<'even-odd' | 'greater-less'>('even-odd');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'timeout' | null>(null);

  const resultsRef = useRef<TentativaFase2[]>([]);
  const trialStartTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Evita re-entry ou cliques duplos durante a transição
  const transitioningRef = useRef<boolean>(false);

  // Refs mutáveis para evitar closures obsoletas no temporizador
  const digitRef = useRef<number>(1);
  const corOuRegraRef = useRef<'azul' | 'vermelho' | 'padrao'>('padrao');
  const activeRuleRef = useRef<'even-odd' | 'greater-less'>('even-odd');
  const currentTrialRef = useRef<number>(0);

  // Limpa os timers ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Inicializa ou avança para a próxima tentativa
  useEffect(() => {
    // Sorteia o dígito
    const nextDigit = VALID_DIGITS[Math.floor(Math.random() * VALID_DIGITS.length)];
    setDigit(nextDigit);
    digitRef.current = nextDigit;

    // Define cor e regra de acordo com a condição
    let nextCor: 'azul' | 'vermelho' | 'padrao' = 'padrao';
    let nextRule: 'even-odd' | 'greater-less' = 'even-odd';

    if (condition === 'pura') {
      nextCor = 'padrao';
      nextRule = 'even-odd';
    } else {
      // Condição mista: sorteia Azul (even-odd) ou Vermelho (greater-less)
      const isBlue = Math.random() < 0.5;
      nextCor = isBlue ? 'azul' : 'vermelho';
      nextRule = isBlue ? 'even-odd' : 'greater-less';
    }

    setCorOuRegra(nextCor);
    corOuRegraRef.current = nextCor;

    setActiveRule(nextRule);
    activeRuleRef.current = nextRule;

    currentTrialRef.current = currentTrial;
    trialStartTimeRef.current = performance.now();
    transitioningRef.current = false;

    // Timer de timeout/omissão
    timerRef.current = setTimeout(() => {
      handleTimeout();
    }, digitDurationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentTrial, condition, digitDurationMs]);

  // Lida com timeout (usuário não respondeu a tempo)
  const handleTimeout = () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    setFeedback('timeout');

    const reactionTimeMs = digitDurationMs;
    const currentDigit = digitRef.current;
    const currentRule = activeRuleRef.current;
    const currentCor = corOuRegraRef.current;
    const currentIdx = currentTrialRef.current;

    const respostaCorreta = getCorrectAnswer(currentDigit, currentRule);

    const newResult: TentativaFase2 = {
      indiceTentativa: currentIdx + 1,
      digito: currentDigit,
      corOuRegra: currentCor,
      respostaCorreta,
      respostaUsuario: 'omissao',
      acertou: false,
      tipoErro: 'omissao',
      tempoReacaoMs: reactionTimeMs,
    };

    transitionTimerRef.current = setTimeout(() => {
      setFeedback(null);
      saveAndAdvance(newResult);
    }, 500);
  };

  // Determina o botão correto com base nas regras cognitivas
  const getCorrectAnswer = (val: number, ruleName: 'even-odd' | 'greater-less'): 'esquerda' | 'direita' => {
    if (ruleName === 'even-odd') {
      // Par = Direita, Ímpar = Esquerda
      return val % 2 === 0 ? 'direita' : 'esquerda';
    } else {
      // Maior que 5 = Direita, Menor que 5 = Esquerda
      return val > 5 ? 'direita' : 'esquerda';
    }
  };

  // Processa a resposta do usuário
  const handleAnswer = (answer: 'esquerda' | 'direita') => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    // Cancela o timer de timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const reactionTimeMs = Math.round(performance.now() - trialStartTimeRef.current);
    const currentDigit = digitRef.current;
    const currentRule = activeRuleRef.current;
    const currentCor = corOuRegraRef.current;
    const currentIdx = currentTrialRef.current;

    const respostaCorreta = getCorrectAnswer(currentDigit, currentRule);
    const acertou = answer === respostaCorreta;

    setFeedback(acertou ? 'correct' : 'incorrect');

    const newResult: TentativaFase2 = {
      indiceTentativa: currentIdx + 1,
      digito: currentDigit,
      corOuRegra: currentCor,
      respostaCorreta,
      respostaUsuario: answer,
      acertou,
      tipoErro: acertou ? null : 'comissao',
      tempoReacaoMs: reactionTimeMs,
    };

    transitionTimerRef.current = setTimeout(() => {
      setFeedback(null);
      saveAndAdvance(newResult);
    }, 500);
  };

  // Salva o resultado e decide se encerra a fase ou avança
  const saveAndAdvance = (resultItem: TentativaFase2) => {
    resultsRef.current.push(resultItem);

    if (currentTrial + 1 >= trialsCount) {
      onComplete(resultsRef.current);
    } else {
      setCurrentTrial((prev) => prev + 1);
    }
  };

  // Estilização das cores funcionais do dígito
  const getDigitColor = () => {
    if (corOuRegra === 'azul') return '#6c8ef5'; // Azul
    if (corOuRegra === 'vermelho') return '#f08080';  // Vermelho
    return 'var(--color-text)';             // Padrão
  };

  // Borda com flash do feedback
  const getFeedbackBorder = () => {
    if (feedback === 'correct') return '3px solid var(--color-sustained)';
    if (feedback === 'incorrect' || feedback === 'timeout') return '3px solid #f08080';
    return '1px solid var(--color-border)';
  };

  const getFeedbackGlow = () => {
    if (feedback === 'correct') return '0 0 15px rgba(108, 245, 167, 0.3)';
    if (feedback === 'incorrect' || feedback === 'timeout') return '0 0 15px rgba(240, 128, 128, 0.3)';
    return 'none';
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '390px',
      gap: 'var(--space-6)',
      width: '100%',
    },
    ruleBanner: {
      fontSize: 'var(--text-base)',
      fontWeight: 700,
      color: 'var(--color-text-muted)',
      textAlign: 'center' as const,
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      letterSpacing: '0.03em',
    },
    blueRule: {
      color: '#8aaaf7',
    },
    redRule: {
      color: '#f08080',
    },
    digitWrapper: {
      width: '180px',
      height: '180px',
      borderRadius: 'var(--radius-xl)',
      backgroundColor: 'var(--color-surface)',
      border: getFeedbackBorder(),
      boxShadow: getFeedbackGlow(),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.1s ease-in-out',
    },
    digitDisplay: {
      fontSize: '110px',
      fontWeight: 900,
      color: getDigitColor(),
      fontFamily: 'monospace',
      lineHeight: 1,
      userSelect: 'none' as const,
    },
    buttonRow: {
      display: 'flex',
      gap: 'var(--space-4)',
      width: '100%',
      maxWidth: '400px',
    },
    btn: {
      flex: 1,
      padding: 'var(--space-4) 0',
      fontSize: '15px',
      fontWeight: 700,
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-text)',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      userSelect: 'none' as const,
      textAlign: 'center' as const,
    },
    progressIndicator: {
      fontSize: 'var(--text-xs)',
      color: 'var(--color-text-faint)',
      marginTop: '-5px',
    },
  };

  // Renderiza a regra curta no topo
  const renderRuleText = () => {
    if (condition === 'pura') {
      return (
        <span>⬅️ ÍMPAR &nbsp;|&nbsp; PAR ➡️</span>
      );
    } else {
      if (activeRule === 'even-odd') {
        return (
          <span style={styles.blueRule}>⬅️ ÍMPAR &nbsp;|&nbsp; PAR ➡️</span>
        );
      } else {
        return (
          <span style={styles.redRule}>
            ⬅️ MENOR QUE <span style={{ fontSize: '1.4em', fontWeight: '800', margin: '0 2px', verticalAlign: 'middle' }}>5</span> &nbsp;|&nbsp; MAIOR QUE <span style={{ fontSize: '1.4em', fontWeight: '800', margin: '0 2px', verticalAlign: 'middle' }}>5</span> ➡️
          </span>
        );
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Regra ativa visível no topo */}
      <div style={styles.ruleBanner}>
        {renderRuleText()}
      </div>

      {/* Dígito centralizado com alto contraste e flash de feedback */}
      <div style={styles.digitWrapper}>
        <div style={styles.digitDisplay}>{digit}</div>
      </div>

      {/* Dois botões largos e fixos na base */}
      <div style={styles.buttonRow}>
        <button
          style={styles.btn}
          onClick={() => handleAnswer('esquerda')}
        >
          ESQUERDA
        </button>
        <button
          style={styles.btn}
          onClick={() => handleAnswer('direita')}
        >
          DIREITA
        </button>
      </div>

      {/* Indicador de Progresso discreto */}
      <p style={styles.progressIndicator}>
        {currentTrial + 1} / {trialsCount}
      </p>
    </div>
  );
};
