import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLOR_HEX, COLOR_KEYS, SHAPE_KEYS,
  NEUTRAL_BG,
  FIXATION_MS, MAX_RESPONSE_MS, FEEDBACK_MS, ITI_MS,
} from './constants';
import { buildPureTrials, buildMixedTrials, isCorrect } from './logic';
import { useColorShapeEvaluation } from './useColorShapeEvaluation';
import type { TrialConfig, TrialResult, ColorShapeSessionLog, RuleType, ShapeType, ColorName } from './types';

type BlockName = 'A' | 'B' | 'mixed';

type GamePhase =
  | 'instructions'
  | 'block_intro'
  | 'fixation'
  | 'stimulus'
  | 'feedback'
  | 'iti'
  | 'done';

interface Props {
  sessionId: string;
  onComplete?: (log: ColorShapeSessionLog) => void;
  onClose?:    () => void;
}

const BLOCK_A_TRIALS  = 20;
const BLOCK_B_TRIALS  = 20;
const MIXED_TRIALS    = 60;

// ── SVG shapes ──────────────────────────────────────────────────────────────────
function ShapeSVG({ shape, color, size = 120 }: { shape: ShapeType; color: ColorName; size?: number }) {
  const fill = COLOR_HEX[color];
  const s = size, c = s / 2;
  if (shape === 'circle') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><circle cx={c} cy={c} r={c * 0.82} fill={fill} /></svg>
  );
  if (shape === 'square') {
    const pad = s * 0.09;
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <rect x={pad} y={pad} width={s - pad * 2} height={s - pad * 2} fill={fill} rx={6} />
      </svg>
    );
  }
  if (shape === 'diamond') {
    const pad = s * 0.09;
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <rect x={pad} y={pad} width={s - pad * 2} height={s - pad * 2}
          fill={fill} rx={6} transform={`rotate(45 ${c} ${c})`} />
      </svg>
    );
  }
  const pts = `${c},${s * 0.08} ${s * 0.94},${s * 0.92} ${s * 0.06},${s * 0.92}`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts} fill={fill} /></svg>
  );
}

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

// ── Tela de instruções — apenas o essencial para o paciente ───────────────────
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

// ── Tela de transição entre blocos — instrução mínima ───────────────────────
function BlockIntro({ block, onStart }: { block: BlockName; onStart: () => void }) {
  const desc: Record<BlockName, string> = {
    A:     'Responda sempre a COR da figura.',
    B:     'Responda sempre a FORMA da figura.',
    mixed: 'A pergunta em cada tela indica o que deve responder.',
  };
  return (
    <div style={css.screen}>
      <p style={{ ...css.sub, textAlign: 'center', maxWidth: 300, fontSize: 16, color: '#c0c4d8' }}>
        {desc[block]}
      </p>
      <button style={css.primaryBtn} onClick={onStart}>Continuar</button>
    </div>
  );
}

// ── Botões de resposta ──────────────────────────────────────────────────────────
const COLOR_LABELS: Record<ColorName, string> = {
  red: 'Vermelho', blue: 'Azul', green: 'Verde', yellow: 'Amarelo',
};
const SHAPE_LABELS: Record<ShapeType, string> = {
  circle: 'Círculo', square: 'Quadrado', triangle: 'Triângulo', diamond: 'Losango',
};

