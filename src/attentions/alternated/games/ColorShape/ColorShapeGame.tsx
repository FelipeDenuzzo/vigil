import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COLOR_TO_BTN, SHAPE_TO_BTN,
  NEUTRAL_BG,
  FIXATION_MS, MAX_RESPONSE_MS, ITI_MS,
} from './constants';
import { buildPureTrials, buildMixedTrials, isCorrect } from './logic';
import { useColorShapeEvaluation } from './useColorShapeEvaluation';
import { persistColorShapeLog } from './ColorShapeEvaluationContainer';
import type { TrialConfig, TrialResult, ColorShapeSessionLog, RuleType, ShapeType, ColorName } from './types';

type GamePhase = 'instructions' | 'tutorial' | 'fixation' | 'stimulus' | 'iti' | 'done';

const TUTORIAL_STYLE_ID = 'colorshape-tutorial-style';
if (typeof document !== 'undefined' && !document.getElementById(TUTORIAL_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = TUTORIAL_STYLE_ID;
  style.textContent = `
    @keyframes csPulseHighlight {
      0% { box-shadow: 0 0 0 0 rgba(108, 142, 245, 0.8); border-color: rgba(108, 142, 245, 1); }
      70% { box-shadow: 0 0 0 12px rgba(108, 142, 245, 0); border-color: rgba(108, 142, 245, 1); }
      100% { box-shadow: 0 0 0 0 rgba(108, 142, 245, 0); border-color: rgba(255, 255, 255, 0.18); }
    }
    .cs-pulse {
      animation: csPulseHighlight 1.6s infinite ease-in-out !important;
      border-color: rgba(108, 142, 245, 1) !important;
    }
  `;
  document.head.appendChild(style);
}

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

function ResponseButtons({ onAnswer, disabled, highlightedKey, tooltipText }: {
  onAnswer: (key: string) => void;
  disabled: boolean;
  highlightedKey?: string;
  tooltipText?: string;
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div style={css.btnGrid}>
      {BUTTON_CONFIGS.map(({ key, img, alt }) => {
        const isHovered = hoveredKey === key && !disabled;
        const isHighlighted = key === highlightedKey;
        const buttonStyle: React.CSSProperties = {
          ...css.answerBtn,
          opacity: disabled ? 0.3 : isHovered || isHighlighted ? 1.0 : 0.7,
          cursor: disabled ? 'default' : 'pointer',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'all 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          background: 'rgba(255, 255, 255, 0.05)',
          border: isHovered ? '2px solid rgba(255, 255, 255, 0.4)' : isHighlighted ? '2px solid rgba(108, 142, 245, 0.6)' : '2px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
        };

        return (
          <button
            key={key}
            disabled={disabled}
            className={isHighlighted ? 'cs-pulse' : ''}
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
            {isHighlighted && tooltipText && (
              <div style={css.tooltip}>
                {tooltipText}
                <div style={css.tooltipArrow} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────────
export const ColorShapeGame: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  const [phase,        setPhase]        = useState<GamePhase>('instructions');
  const [tutorialStep, setTutorialStep] = useState<number>(0);
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
    // Persiste no sessionStorage para a rota /resultado funcionar após refresh
    try { persistColorShapeLog(log); } catch { /* silencioso */ }
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
    setPhase('tutorial');
    setTutorialStep(1);
  };

  const startRealGame = () => {
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

  if (phase === 'tutorial') {
    if (tutorialStep === 3) {
      return (
        <div style={{ ...css.screen, padding: '24px' }}>
          <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '3rem', margin: '0 auto' }}>🚀</span>
            <h2 style={{ margin: 0, color: '#6c8ef5', fontSize: '24px', fontWeight: 700 }}>
              Prática concluída!
            </h2>
            <h2 style={{ margin: '8px 0 0 0', textTransform: 'uppercase', fontSize: '18px', fontWeight: 700, color: '#e8e9f0' }}>
              Você entendeu como funciona?
            </h2>
            <p style={{ color: '#ffffff', fontSize: '14px', lineHeight: '1.6', marginBottom: '8px' }}>
              Você já sabe jogar! Agora o jogo real vai começar, mas sem as ajudas e balões explicativos.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <button style={{ ...css.primaryBtn, width: '100%', padding: '12px 16px', fontSize: '15px' }} onClick={startRealGame}>
                Ir para o Treino de Atenção →
              </button>
              <button style={{ ...css.ghostBtn, width: '100%', padding: '12px 16px', fontSize: '15px' }} onClick={() => setTutorialStep(1)}>
                Repetir o Simulado
              </button>
            </div>
          </div>
        </div>
      );
    }

    const isStep1 = tutorialStep === 1;
    const stimPath = isStep1
      ? '/formas/circulo_vermelho.png'
      : '/formas/triangulo_amarelo.png';
    const stimAlt = isStep1 ? 'Círculo Vermelho' : 'Triângulo Amarelo';
    const ruleLabel = isStep1 ? 'color' : 'shape';
    const titleText = isStep1 ? 'Aprenda a Jogar — Regra da COR' : 'Aprenda a Jogar — Regra da FORMA';
    const descText = isStep1
      ? 'Quando a regra for COR, você deve procurar o botão que tem a mesma cor, não importa o formato do desenho!'
      : 'Quando a regra for FORMA, você deve procurar o botão que tem o mesmo formato, não importa a cor do desenho!';
    const tooltipText = isStep1
      ? 'Clique aqui! Este botão é o Vermelho. Ignore que ele é um triângulo.'
      : 'Clique aqui! Este botão é o Triângulo. Ignore que ele é vermelho.';

    const handleTutorialClick = (key: string) => {
      if (key === '1') {
        setTutorialStep(prev => prev + 1);
      }
    };

    return (
      <div style={{ ...css.gameScreen, background: NEUTRAL_BG }}>
        {/* BADGE DE MODO DE PRÁTICA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)',
          color: '#eab308', padding: '8px 20px', borderRadius: '99px',
          fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.05em',
          width: 'fit-content', margin: '0 auto 16px auto'
        }}>
          <span style={{ fontSize: '18px' }}>🚧</span> MODO DE PRÁTICA
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', textAlign: 'center', padding: '0 20px' }}>
          <p style={{ ...css.title, fontSize: 20 }}>{titleText}</p>
          <p style={{ ...css.sub, maxWidth: 400, lineHeight: 1.5 }}>{descText}</p>
        </div>

        <div style={{ margin: '20px 0' }}>
          <RuleBadge rule={ruleLabel} />
        </div>

        <div style={css.stimulusArea}>
          <img
            src={stimPath}
            alt={stimAlt}
            style={{
              width: 130,
              height: 130,
              objectFit: 'contain',
            }}
          />
        </div>

        <div style={{ position: 'relative', marginTop: 20, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <ResponseButtons
            onAnswer={handleTutorialClick}
            disabled={false}
            highlightedKey="1"
            tooltipText={tooltipText}
          />
        </div>
      </div>
    );
  }

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
  sub:     { fontSize: 14, color: '#ffffff', margin: 0, lineHeight: 1.6 },
  primaryBtn: {
    padding: '12px 36px', borderRadius: 99, fontSize: 15, fontWeight: 700,
    background: '#6c8ef5', color: '#fff', border: 'none', cursor: 'pointer',
  },
  ghostBtn: {
    padding: '10px 22px', borderRadius: 99, fontSize: 13, fontWeight: 500,
    background: 'rgba(255,255,255,0.06)', color: '#ffffff',
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
  tooltip: {
    position: 'absolute',
    top: '115%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(20, 20, 35, 0.95)',
    border: '1px solid rgba(108, 142, 245, 0.6)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: '#e8e9f0',
    width: 170,
    textAlign: 'center',
    boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
    zIndex: 10,
    lineHeight: 1.4,
    pointerEvents: 'none',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: '6px solid rgba(20, 20, 35, 0.95)',
  },
};
