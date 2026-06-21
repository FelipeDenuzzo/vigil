import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLOR_TO_BTN, SHAPE_TO_BTN,
  NEUTRAL_BG,
  FIXATION_MS, MAX_RESPONSE_MS, ITI_MS,
} from './constants';
import { buildPureTrials, buildMixedTrials, isCorrect } from './logic';
import { useColorShapeEvaluation } from './useColorShapeEvaluation';
import type { TrialConfig, TrialResult, ColorShapeSessionLog, RuleType, ShapeType, ColorName } from './types';

type GamePhase = 'instructions' | 'fixation' | 'stimulus' | 'iti' | 'done';

interface Props {
  sessionId: string;
  onComplete?: (log: ColorShapeSessionLog) => void;
  onClose?:    () => void;
}

const BLOCK_A_TRIALS = 10;
const BLOCK_B_TRIALS = 10;
const MIXED_TRIALS   = 40;

// ── Constrói a fila única com marca de bloco ──────────────────────────────────────
type BlockName = 'A' | 'B' | 'mixed';
interface TaggedTrial extends TrialConfig { block: BlockName; }

function buildFullQueue(): TaggedTrial[] {
  const a     = buildPureTrials('color', BLOCK_A_TRIALS).map(t => ({ ...t, block: 'A'     as BlockName }));
  const b     = buildPureTrials('shape', BLOCK_B_TRIALS).map(t => ({ ...t, block: 'B'     as BlockName }));
  const mixed = buildMixedTrials(MIXED_TRIALS)          .map(t => ({ ...t, block: 'mixed' as BlockName }));
  return [...a, ...b, ...mixed];
}

// ── Mapeamento de imagens para estímulos ──────────────────────────────────────────
const SHAPE_IMAGE: Record<ShapeType, Record<ColorName, string>> = {
  circle: {
    red: '/formas/circulo_vermelho.png',
    blue: '/formas/circulo_azul.png',
    green: '/formas/circulo_verde.png',
    yellow: '/formas/circulo_amarelo.png',
  },
  square: {
    red: '/formas/quadrado_vermelho.png',
    blue: '/formas/quadrado_azul.png',
    green: '/formas/quadrado_verde.png',
    yellow: '/formas/quadrado_amarelo.png',
  },
  triangle: {
    red: '/formas/triangulo_vermelho.png',
    blue: '/formas/triangulo_azul.png',
    green: '/formas/triangulo_verde.png',
    yellow: '/formas/triangulo_amarelo.png',
  },
  diamond: {
    red: '/formas/losango_vermelho.png',
    blue: '/formas/losango_azul.png',
    green: '/formas/losango_verde.png',
    yellow: '/formas/losango_amarelo.png',
  },
};

// ── Badge de regra ──────────────────────────────────────────────────────────────
function RuleBadge({ rule }: { rule: RuleType }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '10px 20px', borderRadius: 99,
      background: 'rgba(180,180,180,0.10)',
      border: '2px solid rgba(255,255,255,0.25)',
      color: '#e8e9f0',
      fontSize: 17, fontWeight: 800, letterSpacing: '0.04em',
      transition: 'all 0.2s ease',
    }}>
      {rule === 'color' ? 'Qual é a COR?' : 'Qual é a FORMA?'}
    </div>
  );
}

// ── Instruções ──────────────────────────────────────────────────────────────────
function Instructions({ onStart }: { onStart: () => void }) {
  return (
    <div style={css.screen}>
      <p style={css.title}>Cor ou Forma</p>
      <p style={{ ...css.sub, maxWidth: 320, textAlign: 'center', lineHeight: 1.7 }}>
        Você verá figuras coloridas na tela.
        Em cada figura, uma pergunta aparecerá indicando o que deve responder.
        Use os botões para dar sua resposta.
      </p>
      <button style={css.primaryBtn} onClick={onStart}>Iniciar</button>
    </div>
  );
}

// ── Botões de resposta ──────────────────────────────────────────────────────────
const BUTTON_CONFIGS = [
  { key: '1', img: '/formas/triangulo_vermelho.png', alt: 'Triângulo Vermelho' },
  { key: '2', img: '/formas/losango_verde.png', alt: 'Losango Verde' },
  { key: '3', img: '/formas/quadrado_amarelo.png', alt: 'Quadrado Amarelo' },
  { key: '4', img: '/formas/circulo_azul.png', alt: 'Círculo Azul' },
];

