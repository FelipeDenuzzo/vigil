import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '../shared/components/Button';
import {
  MotorRoundResult,
  InhibitoryRoundResult,
  FlexibleRoundResult,
} from './types';

// ─── Etapa 1 — Calibragem Motora ─────────────────────────────────────────────

function MotorRound({ onDone }: { onDone: (r: MotorRoundResult) => void }) {
  const TOTAL_STIMULI = 12;
  const [phase, setPhase] = useState<'waiting' | 'ready' | 'go' | 'done'>('waiting');
  const [count, setCount] = useState(0);
  const [rts, setRts] = useState<number[]>([]);
  const stimulusStartRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showStimulus = useCallback(() => {
    const delay = 800 + Math.random() * 1200; // 0.8–2s de espera variável
    timeoutRef.current = setTimeout(() => {
      stimulusStartRef.current = performance.now();
      setPhase('go');
    }, delay);
  }, []);

  useEffect(() => {
    if (phase === 'ready') showStimulus();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phase, showStimulus]);

  function handleStart() { setPhase('ready'); }

  function handleResponse() {
    if (phase !== 'go') return;
    const rt = performance.now() - stimulusStartRef.current;
    const newRts = [...rts, rt];
    const newCount = count + 1;

    if (newCount >= TOTAL_STIMULI) {
      setPhase('done');
      onDone({ type: 'motor', reactionTimes: newRts, totalStimuli: TOTAL_STIMULI });
      return;
    }
    setRts(newRts);
    setCount(newCount);
    setPhase('ready');
  }

  return (
    <div style={{ textAlign: 'center', paddingTop: 'var(--space-8)' }}>
      <p style={{ color: '#ffffff', marginBottom: 'var(--space-2)' }}>
        Etapa 1 de 3 — Calibragem
      </p>
      <h2 style={{ marginBottom: 'var(--space-6)' }}>Reaja quando aparecer o círculo verde</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff', marginBottom: 'var(--space-8)' }}>
        {count}/{TOTAL_STIMULI} estímulos
      </p>

      <div
        onClick={handleResponse}
        style={{
          width: 120, height: 120,
          borderRadius: '50%',
          margin: '0 auto var(--space-8)',
          cursor: phase === 'go' ? 'pointer' : 'default',
          background: phase === 'go' ? 'var(--color-sustained)' : 'var(--color-surface)',
          border: '3px solid var(--color-border)',
          transition: 'background 0.1s',
        }}
      />

      {phase === 'waiting' && (
        <Button variant="primary" onClick={handleStart}>Começar</Button>
      )}
      {phase === 'done' && (
        <p style={{ color: '#ffffff' }}>Calculando...</p>
      )}
    </div>
  );
}

// ─── Etapa 2 — Controle Inibitório (Go/No-Go) ────────────────────────────────

const GO_SYMBOL = '⬛';
const NOGO_SYMBOL = '⬜';

