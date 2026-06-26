// src/attentions/alternating/games/Insetos/InsetosGame.tsx
// Nova mecânica:
//  • Arena menor e centralizada (max 480×480)
//  • Insetos se movem só horizontal ou verticalmente (linhas retas)
//  • Fazem esquinas aleatórias a cada intervalo
//  • Quando dois insetos se encontram → ambos param e piscam (alerta)
//  • Clicar no inseto do grupo ATIVO em alerta = acerto → retomam movimento
//  • Não clicar dentro do tempo = omissão → retomam sozinhos

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Insect, InsectGroup, Direction, InsetosSessionLog } from './types';
import type { InsetosRawEvent } from '../../../../assessment/insetos/types';

/* ── Constantes ── */
const TOTAL_PHASES       = 6;
const PHASE_DURATION_MS  = 30_000;
const NUM_INSECTS        = 8;          // 4 de cada grupo
const SPEED_BASE         = 12;         // % por segundo
const SPEED_RAMP         = 1;          // aumento por fase
const TURN_INTERVAL_MIN  = 1800;       // ms mínimo entre viradas espontâneas
const TURN_INTERVAL_MAX  = 3500;       // ms máximo
const COLLISION_DIST     = 8;          // % — distância para detectar encontro
const ALERT_DURATION_MS  = 2_800;      // janela de clique após encontro
const RESUME_ANIM_MS     = 500;        // animação de saída após clique
const MARGIN             = 6;          // % — margem das bordas

const DIRS: Direction[] = ['up', 'down', 'left', 'right'];

function randomDir(): Direction {
  return DIRS[Math.floor(Math.random() * 4)];
}
function randomTurnDelay(): number {
  return TURN_INTERVAL_MIN + Math.random() * (TURN_INTERVAL_MAX - TURN_INTERVAL_MIN);
}
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function dirToVec(d: Direction): [number, number] {
  switch (d) {
    case 'up':    return [0, -1];
    case 'down':  return [0,  1];
    case 'left':  return [-1, 0];
    case 'right': return [1,  0];
  }
}

function makeInsect(id: string, group: InsectGroup, nowMs: number): Insect {
  return {
    id, group,
    x: rand(15, 85),
    y: rand(15, 85),
    dir: randomDir(),
    speed: SPEED_BASE,
    nextTurnMs: nowMs + randomTurnDelay(),
    lastTurnMs: nowMs,
    frozen: false,
    alertStartMs: 0,
    collisionFrame: 0,
    collisionStartMs: 0,
  };
}

function buildInsects(nowMs: number): Insect[] {
  const list: Insect[] = [];
  for (let i = 0; i < NUM_INSECTS / 2; i++) list.push(makeInsect(`f${i}`, 'formiga', nowMs));
  for (let i = 0; i < NUM_INSECTS / 2; i++) list.push(makeInsect(`j${i}`, 'joaninha', nowMs));
  return list;
}

function intactSrc(g: InsectGroup) {
  return g === 'formiga' ? '/Insetos/Formiga integra.png' : '/Insetos/Joaninha Integra.png';
}
function collisionSrc(g: InsectGroup, frame: 1|2|3|4|5) {
  const name = g === 'formiga' ? 'Formiga' : 'Joaninha';
  return `/Insetos/${name} colisão ${frame}.png`;
}

/* ── Componente ── */
interface Props {
  sessionId: string;
  onComplete?: (log: InsetosSessionLog) => void;
  onClose?:    () => void;
}

