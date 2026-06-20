import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLOR_HEX, COLOR_KEYS, SHAPE_KEYS,
  CUE_COLOR_BG, CUE_SHAPE_BG, NEUTRAL_BG,
  FIXATION_MS, MAX_RESPONSE_MS, FEEDBACK_MS, ITI_MS,
  MAIN_TRIALS,
} from './constants';
import { buildTrials, buildPracticeTrials, isCorrect, allValidKeys } from './logic';
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

// ── SVG shapes ────────────────────────────────────────────────
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
  const pts = `${c},${s * 0.08} ${s * 0.94},${s * 0.92} ${s * 0.06},${s * 0.92}`;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={pts} fill={fill} /></svg>
  );
}

// ── Tela de instruções ────────────────────────────────────────
function Instructions({ onStart }: { onStart: () => void }) {
  return (
    <div style={css.screen}>
      <p style={css.title}>🎯 Cor ou Forma</p>
      <p style={{ ...css.sub, maxWidth: 340, textAlign: 'center' }}>
        Em cada tentativa você verá uma figura no centro da tela.
        A <b style={{ color: '#5588e0' }}>cor de fundo</b> indica qual regra usar:
      </p>
      <div style={css.ruleBox}>
        <div style={{ ...css.rulePill, background: CUE_COLOR_BG }}>
          <span style={{ fontSize: 22 }}>🎨</span>
          <span>Fundo <b>azul</b> → responda a <b>cor</b></span>
        </div>
        <div style={{ ...css.rulePill, background: CUE_SHAPE_BG }}>
          <span style={{ fontSize: 22 }}>🔷</span>
          <span>Fundo <b>cinza</b> → responda a <b>forma</b></span>
        </div>
      </div>
      <div style={css.keyBox}>
        <p style={css.keyTitle}>Teclas — Cor</p>
        <div style={css.keyRow}>
          {(['red','blue','green','yellow'] as ColorName[]).map(cl => (
            <span key={cl} style={{ ...css.keyChip, borderColor: COLOR_HEX[cl] }}>
              <span style={{ color: COLOR_HEX[cl], fontWeight: 700 }}>
                {cl === 'red' ? 'Verm' : cl === 'blue' ? 'Azul' : cl === 'green' ? 'Verde' : 'Amar'}
              </span>
              <kbd style={css.kbd}>{COLOR_KEYS[cl].toUpperCase()}</kbd>
            </span>
          ))}
        </div>
        <p style={{ ...css.keyTitle, marginTop: 12 }}>Teclas — Forma</p>
        <div style={css.keyRow}>
          {(['circle','square','triangle'] as ShapeType[]).map(sh => (
            <span key={sh} style={css.keyChip}>
              <span style={{ color: '#c8cad8', fontWeight: 700 }}>
                {sh === 'circle' ? 'Círculo' : sh === 'square' ? 'Quadrado' : 'Triângulo'}
              </span>
              <kbd style={css.kbd}>{SHAPE_KEYS[sh].toUpperCase()}</kbd>
            </span>
          ))}
        </div>
      </div>
      <p style={{ ...css.sub, color: '#6b6f88', fontSize: 12, textAlign: 'center', maxWidth: 300 }}>
        Começaremos com 12 tentativas de treino (4 com regra fixa + 8 alternando).
        Você receberá feedback em cada resposta.
      </p>
      <button style={css.primaryBtn} onClick={onStart}>Iniciar treino</button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
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
  const phaseRef        = useRef<GamePhase>('instructions');
  const currentRef      = useRef<TrialConfig | null>(null);
  const practiceRef     = useRef(true);
  const practiceLogRef  = useRef<TrialResult[]>([]);
  const mainLogRef      = useRef<TrialResult[]>([]);

  useEffect(() => { phaseRef.current    = phase;        }, [phase]);
  useEffect(() => { currentRef.current  = currentTrial; }, [currentTrial]);
  useEffect(() => { practiceRef.current = isPractice;   }, [isPractice]);

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
    // Perseveração: switch + errou + tecla = resposta certa pela regra anterior
    const prevRule = idx > 0 ? queue[idx - 1].rule : null;
    let isPersev = false;
    if (!correct && !timedOut && trial.trialType === 'switch' && prevRule !== null) {
      const k = key!.toLowerCase();
      const { COLOR_KEYS: ck, SHAPE_KEYS: sk } = require('./constants');
      if (prevRule === 'color') isPersev = ck[trial.color] === k;
      else                      isPersev = sk[trial.shape] === k;
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

  // Listener de teclado (rebuild quando trial muda)
  useEffect(() => {
    if (phase !== 'stimulus' && phase !== 'practice_trial') return;
    const validKeys = allValidKeys();
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (!validKeys.includes(k)) return;
      e.preventDefault();
      clearTO();
      handleResponse(
        k, currentTrial!,
        isPractice ? practiceLog : mainLog,
        trialQueue, trialIdx, isPractice,
      );
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, currentTrial, trialQueue, trialIdx, isPractice, practiceLog, mainLog, handleResponse]);

  useEffect(() => () => clearTO(), []);

  // ── Handlers de fase ─────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────
  if (phase === 'instructions') return <Instructions onStart={startPractice} />;

  if (phase === 'practice_done') return (
    <div style={css.screen}>
      <p style={{ fontSize: 40 }}>✅</p>
      <p style={css.title}>Treino concluído!</p>
      <p style={{ ...css.sub, textAlign: 'center', maxWidth: 300 }}>
        Você completou as 12 tentativas de treino.<br />
        Agora começa a fase principal — sem feedback após cada resposta.
      </p>
      <button style={css.primaryBtn} onClick={startMain}>Iniciar fase principal</button>
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

  // ── Tela de jogo ──────────────────────────────────────────────
  const ruleLabelText: Record<RuleType, string> = { color: 'Responda a COR', shape: 'Responda a FORMA' };
  const totalQ   = trialQueue.length;
  const progress = totalQ > 0 ? Math.round((trialIdx / totalQ) * 100) : 0;
  const showStim = phase === 'stimulus' || phase === 'practice_trial' || phase === 'practice_feedback';
  const isPure   = currentTrial?.trialType === 'pure';

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

      {showStim && (
        <div style={css.keyGuide}>
          <span style={{ color: '#6b6f88', fontSize: 11 }}>
            Cor: Verm=J Azul=K Verde=L Amar=H&nbsp;&nbsp;|&nbsp;&nbsp;Forma: Círculo=A Quadrado=S Triângulo=D
          </span>
        </div>
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
  keyBox: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 12,
    padding: '12px 16px', width: '100%', maxWidth: 360,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  keyTitle: { fontSize: 11, fontWeight: 700, color: '#8b8fa8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' },
  keyRow:   { display: 'flex', gap: 6, flexWrap: 'wrap' },
  keyChip:  {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.05)', borderRadius: 8,
    padding: '4px 8px', fontSize: 12,
    border: '1px solid rgba(255,255,255,0.10)',
  },
  kbd: {
    background: 'rgba(255,255,255,0.12)', borderRadius: 4,
    padding: '2px 6px', fontSize: 12, fontFamily: 'monospace',
    border: '1px solid rgba(255,255,255,0.15)', color: '#e8e9f0',
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
  keyGuide: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    textAlign: 'center', padding: '0 12px',
  },
};