function ResponseButtons({ onAnswer, disabled }: {
  onAnswer: (key: string) => void; disabled: boolean;
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div style={css.btnGrid}>
      {BUTTON_CONFIGS.map(({ key, img, alt }) => {
        const isHovered = hoveredKey === key && !disabled;
        const buttonStyle: React.CSSProperties = {
          ...css.answerBtn,
          opacity: disabled ? 0.3 : isHovered ? 1.0 : 0.7,
          cursor: disabled ? 'default' : 'pointer',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          background: 'rgba(255, 255, 255, 0.05)',
          border: isHovered ? '2px solid rgba(255, 255, 255, 0.4)' : '2px solid rgba(255, 255, 255, 0.1)',
        };

        return (
          <button
            key={key}
            disabled={disabled}
            style={buttonStyle}
            onClick={() => onAnswer(key)}
            onMouseEnter={() => setHoveredKey(key)}
            onMouseLeave={() => setHoveredKey(null)}
          >
            <img 
              src={img} 
              alt={alt} 
              style={{
                width: 60,
                height: 60,
                objectFit: 'contain',
              }} 
            />
          </button>
        );
      })}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────────
export const ColorShapeGame: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  const [phase,        setPhase]        = useState<GamePhase>('instructions');
  const [trialQueue,   setTrialQueue]   = useState<TaggedTrial[]>([]);
  const [trialIdx,     setTrialIdx]     = useState(0);
  const [currentTrial, setCurrentTrial] = useState<TaggedTrial | null>(null);
  const [evaluating,   setEvaluating]   = useState(false);

  const resultsRef      = useRef<(TrialResult & { block: BlockName })[]>([]);
  const stimulusTimeRef = useRef<number>(0);
  const timeoutRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTO = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const finishSession = useCallback((all: (TrialResult & { block: BlockName })[]) => {
    setPhase('done');
    setEvaluating(true);
    const blockA = all.filter(r => r.block === 'A');
    const blockB = all.filter(r => r.block === 'B');
    const mixed  = all.filter(r => r.block === 'mixed');
    const log: ColorShapeSessionLog = {
      sessionId,
      blockATrials:   blockA,
      blockBTrials:   blockB,
      mixedTrials:    mixed,
      practiceTrials: [],
      mainTrials:     all,
      startedAt:      new Date().toISOString(),
    };
    useColorShapeEvaluation(log)
      .then(() => { setEvaluating(false); onComplete?.(log); })
      .catch(() => { setEvaluating(false); onComplete?.(log); });
  }, [sessionId, onComplete]);

  const advanceTrial = useCallback((
    results: (TrialResult & { block: BlockName })[],
    queue: TaggedTrial[],
    idx: number,
  ) => {
    if (idx >= queue.length) {
      finishSession(results);
      return;
    }
    const trial = queue[idx];
    setCurrentTrial(trial); setTrialIdx(idx); setPhase('fixation');
    timeoutRef.current = setTimeout(() => {
      setPhase('stimulus');
      stimulusTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        handleResponse(null, trial, results, queue, idx);
      }, MAX_RESPONSE_MS);
    }, FIXATION_MS);
  }, [finishSession]); // eslint-disable-line

  const handleResponse = useCallback((
    key: string | null,
    trial: TaggedTrial,
    results: (TrialResult & { block: BlockName })[],
    queue: TaggedTrial[],
    idx: number,
  ) => {
    clearTO();
    const rt      = key === null ? -1 : Date.now() - stimulusTimeRef.current;
    const correct  = key !== null && isCorrect(trial, key);
    const timedOut = key === null;
    const prevRule = idx > 0 ? queue[idx - 1].rule : null;
    let isPersev = false;
    if (!correct && !timedOut && trial.trialType === 'switch' && prevRule !== null && key !== null) {
      if (prevRule === 'color') isPersev = COLOR_TO_BTN[trial.color] === key;
      else                      isPersev = SHAPE_TO_BTN[trial.shape] === key;
    }
    const result = {
      ...trial, keyPressed: key ?? '', correct, reactionMs: rt, timedOut, isPerseveration: isPersev,
    };
    const updated = [...results, result];
    resultsRef.current = updated;
    setPhase('iti');
    timeoutRef.current = setTimeout(() => advanceTrial(updated, queue, idx + 1), ITI_MS);
  }, [advanceTrial]); // eslint-disable-line

  useEffect(() => () => clearTO(), []);

  const startSession = () => {
    const queue = buildFullQueue();
    setTrialQueue(queue);
    resultsRef.current = [];
    advanceTrial([], queue, 0);
  };

  const handleBtnAnswer = (key: string) => {
    if (!currentTrial) return;
    handleResponse(key, currentTrial, resultsRef.current, trialQueue, trialIdx);
  };

  if (phase === 'instructions') return <Instructions onStart={startSession} />;

  if (phase === 'done') return (
    <div style={css.screen}>
      <p style={css.title}>Obrigado!</p>
      <p style={{ ...css.sub, textAlign: 'center' }}>
        {evaluating ? 'Processando...' : 'Atividade concluída.'}
      </p>
      {onClose && !evaluating && <button style={css.ghostBtn} onClick={onClose}>Sair</button>}
    </div>
  );

  const totalQ      = trialQueue.length;
  const progress    = totalQ > 0 ? Math.round((trialIdx / totalQ) * 100) : 0;
  const showStim    = phase === 'stimulus';
  const btnDisabled = phase === 'fixation' || phase === 'iti';

  return (
    <div style={{ ...css.gameScreen, background: NEUTRAL_BG }}>
      <div style={css.topBar}>
        <div style={css.progressTrack}>
          <div style={{ ...css.progressBar, width: `${progress}%` }} />
        </div>
      </div>

      {currentTrial && <RuleBadge rule={currentTrial.rule} />}

      <div style={css.stimulusArea}>
        {phase === 'fixation' && <div style={css.fixation}>·</div>}
        {showStim && currentTrial && (
          <img
            src={SHAPE_IMAGE[currentTrial.shape][currentTrial.color]}
            alt={`${currentTrial.color} ${currentTrial.shape}`}
            style={{
              width: 130,
              height: 130,
              objectFit: 'contain',
            }}
          />
        )}
        {phase === 'iti' && <div style={{ height: 130 }} />}
      </div>

      {currentTrial && (
        <ResponseButtons onAnswer={handleBtnAnswer} disabled={btnDisabled} />
      )}
    </div>
  );
};