function ResponseButtons({ rule, onAnswer, disabled }: {
  rule: RuleType; onAnswer: (key: string) => void; disabled: boolean;
}) {
  const items = rule === 'color'
    ? (['red', 'blue', 'green', 'yellow'] as ColorName[]).map(cl => ({ key: COLOR_KEYS[cl], label: COLOR_LABELS[cl] }))
    : (['circle', 'square', 'triangle', 'diamond'] as ShapeType[]).map(sh => ({ key: SHAPE_KEYS[sh], label: SHAPE_LABELS[sh] }));
  return (
    <div style={css.btnGrid}>
      {items.map(({ key, label }) => (
        <button key={key} disabled={disabled} style={css.answerBtn} onClick={() => onAnswer(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────────
export const ColorShapeGame: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  const [phase,        setPhase]        = useState<GamePhase>('instructions');
  const [currentBlock, setCurrentBlock] = useState<BlockName>('A');
  const [nextBlock,    setNextBlock]    = useState<BlockName | null>(null);
  const [trialQueue,   setTrialQueue]   = useState<TrialConfig[]>([]);
  const [trialIdx,     setTrialIdx]     = useState(0);
  const [currentTrial, setCurrentTrial] = useState<TrialConfig | null>(null);
  const [lastCorrect,  setLastCorrect]  = useState<boolean | null>(null);
  const [evaluating,   setEvaluating]   = useState(false);

  const blockARef   = useRef<TrialResult[]>([]);
  const blockBRef   = useRef<TrialResult[]>([]);
  const mixedRef    = useRef<TrialResult[]>([]);
  const [blockALog, setBlockALog] = useState<TrialResult[]>([]);
  const [blockBLog, setBlockBLog] = useState<TrialResult[]>([]);
  const [mixedLog,  setMixedLog]  = useState<TrialResult[]>([]);

  const stimulusTimeRef = useRef<number>(0);
  const timeoutRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTO = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const blockAccessors = (block: BlockName) => {
    if (block === 'A') return { ref: blockARef, setLog: setBlockALog, log: blockALog };
    if (block === 'B') return { ref: blockBRef, setLog: setBlockBLog, log: blockBLog };
    return               { ref: mixedRef,  setLog: setMixedLog,  log: mixedLog  };
  };

  const isPureBlock = (b: BlockName) => b === 'A' || b === 'B';

  const finishSession = useCallback((aLog: TrialResult[], bLog: TrialResult[], mLog: TrialResult[]) => {
    setPhase('done');
    setEvaluating(true);
    const log: ColorShapeSessionLog = {
      sessionId,
      blockATrials:   aLog,
      blockBTrials:   bLog,
      mixedTrials:    mLog,
      practiceTrials: [],
      mainTrials:     [...aLog, ...bLog, ...mLog],
      startedAt:      new Date().toISOString(),
    };
    useColorShapeEvaluation(log)
      .then(() => { setEvaluating(false); onComplete?.(log); })
      .catch(() => { setEvaluating(false); onComplete?.(log); });
  }, [sessionId, onComplete]);

  const advanceTrial = useCallback((
    results: TrialResult[], queue: TrialConfig[], idx: number, block: BlockName,
  ) => {
    if (idx >= queue.length) {
      if (block === 'A') {
        setNextBlock('B'); setPhase('block_intro');
      } else if (block === 'B') {
        setNextBlock('mixed'); setPhase('block_intro');
      } else {
        finishSession(blockARef.current, blockBRef.current, results);
      }
      return;
    }
    const trial = queue[idx];
    setCurrentTrial(trial); setTrialIdx(idx); setPhase('fixation');
    timeoutRef.current = setTimeout(() => {
      setPhase('stimulus');
      stimulusTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        handleResponse(null, trial, results, queue, idx, block);
      }, MAX_RESPONSE_MS);
    }, FIXATION_MS);
  }, [finishSession]); // eslint-disable-line

  const handleResponse = useCallback((
    key: string | null, trial: TrialConfig, results: TrialResult[],
    queue: TrialConfig[], idx: number, block: BlockName,
  ) => {
    clearTO();
    const rt      = key === null ? -1 : Date.now() - stimulusTimeRef.current;
    const correct  = key !== null && isCorrect(trial, key);
    const timedOut = key === null;
    const prevRule = idx > 0 ? queue[idx - 1].rule : null;
    let isPersev = false;
    if (!correct && !timedOut && trial.trialType === 'switch' && prevRule !== null && key !== null) {
      const k = key.toLowerCase();
      if (prevRule === 'color') isPersev = COLOR_KEYS[trial.color] === k;
      else                      isPersev = SHAPE_KEYS[trial.shape] === k;
    }
    const result: TrialResult = {
      ...trial, keyPressed: key ?? '', correct, reactionMs: rt, timedOut, isPerseveration: isPersev,
    };
    const updated = [...results, result];
    const { ref, setLog } = blockAccessors(block);
    ref.current = updated;
    setLog(updated);
    if (isPureBlock(block)) {
      setLastCorrect(timedOut ? false : correct);
      setPhase('feedback');
      timeoutRef.current = setTimeout(() => {
        setPhase('iti');
        timeoutRef.current = setTimeout(() => advanceTrial(updated, queue, idx + 1, block), ITI_MS);
      }, FEEDBACK_MS);
    } else {
      setPhase('iti');
      timeoutRef.current = setTimeout(() => advanceTrial(updated, queue, idx + 1, block), ITI_MS);
    }
  }, [advanceTrial]); // eslint-disable-line

  useEffect(() => () => clearTO(), []);

  const startBlock = (block: BlockName) => {
    setCurrentBlock(block);
    let queue: TrialConfig[];
    if (block === 'A')      queue = buildPureTrials('color', BLOCK_A_TRIALS);
    else if (block === 'B') queue = buildPureTrials('shape', BLOCK_B_TRIALS);
    else                    queue = buildMixedTrials(MIXED_TRIALS);
    setTrialQueue(queue);
    advanceTrial([], queue, 0, block);
  };

  const handleBtnAnswer = (key: string) => {
    if (!currentTrial) return;
    const { log } = blockAccessors(currentBlock);
    handleResponse(key, currentTrial, log, trialQueue, trialIdx, currentBlock);
  };

  if (phase === 'instructions') return <Instructions onStart={() => startBlock('A')} />;

  if (phase === 'block_intro' && nextBlock) return (
    <BlockIntro block={nextBlock} onStart={() => startBlock(nextBlock)} />
  );

  if (phase === 'done') return (
    <div style={css.screen}>
      <p style={css.title}>Obrigado!</p>
      <p style={{ ...css.sub, textAlign: 'center' }}>
        {evaluating ? 'Processando...' : 'Atividade concluída.'}
      </p>
      {onClose && !evaluating && <button style={{ ...css.ghostBtn, marginTop: 16 }} onClick={onClose}>Sair</button>}
    </div>
  );

  const totalQ      = trialQueue.length;
  const progress    = totalQ > 0 ? Math.round((trialIdx / totalQ) * 100) : 0;
  const showStim    = phase === 'stimulus' || phase === 'feedback';
  const btnDisabled = phase === 'feedback' || phase === 'fixation' || phase === 'iti';

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
          <div style={css.stimulusWrap}>
            <ShapeSVG shape={currentTrial.shape} color={currentTrial.color} size={130} />
            {phase === 'feedback' && (
              <div style={{ marginTop: 16, fontSize: 22, fontWeight: 800, color: lastCorrect ? '#6dbf87' : '#f08080' }}>
                {lastCorrect ? '✓ Certo' : '✗ Errado'}
              </div>
            )}
          </div>
        )}
        {phase === 'iti' && <div style={{ height: 130 }} />}
      </div>

      {currentTrial && (
        <ResponseButtons rule={currentTrial.rule} onAnswer={handleBtnAnswer} disabled={btnDisabled} />
      )}

      {onClose && (
        <button
          style={{ ...css.ghostBtn, position: 'absolute', top: 12, right: 12, padding: '6px 14px', fontSize: 12 }}
          onClick={onClose}>Sair
        </button>
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
  stimulusWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  btnGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
    width: '100%', maxWidth: 360,
  },
  answerBtn: {
    minHeight: 48, borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    background: 'rgba(255,255,255,0.07)',
    border: '2px solid rgba(255,255,255,0.18)',
    color: '#e8e9f0', transition: 'opacity 0.15s',
  },
};
