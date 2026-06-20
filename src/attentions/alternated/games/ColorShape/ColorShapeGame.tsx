import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLOR_HEX, COLOR_KEYS, SHAPE_KEYS,
  CUE_COLOR_BG, CUE_SHAPE_BG, NEUTRAL_BG,
  FIXATION_MS, MAX_RESPONSE_MS, FEEDBACK_MS, ITI_MS,
  MAIN_TRIALS,
} from './constants';
import { buildTrials, buildPracticeTrials, isCorrect } from './logic';
import { useColorShapeEvaluation } from './useColorShapeEvaluation';
import type { TrialConfig, TrialResult, ColorShapeSessionLog, RuleType, ShapeType, ColorName } from './types';

type GamePhase =
  | 'instructions'
  | 'practice_trial'
  | 'practice_feedback'
  | 'practice_done'
  | 'fixation'
  | 'stimulus'
  | 'iti'
  | 'done';

interface Props {
  sessionId: string;
  onComplete?: (log: ColorShapeSessionLog) => void;
  onClose?:    () => void;
}

// ── SVG shapes ──────────────────────────────────────────────────────────────────
function ShapeSVG({ shape, color, size = 120 }: { shape: ShapeType; color: ColorName; size?: number }) {
  const fill = COLOR_HEX[color];
  const s = size, c = s / 2;

  if (shape === 'circle') return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <circle cx={c} cy={c} r={c * 0.82} fill={fill} />
    </svg>
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
    // Quadrado rotacionado 45° em torno do centro — losango puro
    const pad = s * 0.09;
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <rect
          x={pad} y={pad}
          width={s - pad * 2} height={s - pad * 2}
          fill={fill}
          rx={6}
          transform={`rotate(45 ${c} ${c})`}
        />
      </svg>
    );
  }

  // triangle
  const pts = `${c},${s * 0.08} ${s * 0.94},${s * 0.92} ${s * 0.06},${s * 0.92}`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <polygon points={pts} fill={fill} />
    </svg>
  );
}

// ── Tela de instruções ─────────────────────────────────────────────────────────
function Instructions({ onStart }: { onStart: () => void }) {
  return (
    <div style={css.screen}>
      <p style={css.title}>🎨 Cor ou Forma</p>
      <p style={{ ...css.sub, maxWidth: 340, textAlign: 'center' }}>
        Você verá uma figura colorida na tela.
        A <b style={{ color: '#5588e0' }}>cor de fundo</b> diz qual regra seguir:
      </p>
      <div style={css.ruleBox}>
        <div style={{ ...css.rulePill, background: CUE_COLOR_BG }}>
          <span style={{ fontSize: 22 }}>🎨</span>
          <span>Fundo <b>azul</b> → toque na <b>cor</b> da figura</span>
        </div>
        <div style={{ ...css.rulePill, background: CUE_SHAPE_BG }}>
          <span style={{ fontSize: 22 }}>🔷</span>
          <span>Fundo <b>cinza</b> → toque na <b>forma</b> da figura</span>
        </div>
      </div>
      <p style={{ ...css.sub, color: '#6b6f88', fontSize: 12, textAlign: 'center', maxWidth: 300 }}>
        Primeiro vamos praticar algumas rodadas. Use os botões que aparecem na tela para responder.
      </p>
      <button style={css.primaryBtn} onClick={onStart}>Iniciar treino</button>
    </div>
  );
}

// ── Botões de resposta ───────────────────────────────────────────────────────────
const COLOR_LABELS: Record<ColorName, string> = {
  red: 'Vermelho', blue: 'Azul', green: 'Verde', yellow: 'Amarelo',
};
const SHAPE_LABELS: Record<ShapeType, string> = {
  circle: 'Círculo', square: 'Quadrado', triangle: 'Triângulo', diamond: 'Losango',
};