const css: Record<string, React.CSSProperties> = {
  screen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 20, padding: 24,
    minHeight: '100%', minWidth: '100%',
    background: NEUTRAL_BG, color: '#e8e9f0', position: 'relative',
  },
  gameScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 20, padding: '48px 20px 24px',
    minHeight: '100%', minWidth: '100%',
    color: '#e8e9f0', position: 'relative',
  },
  topBar: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%',
  },
  stimulusArea: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160,
  },
  title:   { fontSize: 22, fontWeight: 800, margin: 0 },
  sub:     { fontSize: 14, color: '#8b8fa8', margin: 0, lineHeight: 1.6 },
  primaryBtn: {
    padding: '12px 36px', borderRadius: 99, fontSize: 15, fontWeight: 700,
    background: '#6c8ef5', color: '#fff', border: 'none', cursor: 'pointer',
  },
  ghostBtn: {
    padding: '10px 22px', borderRadius: 99, fontSize: 13, fontWeight: 500,
    background: 'rgba(255,255,255,0.06)', color: '#8b8fa8',
    border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer',
  },
  progressTrack: {
    width: '80%', maxWidth: 300, height: 4,
    background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden',
  },
  progressBar: {
    height: '100%', background: '#6c8ef5', borderRadius: 99, transition: 'width 0.2s',
  },
  fixation: {
    fontSize: 48, color: 'rgba(255,255,255,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 130, height: 130,
  },
  btnGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
    width: '100%', maxWidth: 440,
  },
  answerBtn: {
    minHeight: 80, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    background: 'rgba(255,255,255,0.07)',
    border: '2px solid rgba(255,255,255,0.18)',
    color: '#e8e9f0', transition: 'all 0.15s ease-in-out',
  },
};