export const InsetosGame: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  const initNow = performance.now();

  const [phase, setPhase]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASE_DURATION_MS);
  const [done, setDone]         = useState(false);
  const [score, setScore]       = useState(0);
  const [, forceUpdate]         = useState(0);

  const insectsRef    = useRef<Insect[]>(buildInsects(initNow));
  const eventsRef     = useRef<InsetosRawEvent[]>([]);
  const lastTickMs    = useRef(0);
  const phaseStartMs  = useRef(initNow);
  const phaseRef      = useRef(0);
  const scoreRef      = useRef(0);
  const rafRef        = useRef(0);
  const canvasRef     = useRef<HTMLDivElement>(null);

  const activeGroup = (p: number): InsectGroup => p % 2 === 0 ? 'formiga' : 'joaninha';

  /* ── Loop principal ── */
  const gameLoop = useCallback((nowMs: number) => {
    if (done) return;

    const dt          = lastTickMs.current === 0 ? 0 : (nowMs - lastTickMs.current) / 1000;
    lastTickMs.current = nowMs;
    const currentPhase = phaseRef.current;
    const speed        = SPEED_BASE + currentPhase * SPEED_RAMP;

    const insects = insectsRef.current;

    /* ── Movimenta insetos não-congelados ── */
    for (const ins of insects) {
      if (ins.frozen) {
        /* Verifica timeout do alerta → retoma */
        if (ins.alertStartMs > 0 && nowMs - ins.alertStartMs > ALERT_DURATION_MS) {
          /* Omissão */
          eventsRef.current.push({
            type: 'omission',
            timestamp: ins.alertStartMs,
            phase: currentPhase,
            activeGroup: activeGroup(currentPhase),
            alertState: 1,
          });
          resumeInsect(ins, nowMs, speed);
        }
        continue;
      }

      /* Animação de saída pós-clique */
      if (ins.collisionFrame > 0) {
        const el = nowMs - ins.collisionStartMs;
        ins.collisionFrame = Math.min(5, Math.floor((el / RESUME_ANIM_MS) * 5) + 1);
        if (el >= RESUME_ANIM_MS) ins.collisionFrame = 0;
      }

      /* Virada espontânea */
      if (nowMs >= ins.nextTurnMs) {
        ins.dir = randomDir();
        ins.nextTurnMs = nowMs + randomTurnDelay();
        ins.lastTurnMs = nowMs;
      }

      /* Move */
      const [dx, dy] = dirToVec(ins.dir);
      ins.x += dx * speed * dt;
      ins.y += dy * speed * dt;

      /* Bounce nas bordas → vira 180° ou 90° */
      let bounced = false;
      if (ins.x < MARGIN)       { ins.x = MARGIN;       ins.dir = 'right'; bounced = true; }
      if (ins.x > 100 - MARGIN) { ins.x = 100 - MARGIN; ins.dir = 'left';  bounced = true; }
      if (ins.y < MARGIN)       { ins.y = MARGIN;        ins.dir = 'down';  bounced = true; }
      if (ins.y > 100 - MARGIN) { ins.y = 100 - MARGIN;  ins.dir = 'up';    bounced = true; }
      if (bounced) ins.nextTurnMs = nowMs + randomTurnDelay();
    }

    /* ── Detecta encontros (apenas entre insetos em movimento) ── */
    const moving = insects.filter(i => !i.frozen && i.collisionFrame === 0);
    for (let a = 0; a < moving.length; a++) {
      for (let b = a + 1; b < moving.length; b++) {
        const ia = moving[a];
        const ib = moving[b];
        const dx = ia.x - ib.x;
        const dy = ia.y - ib.y;
        if (Math.sqrt(dx * dx + dy * dy) < COLLISION_DIST) {
          /* Congela ambos */
          ia.frozen       = true;
          ia.alertStartMs = nowMs;
          ib.frozen       = true;
          ib.alertStartMs = nowMs;
        }
      }
    }

    /* ── Temporizador de fase ── */
    const remaining = PHASE_DURATION_MS - (nowMs - phaseStartMs.current);
    setTimeLeft(Math.max(0, remaining));

    if (remaining <= 0) {
      const nextPhase = currentPhase + 1;
      if (nextPhase >= TOTAL_PHASES) {
        setDone(true);
        const log: InsetosSessionLog = {
          sessionId,
          startedAt: new Date(nowMs - currentPhase * PHASE_DURATION_MS).toISOString(),
          rawEvents: eventsRef.current,
        };
        onComplete?.(log);
        return;
      }
      phaseRef.current     = nextPhase;
      phaseStartMs.current = nowMs;
      /* Descongela tudo na troca de fase */
      for (const ins of insects) resumeInsect(ins, nowMs, SPEED_BASE + nextPhase * SPEED_RAMP);
      setPhase(nextPhase);
      eventsRef.current.push({
        type: 'switch', timestamp: nowMs,
        phase: nextPhase, activeGroup: activeGroup(nextPhase), isPostSwitch: true,
      });
    }

    forceUpdate(n => n + 1);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [done, sessionId, onComplete]); // eslint-disable-line

  function resumeInsect(ins: Insect, nowMs: number, speed: number) {
    ins.frozen        = false;
    ins.alertStartMs  = 0;
    ins.dir           = randomDir();
    ins.speed         = speed;
    ins.nextTurnMs    = nowMs + randomTurnDelay();
    ins.collisionFrame     = 1;
    ins.collisionStartMs   = nowMs;
  }

  useEffect(() => {
    phaseStartMs.current = performance.now();
    lastTickMs.current   = 0;
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line

  /* ── Clique ── */
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (done) return;
    const rect   = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width)  * 100;
    const clickY = ((e.clientY - rect.top)  / rect.height) * 100;
    const hitRad = 8; // % — área de toque generosa

    const nowMs      = performance.now();
    const curPhase   = phaseRef.current;
    const group      = activeGroup(curPhase);
    const speed      = SPEED_BASE + curPhase * SPEED_RAMP;
    const isPostSwitch = curPhase > 0 && (nowMs - phaseStartMs.current) < 3000;

    for (const ins of insectsRef.current) {
      if (!ins.frozen) continue;
      const dx   = ins.x - clickX;
      const dy   = ins.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= hitRad) continue;

      const isTarget = ins.group === group;
      if (isTarget) {
        const rt = nowMs - ins.alertStartMs;
        eventsRef.current.push({
          type: 'hit', timestamp: nowMs,
          phase: curPhase, activeGroup: group,
          rt, isPostSwitch, alertState: 1,
        });
        resumeInsect(ins, nowMs, speed);
        scoreRef.current += 1;
        setScore(scoreRef.current);
      } else {
        eventsRef.current.push({
          type: 'commission_error', timestamp: nowMs,
          phase: curPhase, activeGroup: group,
        });
        resumeInsect(ins, nowMs, speed);
      }
      break;
    }
  }, [done]); // eslint-disable-line

  /* ── Render ── */
  const insects    = insectsRef.current;
  const curGroup   = activeGroup(phase);
  const phaseSec   = Math.ceil(timeLeft / 1000);
  const ACTIVE_COLOR = curGroup === 'formiga' ? '#f97316' : '#ef4444';

  /* Pisca a cada ~400ms usando Date para animar cor */
  const blink = Math.floor(Date.now() / 400) % 2 === 0;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', userSelect: 'none', maxWidth: 520, margin: '0 auto' }}>

      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px', background: 'rgba(0,0,0,0.55)', borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#a0a4be' }}>
            Fase <strong style={{ color: '#fff' }}>{phase + 1}</strong>/{TOTAL_PHASES}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: ACTIVE_COLOR + '22', color: ACTIVE_COLOR, border: `1px solid ${ACTIVE_COLOR}`,
          }}>
            {curGroup === 'formiga' ? '🐜 Formigas' : '🐞 Joaninhas'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#a0a4be' }}>⭐ <strong style={{ color: '#fff' }}>{score}</strong></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: phaseSec <= 5 ? '#f08080' : '#e8e9f0' }}>{phaseSec}s</span>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0a4be', fontSize: 18, lineHeight: 1 }} aria-label="Fechar">×</button>
          )}
        </div>
      </div>

      {/* Arena */}
      <div
        ref={canvasRef}
        onClick={handleClick}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '100%', // quadrada
          background: 'radial-gradient(ellipse at center, #1a1d2e 0%, #0d0f1a 100%)',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          cursor: 'crosshair',
          touchAction: 'none',
          border: `2px solid ${ACTIVE_COLOR}44`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          {insects.map(ins => {
            const isAlert  = ins.frozen;
            const isActive = ins.group === curGroup;
            const imgSrc   = ins.collisionFrame > 0
              ? collisionSrc(ins.group, ins.collisionFrame as 1|2|3|4|5)
              : intactSrc(ins.group);

            /* Cor de piscar: alterna entre cor do grupo e branco */
            const alertColor = ins.group === 'formiga' ? '#f97316' : '#ef4444';
            const glowColor  = isAlert && isActive && blink ? '#ffffff' : alertColor;

            return (
              <div
                key={ins.id}
                style={{
                  position: 'absolute',
                  left: `${ins.x}%`,
                  top:  `${ins.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '7%',
                  height: '7%',
                  opacity: isActive ? 1 : 0.3,
                  zIndex: isAlert ? 10 : 1,
                  filter: isAlert
                    ? `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 14px ${glowColor})`
                    : isActive
                      ? `drop-shadow(0 0 2px ${alertColor}66)`
                      : 'none',
                  transition: isAlert ? 'none' : 'filter 0.15s',
                }}
              >
                <img
                  src={imgSrc}
                  alt={ins.group}
                  draggable={false}
                  style={{
                    width: '100%', height: '100%', objectFit: 'contain',
                    pointerEvents: 'none',
                    /* pisca a opacidade quando em alerta */
                    opacity: isAlert ? (blink ? 1 : 0.55) : 1,
                    transition: isAlert ? 'opacity 0.2s' : 'none',
                  }}
                />
                {/* Anel de destaque nos alertas do grupo ativo */}
                {isAlert && isActive && (
                  <div style={{
                    position: 'absolute', inset: '-30%',
                    borderRadius: '50%',
                    border: `2px solid ${blink ? '#ffffff' : alertColor}`,
                    pointerEvents: 'none',
                    opacity: 0.8,
                  }} />
                )}
              </div>
            );
          })}

          {/* Hint */}
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.35)', padding: '3px 10px', borderRadius: 99 }}>
              Toque nas {curGroup === 'formiga' ? 'formigas' : 'joaninhas'} que pararem
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsetosGame;