function ResponseButtons({
  rule, onAnswer, disabled,
}: {
  rule: RuleType;
  onAnswer: (key: string) => void;
  disabled: boolean;
}) {
  if (rule === 'color') {
    return (
      <div style={css.btnGrid}>
        {(['red', 'blue', 'green', 'yellow'] as ColorName[]).map(cl => (
          <button
            key={cl}
            disabled={disabled}
            style={{ ...css.answerBtn, borderColor: COLOR_HEX[cl], color: COLOR_HEX[cl] }}
            onClick={() => onAnswer(COLOR_KEYS[cl])}
          >
            {COLOR_LABELS[cl]}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div style={css.btnGrid}>
      {(['circle', 'square', 'triangle', 'diamond'] as ShapeType[]).map(sh => (
        <button
          key={sh}
          disabled={disabled}
          style={css.answerBtn}
          onClick={() => onAnswer(SHAPE_KEYS[sh])}
        >
          {SHAPE_LABELS[sh]}
        </button>
      ))}
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────────
export const ColorShapeGame: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  const [phase,        setPhase]        = useState<GamePhase>('instructions');
  const [trialQueue,   setTrialQueue]   = useState<TrialConfig[]>([]);
  const [trialIdx,     setTrialIdx]     = useState(0);
  const [isPractice,   setIsPractice]   = useState(true);
  const [currentTrial, setCurrentTrial] = useState<TrialConfig | null>(null);
  const [lastCorrect,  setLastCorrect]  = useState<boolean | null>(null);
  const [bgColor,      setBgColor]      = useState(NEUTRAL_BG);
  const [practiceLog,  setPracticeLog]  = useState<TrialResult[]>([]);
  const [mainLog,      setMainLog]      = useState<TrialResult[]>([]);
  const [evaluating,   setEvaluating]   = useState(false);

  const stimulusTimeRef = useRef<number>(0);
  const timeoutRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const practiceLogRef  = useRef<TrialResult[]>([]);
  const mainLogRef      = useRef<TrialResult[]>([]);

  const clearTO = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const advanceTrial = useCallback((
    results: TrialResult[],
    queue: TrialConfig[],
    idx: number,
    practice: boolean,
  ) => {
    if (idx >= queue.length) {
      if (practice) {
        setPhase('practice_done');
      } else {
        setPhase('done');
        setEvaluating(true);
        const log: ColorShapeSessionLog = {
          sessionId,
          practiceTrials: practiceLogRef.current,
          mainTrials: results,
          startedAt: new Date().toISOString(),
        };
        useColorShapeEvaluation(log)
          .then(() => { setEvaluating(false); onComplete?.(log); })
          .catch(() => { setEvaluating(false); onComplete?.(log); });
      }
      return;
    }

    const trial = queue[idx];
    setCurrentTrial(trial);
    setTrialIdx(idx);
    setBgColor(NEUTRAL_BG);
    setPhase('fixation');

    timeoutRef.current = setTimeout(() => {
      setBgColor(trial.rule === 'color' ? CUE_COLOR_BG : CUE_SHAPE_BG);
      setPhase(practice ? 'practice_trial' : 'stimulus');
      stimulusTimeRef.current = Date.now();
      timeoutRef.current = setTimeout(() => {
        handleResponse(null, trial, results, queue, idx, practice);
      }, MAX_RESPONSE_MS);
    }, FIXATION_MS);
  }, [sessionId, onComplete]); // eslint-disable-line

  const handleResponse = useCallback((
    key: string | null,
    trial: TrialConfig,
    results: TrialResult[],
    queue: TrialConfig[],
    idx: number,
    practice: boolean,
  ) => {
    clearTO();
    const rt       = key === null ? -1 : Date.now() - stimulusTimeRef.current;
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
      ...trial, keyPressed: key ?? '', correct, reactionMs: rt,
      timedOut, isPerseveration: isPersev,
    };
    const updated = [...results, result];

    if (practice) {
      practiceLogRef.current = updated;
      setPracticeLog(updated);
      setLastCorrect(timedOut ? false : correct);
      setPhase('practice_feedback');
      timeoutRef.current = setTimeout(() => {
        setBgColor(NEUTRAL_BG);
        setPhase('iti');
        timeoutRef.current = setTimeout(() => advanceTrial(updated, queue, idx + 1, true), ITI_MS);
      }, FEEDBACK_MS);
    } else {
      mainLogRef.current = updated;
      setMainLog(updated);
      setBgColor(NEUTRAL_BG);
      setPhase('iti');
      timeoutRef.current = setTimeout(() => advanceTrial(updated, queue, idx + 1, false), ITI_MS);
    }
  }, [advanceTrial]);

  useEffect(() => () => clearTO(), []);

  const startPractice = () => {
    const q = buildPracticeTrials();
    setTrialQueue(q); setIsPractice(true);
    setPracticeLog([]); practiceLogRef.current = [];
    advanceTrial([], q, 0, true);
  };
  const startMain = () => {
    const q = buildTrials(MAIN_TRIALS);
    setTrialQueue(q); setIsPractice(false);
    setMainLog([]); mainLogRef.current = [];
    advanceTrial([], q, 0, false);
  };

  const handleBtnAnswer = (key: string) => {
    if (!currentTrial) return;
    handleResponse(
      key, currentTrial,
      isPractice ? practiceLog : mainLog,
      trialQueue, trialIdx, isPractice,
    );
  };

  if (phase === 'instructions') return <Instructions onStart={startPractice} />;

  if (phase === 'practice_done') return (
    <div style={css.screen}>
      <p style={{ fontSize: 40 }}>✅</p>
      <p style={css.title}>Treino concluído!</p>
      <p style={{ ...css.sub, textAlign: 'center', maxWidth: 300 }}>
        Ótimo! Agora começa a sessão de verdade — o jogo não vai mais mostrar se você acertou ou errou.
      </p>
      <button style={css.primaryBtn} onClick={startMain}>Começar</button>
      {onClose && <button style={css.ghostBtn} onClick={onClose}>Sair</button>}
    </div>
  );

  if (phase === 'done') return (
    <div style={css.screen}>
      <p style={{ fontSize: 40 }}>🏆</p>
      <p style={css.title}>Sessão concluída!</p>
      <p style={{ ...css.sub, textAlign: 'center' }}>
        {evaluating ? 'Analisando seu desempenho...' : 'Resultado sendo processado.'}
      </p>
      {onClose && !evaluating &&
        <button style={{ ...css.ghostBtn, marginTop: 16 }} onClick={onClose}>Sair</button>}
    </div>
  );

  const ruleLabelText: Record<RuleType, string> = { color: 'Responda a COR', shape: 'Responda a FORMA' };
  const totalQ   = trialQueue.length;
  const progress = totalQ > 0 ? Math.round((trialIdx / totalQ) * 100) : 0;
  const showStim = phase === 'stimulus' || phase === 'practice_trial' || phase === 'practice_feedback';
  const isPure   = currentTrial?.trialType === 'pure';
  const btnDisabled = phase === 'practice_feedback' || phase === 'fixation' || phase === 'iti';

  return (
    <div style={{ ...css.screen, background: bgColor, transition: 'background 0.12s' }}>
      {/* HUD */}
      <div style={css.hud}>
        <span style={{ color: '#8b8fa8', fontSize: 12 }}>
          {isPractice
            ? `Treino ${trialIdx + 1}/12${isPure ? ' — Regra fixa' : ' — Alternando'}`
            : `${trialIdx}/${totalQ}`}
        </span>
        {!isPractice && (
          <div style={css.progressTrack}>
            <div style={{ ...css.progressBar, width: `${progress}%` }} />
          </div>
        )}
        {currentTrial && (
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            color: currentTrial.rule === 'color' ? '#7ab4f8' : '#b0b0b0',
          }}>
            {ruleLabelText[currentTrial.rule]}
          </span>
        )}
      </div>

      {/* Fixação */}
      {phase === 'fixation' && <div style={css.fixation}>·</div>}

      {/* Estímulo */}
      {showStim && currentTrial && (
        <div style={css.stimulusWrap}>
          <ShapeSVG shape={currentTrial.shape} color={currentTrial.color} size={130} />
          {phase === 'practice_feedback' && (
            <div style={{
              marginTop: 16, fontSize: 22, fontWeight: 800,
              color: lastCorrect ? '#6dbf87' : '#f08080',
            }}>
              {lastCorrect ? '✓ Certo' : '✗ Errado'}
            </div>
          )}
        </div>
      )}

      {phase === 'iti' && <div style={{ height: 130 }} />}

      {/* Botões de resposta */}
      {currentTrial && (showStim || phase === 'iti') && (
        <ResponseButtons
          rule={currentTrial.rule}
          onAnswer={handleBtnAnswer}
          disabled={btnDisabled}
        />
      )}

      {onClose && (
        <button
          style={{ ...css.ghostBtn, position: 'absolute', top: 12, right: 12, padding: '6px 14px', fontSize: 12 }}
          onClick={onClose}>Sair</button>
      )}
    </div>
  );
};

const css: Record<string, React.CSSProperties> = {
  screen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 16, padding: 20,
    minHeight: '100%', minWidth: '100%',
    background: NEUTRAL_BG, color: '#e8e9f0', position: 'relative',
  },
  title:   { fontSize: 22, fontWeight: 800, margin: 0 },
  sub:     { fontSize: 14, color: '#8b8fa8', margin: 0, lineHeight: 1.6 },
  ruleBox: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 },
  rulePill: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderRadius: 12, fontSize: 14, color: '#e8e9f0',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  primaryBtn: {
    padding: '12px 36px', borderRadius: 99, fontSize: 15, fontWeight: 700,
    background: '#6c8ef5', color: '#fff', border: 'none', cursor: 'pointer',
  },
  ghostBtn: {
    padding: '10px 22px', borderRadius: 99, fontSize: 13, fontWeight: 500,
    background: 'rgba(255,255,255,0.06)', color: '#8b8fa8',
    border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer',
  },
  hud: {
    position: 'absolute', top: 12, left: 0, right: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '0 16px',
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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    width: '100%',
    maxWidth: 360,
    marginTop: 8,
  },
  answerBtn: {
    minHeight: 48,
    borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    background: 'rgba(255,255,255,0.07)',
    border: '2px solid rgba(255,255,255,0.18)',
    color: '#e8e9f0',
    transition: 'opacity 0.15s',
  },
};