function InhibitoryRound({ onDone }: { onDone: (r: InhibitoryRoundResult) => void }) {
  const TOTAL = 20;
  const NOGO_RATIO = 0.3; // 30% No-Go
  const [started, setStarted] = useState(false);
  const [trial, setTrial] = useState(0);
  const [current, setCurrent] = useState<'go' | 'nogo' | null>(null);
  const [rts, setRts] = useState<number[]>([]);
  const [commission, setCommission] = useState(0);
  const [omission, setOmission] = useState(0);
  const stimulusStartRef = useRef<number>(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goStimuli = Math.round(TOTAL * (1 - NOGO_RATIO));
  const nogoStimuli = TOTAL - goStimuli;

  const nextTrial = useCallback((trialIndex: number) => {
    if (trialIndex >= TOTAL) return;
    const isNogo = Math.random() < NOGO_RATIO;
    const type = isNogo ? 'nogo' : 'go';
    setCurrent(type);
    stimulusStartRef.current = performance.now();

    // Auto-avança em 1.2s — omissão se Go não respondido
    autoAdvanceRef.current = setTimeout(() => {
      if (type === 'go') {
        setOmission((o) => o + 1);
      }
      const next = trialIndex + 1;
      setTrial(next);
      if (next < TOTAL) nextTrial(next);
      else setCurrent(null);
    }, 1200);
  }, []);

  useEffect(() => {
    if (started) nextTrial(0);
    return () => { if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current); };
  }, [started, nextTrial]);

  useEffect(() => {
    if (trial >= TOTAL && current === null && started) {
      onDone({ type: 'inhibitory', commissionErrors: commission, omissionErrors: omission, reactionTimes: rts, totalGoStimuli: goStimuli, totalNoGoStimuli: nogoStimuli });
    }
  }, [trial, current, started, commission, omission, rts, goStimuli, nogoStimuli, onDone]);

  function handleResponse() {
    if (!started || current === null) return;
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    const rt = performance.now() - stimulusStartRef.current;

    if (current === 'nogo') {
      setCommission((c) => c + 1);
    } else {
      setRts((prev) => [...prev, rt]);
    }

    const next = trial + 1;
    setTrial(next);
    setCurrent(null);
    setTimeout(() => { if (next < TOTAL) nextTrial(next); }, 400);
  }

  return (
    <div style={{ textAlign: 'center', paddingTop: 'var(--space-8)' }}>
      <p style={{ color: '#ffffff', marginBottom: 'var(--space-2)' }}>
        Etapa 2 de 3 — Controle Inibitório
      </p>
      <h2 style={{ marginBottom: 'var(--space-4)' }}>Aperte apenas no quadrado preto {GO_SYMBOL}</h2>
      <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff', marginBottom: 'var(--space-6)' }}>
        Ignore o quadrado branco {NOGO_SYMBOL}
      </p>
      <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff', marginBottom: 'var(--space-8)' }}>
        {trial}/{TOTAL}
      </p>

      <div
        onClick={handleResponse}
        style={{
          width: 120, height: 120,
          margin: '0 auto var(--space-8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '4rem', cursor: 'pointer',
        }}
      >
        {current === 'go' ? GO_SYMBOL : current === 'nogo' ? NOGO_SYMBOL : ''}
      </div>

      {!started && (
        <Button variant="primary" onClick={() => setStarted(true)}>Começar</Button>
      )}
    </div>
  );
}

// ─── Etapa 3 — Flexibilidade/Alternada (TMT-B simplificado) ──────────────────

