// src/attentions/sustained/games/FruitWatch/FruitWatchGame.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PHASE_CONFIGS, FIGURES, pickTargetAndDistractorsForSession, shuffleColorCategories } from './levels';
import { generateFigureSequence, countFiguresInSequence } from './logic';
import type { FlyingFigure, PhaseRawResult } from './types';

interface Props {
  onComplete: (results: PhaseRawResult[]) => void;
  onClose?: () => void;
}

type GameStep =
  | 'instructions'
  | 'target_reveal'
  | 'countdown'
  | 'playing'
  | 'answer_bonus_before' // Fase 6: pergunta o bônus antes
  | 'answer_target'       // pergunta o alvo
  | 'answer_bonus_after'  // Fase 5: pergunta o bônus depois
  | 'between_phases'
  | 'finished';

export default function FruitWatchGame({ onComplete, onClose }: Props) {
  // Gera uma ordem de cores randômica para toda a sessão do jogo
  const [shuffledCategories] = useState(() => shuffleColorCategories());
  const [step, setStep] = useState<GameStep>('instructions');
  const [phase, setPhase] = useState(1);
  const [sequence, setSequence] = useState<FlyingFigure[]>([]);
  const [visible, setVisible] = useState<FlyingFigure[]>([]);
  const [results, setResults] = useState<PhaseRawResult[]>([]);
  const [userInput, setUserInput] = useState('');
  const [bonusInput, setBonusInput] = useState('');
  const [commissions, setCommissions] = useState(0);
  const commissionsRef = useRef(0);

  const config = PHASE_CONFIGS[phase - 1];
  const { target, distractors, bonusFigure } = pickTargetAndDistractorsForSession(phase, shuffledCategories);

  // Geração e lançamento das figuras voadoras
  useEffect(() => {
    if (step !== 'playing') return;

    const seq = generateFigureSequence(config, target, distractors, bonusFigure);
    setSequence(seq);
    commissionsRef.current = 0;
    setCommissions(0);
    setVisible([]);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Agenda o aparecimento e sumiço de cada figura na tela
    seq.forEach(fig => {
      const launchTimer = setTimeout(() => {
        setVisible(prev => [...prev, fig]);

        // Remove do array de visíveis assim que o voo terminar
        const removeTimer = setTimeout(() => {
          setVisible(prev => prev.filter(f => f.id !== fig.id));
        }, fig.flightDurationMs);
        timers.push(removeTimer);

      }, fig.launchAt);
      timers.push(launchTimer);
    });

    // Encerra a fase após a duração total configurada
    const endTimer = setTimeout(() => {
      timers.forEach(clearTimeout);
      setVisible([]);
      setCommissions(commissionsRef.current);

      if (config.mode === 'bonus_before') {
        setStep('answer_bonus_before');
      } else {
        setStep('answer_target');
      }
    }, config.durationMs);

    timers.push(endTimer);

    return () => timers.forEach(clearTimeout);
  }, [step, phase]);

  // Captura erros de comissão (toque na tela durante a chuva) com pointer events instantâneos no mobile
  const handleScreenTouch = useCallback(() => {
    if (step !== 'playing') return;
    
    // Evita contar cliques se o usuário clicou em algum botão ou controle (embora não existam durante o jogo)
    commissionsRef.current += 1;
  }, [step]);

  // Envio da resposta da fase
  const submitAnswer = () => {
    const { targetCount, bonusCount } = countFiguresInSequence(
      sequence,
      target.id,
      bonusFigure?.id
    );

    const result: PhaseRawResult = {
      phase,
      targetFigureId: target.id,
      targetCount,
      userAnswer: parseInt(userInput) || 0,
      bonusFigureId: bonusFigure?.id,
      bonusRealCount: bonusFigure ? bonusCount : undefined,
      bonusUserAnswer:
        config.mode === 'bonus_after' || config.mode === 'bonus_before'
          ? parseInt(bonusInput) || 0
          : undefined,
      commissionErrors: commissions,
    };

    const newResults = [...results, result];
    setResults(newResults);
    setUserInput('');
    setBonusInput('');

    if (phase >= 6) {
      onComplete(newResults);
      setStep('finished');
    } else {
      setPhase(p => p + 1);
      setStep('between_phases');
    }
  };

  if (step === 'instructions') {
    return <SimulationScreen onDone={() => setStep('target_reveal')} onClose={onClose} />;
  }

  if (step === 'finished') return null;

  return (
    <div style={s.container}>
      {/* Indicador de Fase no topo */}
      {step === 'playing' && (
        <div style={s.phaseHeader}>
          <span>Fase {phase} de 6</span>
          <span style={s.phaseSub}>Apenas observe e conte a figura memorizada</span>
        </div>
      )}

      {/* Tela de Jogo principal */}
      {step === 'playing' && (
        <div
          onPointerDown={handleScreenTouch}
          style={s.gameCanvas}
        >
          {/* Renderização das figuras em trajetória de parábola */}
          {visible.map(fig => {
            const figDef = FIGURES.find(f => f.id === fig.figureId)!;
            return (
              <motion.div
                key={fig.id}
                initial={{ bottom: '-15%', left: `${fig.launchX}%`, scale: 0.8 }}
                animate={{
                  bottom: ['-15%', `${fig.peakY}%`, '-15%'],
                  left: [`${fig.launchX}%`, `${fig.endX}%`],
                  scale: [0.8, 1.15, 0.8]
                }}
                transition={{
                  duration: fig.flightDurationMs / 1000,
                  ease: 'easeInOut'
                }}
                style={s.flyingItem}
              >
                <img src={figDef.imagePath} alt="" style={s.flyingImage} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Subtelas de transições */}
      {step === 'target_reveal' && <TargetRevealScreen target={target} onDone={() => setStep('countdown')} />}
      {step === 'countdown' && <CountdownScreen onDone={() => setStep('playing')} />}
      {step === 'between_phases' && <BetweenPhasesScreen phase={phase} onDone={() => setStep('target_reveal')} />}

      {/* Pergunta do Alvo Principal (ou Bônus Antes) */}
      {(step === 'answer_target' || step === 'answer_bonus_before') && (
        <AnswerScreen
          question={
            step === 'answer_bonus_before'
              ? 'Antes da figura principal, responda: quantas vezes você viu este elemento extra?'
              : 'Quantas vezes a figura que você memorizou apareceu na tela?'
          }
          imagePath={step === 'answer_bonus_before' ? bonusFigure!.imagePath : undefined}
          value={step === 'answer_bonus_before' ? bonusInput : userInput}
          onChange={v => (step === 'answer_bonus_before' ? setBonusInput(v) : setUserInput(v))}
          onConfirm={() => {
            if (step === 'answer_bonus_before') {
              setStep('answer_target');
            } else if (config.mode === 'bonus_after') {
              setStep('answer_bonus_after');
            } else {
              submitAnswer();
            }
          }}
        />
      )}

      {/* Pergunta do Bônus Depois */}
      {step === 'answer_bonus_after' && (
        <AnswerScreen
          question="Pergunta surpresa: quantas vezes você viu este elemento extra na tela?"
          imagePath={bonusFigure!.imagePath}
          value={bonusInput}
          onChange={setBonusInput}
          onConfirm={submitAnswer}
        />
      )}
    </div>
  );
}

// ── Sub-componentes auxiliares ──────────────────────────────────────────────

function SimulationScreen({ onDone, onClose }: { onDone: () => void; onClose?: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      title: 'Contagem Mental Silenciosa',
      text: <>Você treinará sua Atenção Sustentada.<br />Uma figura-alvo será exibida antes de começar.<br />Conte mentalmente quantas vezes ela aparece na tela.</>,
    },
    {
      title: 'Apenas Observe',
      text: <>Não toque na tela enquanto os objetos estiverem voando.<br />Guarde a contagem em silêncio.</>,
    },
    {
      title: 'Guarde na Memória',
      text: 'Depois que a fase iniciar, o alvo não aparecerá mais.',
    },
  ];

  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  return (
    <div style={s.modalContainer}>
      <div style={s.instructionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <p style={s.stepIndicator}>COMO JOGAR · {stepIndex + 1}/{steps.length}</p>
          {onClose && (
            <button onClick={onClose} style={s.closeBtn}>✕</button>
          )}
        </div>
        
        <h2 style={s.stepTitle}>{current.title}</h2>
        <p style={s.stepText}>{current.text}</p>
        
        <div style={s.btnRow}>
          {stepIndex > 0 && (
            <button style={s.prevBtn} onClick={() => setStepIndex(s => s - 1)}>
              Anterior
            </button>
          )}
          <button style={s.nextBtn} onClick={() => (isLast ? onDone() : setStepIndex(s => s + 1))}>
            {isLast ? 'Começar Treino' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TargetRevealScreen({ target, onDone }: { target: { imagePath: string }; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={s.centerScreen}>
      <p style={s.revealLabel}>Guarde esta figura na memória</p>
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1.1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={s.revealImageContainer}
      >
        <img src={target.imagePath} alt="Target" style={s.revealImage} />
      </motion.div>
      <p style={s.revealSub}>Ela desaparecerá e você deverá contá-la mentalmente</p>
    </div>
  );
}

function CountdownScreen({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);

  return (
    <div style={s.centerScreen}>
      <motion.p
        key={count}
        initial={{ scale: 1.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={s.countdownText}
      >
        {count > 0 ? count : 'Concentração! 🥷'}
      </motion.p>
    </div>
  );
}

function BetweenPhasesScreen({ phase, onDone }: { phase: number; onDone: () => void }) {
  return (
    <div style={s.centerScreen}>
      <p style={s.phaseCompletedLabel}>Fase {phase - 1} de 6 Concluída</p>
      <h3 style={s.betweenTitle}>Pronto para a próxima fase?</h3>

      <button style={s.continueBtn} onClick={onDone}>
        Iniciar Rodada {phase}
      </button>
    </div>
  );
}

function AnswerScreen({
  question,
  imagePath,
  value,
  onChange,
  onConfirm,
}: {
  question: string;
  imagePath?: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
}) {
  return (
    <div style={s.answerCardContainer}>
      {imagePath && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ marginBottom: 16 }}
        >
          <img src={imagePath} alt="Question target" style={{ width: 100, height: 100, objectFit: 'contain' }} />
        </motion.div>
      )}
      <p style={s.answerQuestionText}>{question}</p>
      
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        autoFocus
        style={s.answerInput}
      />
      
      <button
        onClick={onConfirm}
        disabled={value === ''}
        style={value !== '' ? s.confirmBtnActive : s.confirmBtnDisabled}
      >
        Confirmar Resposta
      </button>
    </div>
  );
}

// ── Estilos Inline (CSS in JS) com visual premium ───────────────────────────

const s: Record<string, any> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '600px',
    background: '#12131e',
    color: '#e8e9f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  phaseHeader: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    zIndex: 30,
    pointerEvents: 'none',
    fontWeight: 600,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  phaseSub: {
    fontSize: 13,
    color: '#6c8ef5',
  },
  gameCanvas: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    cursor: 'crosshair',
    overflow: 'hidden',
  },
  flashOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(240, 128, 128, 0.3)',
    pointerEvents: 'none',
    zIndex: 25,
  },
  flyingItem: {
    position: 'absolute',
    pointerEvents: 'none',
    transform: 'translateX(-50%)',
  },
  flyingImage: {
    width: 70,
    height: 70,
    objectFit: 'contain',
    filter: 'drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.35))',
  },
  modalContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    maxWidth: 480,
    padding: 24,
    paddingTop: 24,
    margin: '0 auto',
  },
  instructionCard: {
    background: '#161824',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
  },
  stepIndicator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    cursor: 'pointer',
  },
  stepTitle: {
    fontSize: 23,
    fontWeight: 800,
    margin: 0,
    textAlign: 'center',
    color: '#6c8ef5',
  },
  stepText: {
    fontSize: 15,
    color: '#c8cad8',
    textAlign: 'center',
    lineHeight: 1.65,
    margin: 0,
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  prevBtn: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 15,
  },
  nextBtn: {
    flex: 2,
    padding: '12px 0',
    borderRadius: 14,
    background: '#6c8ef5',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 15,
    boxShadow: '0 4px 12px rgba(108,142,245,0.3)',
  },
  centerScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
    textAlign: 'center',
  },
  revealLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: 0,
  },
  revealImageContainer: {
    width: 140,
    height: 140,
    background: 'rgba(255,255,255,0.02)',
    border: '2px solid rgba(108,142,245,0.2)',
    borderRadius: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 12px 32px rgba(108,142,245,0.15)',
  },
  revealImage: {
    width: 100,
    height: 100,
    objectFit: 'contain',
  },
  revealSub: {
    color: '#c8cad8',
    fontSize: 14,
    maxWidth: 320,
    lineHeight: 1.5,
    margin: 0,
  },
  countdownText: {
    fontSize: 55,
    fontWeight: 900,
    color: '#6c8ef5',
    margin: 0,
  },
  phaseCompletedLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    margin: 0,
  },
  betweenTitle: {
    fontSize: 21,
    fontWeight: 800,
    margin: 0,
  },
  tipsBox: {
    fontSize: 13,
    background: 'rgba(108,142,245,0.06)',
    border: '1px solid rgba(108,142,245,0.15)',
    borderRadius: 16,
    padding: '14px 20px',
    maxWidth: 380,
    textAlign: 'left',
    lineHeight: 1.55,
  },
  continueBtn: {
    padding: '12px 36px',
    borderRadius: 14,
    background: '#6c8ef5',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(108,142,245,0.3)',
    marginTop: 8,
  },
  answerCardContainer: {
    background: '#161824',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: '36px 32px',
    maxWidth: 420,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 24,
    boxShadow: '0 20px 45px rgba(0,0,0,0.45)',
  },
  answerQuestionText: {
    fontSize: 16,
    color: '#c8cad8',
    lineHeight: 1.6,
    margin: 0,
    fontWeight: 500,
  },
  answerInput: {
    fontSize: 49,
    textAlign: 'center',
    width: 140,
    padding: '12px 16px',
    borderRadius: 16,
    border: '2px solid rgba(255,255,255,0.1)',
    background: '#1d2030',
    color: '#fff',
    fontWeight: 700,
    outline: 'none',
  },
  confirmBtnActive: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 14,
    background: '#6c8ef5',
    color: 'white',
    fontSize: 16,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(108,142,245,0.3)',
    transition: 'all 0.2s',
  },
  confirmBtnDisabled: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.25)',
    fontSize: 16,
    fontWeight: 700,
    border: '1px solid rgba(255,255,255,0.05)',
    cursor: 'not-allowed',
  },
};