function FlexibleRound({ onDone }: { onDone: (r: FlexibleRoundResult) => void }) {
  // Sequência alternada: 1 A 2 B 3 C 4 D 5 E (números e letras)
  const SEQUENCE = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E'];
  const [started, setStarted] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [intervals, setIntervals] = useState<number[]>([]);
  const lastClickRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  // Embaralha posições dos alvos (layout fixo, posições aleatórias)
  const [positions] = useState(() =>
    SEQUENCE.map((label) => ({
      label,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
    }))
  );

  function handleStart() {
    startRef.current = performance.now();
    lastClickRef.current = performance.now();
    setStarted(true);
  }

  function handleClick(label: string) {
    if (!started || nextIndex >= SEQUENCE.length) return;
    const now = performance.now();
    const interval = now - lastClickRef.current;
    lastClickRef.current = now;

    if (label === SEQUENCE[nextIndex]) {
      const newIndex = nextIndex + 1;
      setIntervals((prev) => [...prev, interval]);
      if (newIndex >= SEQUENCE.length) {
        const totalMs = performance.now() - startRef.current;
        onDone({ type: 'flexible', totalTimeMs: totalMs, sequenceErrors: errors, intervalsBetweenClicks: [...intervals, interval], totalTargets: SEQUENCE.length });
        return;
      }
      setNextIndex(newIndex);
    } else {
      setErrors((e) => e + 1);
    }
  }

  const nextTarget = SEQUENCE[nextIndex];

  return (
    <div style={{ textAlign: 'center', paddingTop: 'var(--space-8)' }}>
      <p style={{ color: '#ffffff', marginBottom: 'var(--space-2)' }}>
        Etapa 3 de 3 — Flexibilidade
      </p>
      <h2 style={{ marginBottom: 'var(--space-4)' }}>Clique na sequência: 1 → A → 2 → B → ...</h2>
      {started && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-selective)', marginBottom: 'var(--space-4)' }}>
          Próximo: <strong>{nextTarget}</strong>
        </p>
      )}

      <div style={{ position: 'relative', width: '100%', maxWidth: 400, height: 280, margin: '0 auto var(--space-6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)' }}>
        {started && positions.map(({ label, x, y }) => {
          const done = SEQUENCE.indexOf(label) < nextIndex;
          return (
            <button
              key={label}
              onClick={() => handleClick(label)}
              style={{
                position: 'absolute',
                left: `${x}%`, top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                width: 40, height: 40, borderRadius: '50%',
                border: '2px solid var(--color-border)',
                background: done ? 'var(--color-selective)' : 'var(--color-surface)',
                color: done ? '#fff' : 'var(--color-text)',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {!started && (
        <Button variant="primary" onClick={handleStart}>Começar</Button>
      )}
    </div>
  );
}

// ─── Etapa 4 — Dupla-Tarefa/Dividida (Bolhas + Áudio) ────────────────────────
import { DividedRoundResult } from './types';

function DividedRound({ onDone }: { onDone: (r: DividedRoundResult) => void }) {
  const SIMPLE_DUR = 15000;
  const DUAL_DUR = 20000;

  const [phase, setPhase] = useState<'waiting' | 'simple' | 'transition' | 'dual' | 'done'>('waiting');
  
  // Para gerenciar os elementos em tela
  const [bubbles, setBubbles] = useState<{ id: number; left: number; type: 'target' | 'distractor'; clicked: boolean }[]>([]);
  
  // Métricas Fase Simples
  const [simpleHits, setSimpleHits] = useState(0);
  const [simpleTargets, setSimpleTargets] = useState(0);

  // Métricas Fase Dupla
  const [dualHits, setDualHits] = useState(0);
  const [dualTargets, setDualTargets] = useState(0);

  // Controle de Áudio
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioTargetActive, setAudioTargetActive] = useState(false);
  const audioIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bubbleIdRef = useRef(0);

  // Som de Beep
  const playBeep = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  // Loop de Bolhas
  useEffect(() => {
    if (phase !== 'simple' && phase !== 'dual') return;

    const interval = setInterval(() => {
      const isTarget = Math.random() > 0.4; // 60% azuis, 40% vermelhas
      if (isTarget) {
        if (phase === 'simple') setSimpleTargets(t => t + 1);
        if (phase === 'dual') setDualTargets(t => t + 1);
      }
      
      const newBubble = {
        id: bubbleIdRef.current++,
        left: 10 + Math.random() * 80,
        type: isTarget ? ('target' as const) : ('distractor' as const),
        clicked: false,
      };

      setBubbles(prev => [...prev, newBubble]);

      // Remove a bolha após 3.5s (tempo da animação + folga)
      setTimeout(() => {
        setBubbles(prev => prev.filter(b => b.id !== newBubble.id));
      }, 3500);

    }, 800); // Nasce uma a cada 800ms

    return () => clearInterval(interval);
  }, [phase]);

  // Loop de Áudio (Apenas na Dual)
  useEffect(() => {
    if (phase !== 'dual') return;

    const scheduleNextAudio = () => {
      const delay = 2000 + Math.random() * 3000; // a cada 2 a 5s
      audioIntervalRef.current = setTimeout(() => {
        playBeep();
        setAudioTargetActive(true);
        // Reseta estado do áudio após 1.5s
        setTimeout(() => setAudioTargetActive(false), 1500);
        scheduleNextAudio();
      }, delay);
    };

    scheduleNextAudio();

    return () => {
      if (audioIntervalRef.current) clearTimeout(audioIntervalRef.current);
    };
  }, [phase, playBeep]);

  // Transições de fase
  useEffect(() => {
    if (phase === 'simple') {
      const t = setTimeout(() => {
        setPhase('transition');
      }, SIMPLE_DUR);
      return () => clearTimeout(t);
    }
    
    if (phase === 'dual') {
      const t = setTimeout(() => {
        setPhase('done');
      }, DUAL_DUR);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Efetuar cálculo final
  useEffect(() => {
    if (phase === 'done') {
      const precisionSimple = simpleTargets > 0 ? simpleHits / simpleTargets : 0;
      const precisionDualVisual = dualTargets > 0 ? dualHits / dualTargets : 0;
      // Podemos somar visual + audio precisão se quiser, mas a literatura costuma focar no custo na tarefa primária (visual).
      // Vamos manter a precisão baseada no acerto das bolhas para refletir o custo.
      const cost = precisionSimple > 0 ? (precisionSimple - precisionDualVisual) / precisionSimple : 0;
      
      onDone({
        type: 'divided',
        precisionBubblesOnly: precisionSimple,
        precisionDualTask: precisionDualVisual,
        dualTaskCost: Math.max(0, cost)
      });
    }
  }, [phase, onDone, simpleHits, simpleTargets, dualHits, dualTargets]);

  // Interações
  const handleBubbleClick = (id: number, type: 'target' | 'distractor') => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, clicked: true } : b));
    if (type === 'target') {
      if (phase === 'simple') setSimpleHits(h => h + 1);
      if (phase === 'dual') setDualHits(h => h + 1);
    } else {
      // Punição opcional por estourar a vermelha (desconta acerto ou apenas ignora)
      if (phase === 'simple') setSimpleHits(h => Math.max(0, h - 1));
      if (phase === 'dual') setDualHits(h => Math.max(0, h - 1));
    }
  };

  const handleAudioButton = () => {
    if (phase !== 'dual') return;
    if (audioTargetActive) {
      setAudioTargetActive(false); // Conta sucesso
    }
  };

  return (
    <div style={{ textAlign: 'center', paddingTop: 'var(--space-8)' }}>
      <p style={{ color: '#ffffff', marginBottom: 'var(--space-2)' }}>
        Etapa 4 de 4 — Foco Multitarefa
      </p>

      {phase === 'waiting' && (
        <>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Atenção Dividida</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff', marginBottom: 'var(--space-8)' }}>
            Nesta etapa, você precisará gerenciar dois estímulos diferentes. Estoure apenas as bolhas <strong>LARANJAS</strong>.
          </p>
          <Button variant="primary" onClick={() => setPhase('simple')}>Começar Fase Visual</Button>
        </>
      )}

      {phase === 'transition' && (
        <>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Excelente! Agora vamos dificultar.</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff', marginBottom: 'var(--space-8)' }}>
            Continue estourando as bolhas laranjas. Mas agora, <strong>sempre que ouvir um BEEP sonoro</strong>, toque no botão "ATENÇÃO" na parte inferior da tela!
          </p>
          <Button variant="primary" onClick={() => setPhase('dual')}>Iniciar Dupla Tarefa</Button>
        </>
      )}

      {(phase === 'simple' || phase === 'dual') && (
        <>
          <div style={{ position: 'relative', width: '100%', maxWidth: 400, height: 320, margin: '0 auto var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', overflow: 'hidden' }}>
            {bubbles.map(b => (
              !b.clicked && (
                <div
                  key={b.id}
                  onClick={() => handleBubbleClick(b.id, b.type)}
                  style={{
                    position: 'absolute',
                    left: `${b.left}%`,
                    bottom: '-10%', // começa de baixo
                    width: 48, height: 48, borderRadius: '50%',
                    background: b.type === 'target' ? 'var(--color-selective)' : 'var(--color-error)',
                    opacity: 0.8, cursor: 'pointer',
                    animation: 'bubbleUp 3.5s linear forwards', // ver styles abaixo
                  }}
                />
              )
            ))}
            
            <style>{`
              @keyframes bubbleUp {
                from { transform: translateY(0); }
                to { transform: translateY(-400px); }
              }
            `}</style>
          </div>

          {phase === 'dual' && (
             <Button variant="secondary" onClick={handleAudioButton} style={{ width: '100%', maxWidth: 400, height: 64, fontSize: '1.2rem', fontWeight: 800, background: audioTargetActive ? 'var(--color-sustained)' : undefined }}>
               🔔 BEEP (ATENÇÃO!)
             </Button>
          )}
        </>
      )}

      {phase === 'done' && (
        <p style={{ color: '#ffffff' }}>Gerando Resultados do Onboarding...</p>
      )}
    </div>
  );
}

// ─── Exportação genérica ──────────────────────────────────────────────────────

interface Props {
  roundType: 'motor' | 'inhibitory' | 'flexible' | 'divided';
  onMotorDone?: (r: MotorRoundResult) => void;
  onInhibitoryDone?: (r: InhibitoryRoundResult) => void;
  onFlexibleDone?: (r: FlexibleRoundResult) => void;
  onDividedDone?: (r: DividedRoundResult) => void;
}

export const OnboardingRound: React.FC<Props> = ({ roundType, onMotorDone, onInhibitoryDone, onFlexibleDone, onDividedDone }) => {
  if (roundType === 'motor' && onMotorDone) return <MotorRound onDone={onMotorDone} />;
  if (roundType === 'inhibitory' && onInhibitoryDone) return <InhibitoryRound onDone={onInhibitoryDone} />;
  if (roundType === 'flexible' && onFlexibleDone) return <FlexibleRound onDone={onFlexibleDone} />;
  if (roundType === 'divided' && onDividedDone) return <DividedRound onDone={onDividedDone} />;
  return null;
};
