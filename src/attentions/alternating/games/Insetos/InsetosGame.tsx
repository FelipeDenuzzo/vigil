// src/attentions/alternating/games/Insetos/InsetosGame.tsx
// Motor principal do jogo Insetos — Atenção Alternada
// Regra: tocar/clicar nos insetos do grupo ATIVO que aparecem em alerta (parados/piscando).
// O grupo ativo alterna a cada fase. Fase = duração de 30s.
// Total: 6 fases (3 formiga + 3 joaninha, alternadas).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Insect, InsectGroup, InsetosSessionLog } from './types';
import type { InsetosRawEvent } from '../../../../assessment/insetos/types';

/* ── Constantes ────────────────────────────────────────────────────────────────── */
const TOTAL_PHASES      = 6;
const PHASE_DURATION_MS = 30_000;
const NUM_INSECTS       = 8;   // total de insetos (4 de cada grupo)
const SPEED_BASE        = 6;   // % da menor dimensão por segundo
const SPEED_RAMP        = 0.5; // aumento por fase
const ALERT_INTERVAL_MS = 4_000;   // a cada 4s um inseto do grupo ativo entra em alerta
const ALERT_DURATION_MS = 2_500;   // duração do alerta (janela de toque)
const COLLISION_ANIM_MS = 800;     // duração da animação de colisão

/* Raio de toque em % da menor dimensão */
const HIT_RADIUS_PCT = 9;

/* URLs das imagens */
function intactSrc(g: InsectGroup) {
  return g === 'formiga'
    ? '/Insetos/Formiga integra.png'
    : '/Insetos/Joaninha Integra.png';
}
function collisionSrc(g: InsectGroup, frame: 1 | 2 | 3 | 4 | 5) {
  const name = g === 'formiga' ? 'Formiga' : 'Joaninha';
  const suffix = g === 'formiga' ? `colisão ${frame}` : `colisão ${frame}`;
  return `/Insetos/${name} ${suffix}.png`;
}

/* ── Helpers ───────────────────────────────────────────────────────────────────────── */
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeInsect(id: string, group: InsectGroup): Insect {
  const angle = Math.random() * 2 * Math.PI;
  return {
    id,
    group,
    x: rand(10, 90),
    y: rand(10, 90),
    vx: Math.cos(angle) * SPEED_BASE,
    vy: Math.sin(angle) * SPEED_BASE,
    collisionFrame: 0,
    collisionStartMs: 0,
  };
}

function buildInitialInsects(): Insect[] {
  const insects: Insect[] = [];
  for (let i = 0; i < NUM_INSECTS / 2; i++) insects.push(makeInsect(`f${i}`, 'formiga'));
  for (let i = 0; i < NUM_INSECTS / 2; i++) insects.push(makeInsect(`j${i}`, 'joaninha'));
  return insects;
}

/* ── Componente ──────────────────────────────────────────────────────────────────────── */
interface Props {
  sessionId: string;
  onComplete?: (log: InsetosSessionLog) => void;
  onClose?:    () => void;
}

export const InsetosGame: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  /* ── State reativo (para re-render) ── */
  const [phase, setPhase]             = useState(0);       // fase atual (0-based)
  const [timeLeft, setTimeLeft]       = useState(PHASE_DURATION_MS);
  const [done, setDone]               = useState(false);
  const [score, setScore]             = useState(0);
  const [, forceUpdate]               = useState(0);       // força repaint do canvas

  /* ── Refs (dados de jogo sem re-render) ── */
  const insectsRef       = useRef<Insect[]>(buildInitialInsects());
  const eventsRef        = useRef<InsetosRawEvent[]>([]);
  const alertInsectId    = useRef<string | null>(null);   // inseto em alerta atualmente
  const alertStartMs     = useRef<number>(0);
  const lastTickMs       = useRef<number>(0);
  const phaseStartMs     = useRef<number>(0);
  const lastAlertMs      = useRef<number>(0);
  const rafRef           = useRef<number>(0);
  const canvasRef        = useRef<HTMLDivElement>(null);
  const scoreRef         = useRef(0);
  const phaseRef         = useRef(0);

  /* Grupo ativo: fase par → formiga, fase ímpar → joaninha */
  const activeGroup = (p: number): InsectGroup => p % 2 === 0 ? 'formiga' : 'joaninha';

  /* ── Loop de jogo ── */
  const gameLoop = useCallback((nowMs: number) => {
    if (done) return;

    const dt = lastTickMs.current === 0 ? 0 : (nowMs - lastTickMs.current) / 1000;
    lastTickMs.current = nowMs;

    const currentPhase = phaseRef.current;
    const speed        = SPEED_BASE + currentPhase * SPEED_RAMP;

    /* Atualiza posições */
    const insects = insectsRef.current;
    for (const ins of insects) {
      /* Animação de colisão */
      if (ins.collisionFrame > 0) {
        const elapsed = nowMs - ins.collisionStartMs;
        ins.collisionFrame = Math.min(5, Math.floor((elapsed / COLLISION_ANIM_MS) * 5) + 1);
        if (elapsed >= COLLISION_ANIM_MS) ins.collisionFrame = 0;
        continue; // inseto parado durante colisão
      }

      ins.x += ins.vx * dt;
      ins.y += ins.vy * dt;

      /* Bounce nas bordas */
      if (ins.x < 5  || ins.x > 95) { ins.vx *= -1; ins.x = Math.max(5, Math.min(95, ins.x)); }
      if (ins.y < 5  || ins.y > 95) { ins.vy *= -1; ins.y = Math.max(5, Math.min(95, ins.y)); }

      /* Normaliza velocidade */
      const mag = Math.sqrt(ins.vx ** 2 + ins.vy ** 2);
      if (mag > 0) { ins.vx = (ins.vx / mag) * speed; ins.vy = (ins.vy / mag) * speed; }
    }

    /* Alerta periódico */
    if (nowMs - lastAlertMs.current > ALERT_INTERVAL_MS) {
      /* Verifica se o alerta anterior expirou sem resposta (omissão) */
      if (alertInsectId.current !== null) {
        const elapsed = nowMs - alertStartMs.current;
        if (elapsed > ALERT_DURATION_MS) {
          eventsRef.current.push({
            type:         'omission',
            timestamp:    alertStartMs.current,
            phase:        currentPhase,
            activeGroup:  activeGroup(currentPhase),
            alertState:   1,
          });
          alertInsectId.current = null;
        }
      }

      if (alertInsectId.current === null) {
        const group  = activeGroup(currentPhase);
        const pool   = insects.filter(i => i.group === group && i.collisionFrame === 0);
        if (pool.length > 0) {
          const chosen = pool[Math.floor(Math.random() * pool.length)];
          alertInsectId.current = chosen.id;
          alertStartMs.current  = nowMs;
          lastAlertMs.current   = nowMs;
        }
      }
    }

    /* Temporizador de fase */
    const phaseElapsed = nowMs - phaseStartMs.current;
    const remaining    = PHASE_DURATION_MS - phaseElapsed;
    setTimeLeft(Math.max(0, remaining));

    if (remaining <= 0) {
      const nextPhase = currentPhase + 1;
      if (nextPhase >= TOTAL_PHASES) {
        /* Jogo encerrado */
        setDone(true);
        const log: InsetosSessionLog = {
          sessionId,
          startedAt: new Date(nowMs - currentPhase * PHASE_DURATION_MS).toISOString(),
          rawEvents: eventsRef.current,
        };
        onComplete?.(log);
        return;
      }

      phaseRef.current  = nextPhase;
      phaseStartMs.current = nowMs;
      lastAlertMs.current  = nowMs;
      alertInsectId.current = null;
      setPhase(nextPhase);

      eventsRef.current.push({
        type:        'switch',
        timestamp:   nowMs,
        phase:       nextPhase,
        activeGroup: activeGroup(nextPhase),
        isPostSwitch: true,
      });
    }

    forceUpdate(t => t + 1);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [done, sessionId, onComplete]);

  /* Inicia o loop */
  useEffect(() => {
    phaseStartMs.current = performance.now();
    lastAlertMs.current  = performance.now();
    lastTickMs.current   = 0;
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line

  /* ── Toque / clique ── */
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (done) return;
    const rect   = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top)  / rect.height) * 100;
    const minDim  = Math.min(rect.width, rect.height);
    const hitRad  = HIT_RADIUS_PCT * (minDim / rect.width);  // em % da largura

    const nowMs        = performance.now();
    const curPhase     = phaseRef.current;
    const group        = activeGroup(curPhase);
    const alertId      = alertInsectId.current;

    let hit = false;
    for (const ins of insectsRef.current) {
      const dx = ins.x - clickX;
      const dy = ins.y - clickY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < hitRad) {
        const isTarget = ins.group === group && ins.id === alertId;
        const isPostSwitch = curPhase > 0 && (nowMs - phaseStartMs.current) < 3000;

        if (isTarget) {
          /* Acerto */
          const rt = nowMs - alertStartMs.current;
          eventsRef.current.push({
            type:         'hit',
            timestamp:    nowMs,
            phase:        curPhase,
            activeGroup:  group,
            rt,
            isPostSwitch,
            alertState:   1,
          });
          ins.collisionFrame    = 1;
          ins.collisionStartMs  = nowMs;
          alertInsectId.current = null;
          scoreRef.current     += 1;
          setScore(scoreRef.current);
          hit = true;
          break;
        } else {
          /* Erro de comissão */
          eventsRef.current.push({
            type:        'commission_error',
            timestamp:   nowMs,
            phase:       curPhase,
            activeGroup: group,
          });
          ins.collisionFrame   = 1;
          ins.collisionStartMs = nowMs;
          hit = true;
          break;
        }
      }
    }

    if (!hit) {
      /* Toque no vazio — não registra evento */
    }
  }, [done]);

  /* ── Render ── */
  const insects  = insectsRef.current;
  const alertId  = alertInsectId.current;
  const curGroup = activeGroup(phase);
  const phaseSec = Math.ceil(timeLeft / 1000);

  const ACTIVE_COLOR = curGroup === 'formiga' ? '#f97316' : '#ef4444';

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', userSelect: 'none' }}>
      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#a0a4be' }}>
            Fase <strong style={{ color: '#fff' }}>{phase + 1}</strong> / {TOTAL_PHASES}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700, padding: '2px 10px',
            borderRadius: 99, background: ACTIVE_COLOR + '22', color: ACTIVE_COLOR,
            border: `1px solid ${ACTIVE_COLOR}`,
          }}>
            {curGroup === 'formiga' ? '🐜 Formigas' : '🐞 Joaninhas'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#a0a4be' }}>
            ⭐ <strong style={{ color: '#fff' }}>{score}</strong>
          </span>
          <span style={{
            fontSize: 15, fontWeight: 700,
            color: phaseSec <= 5 ? '#f08080' : '#e8e9f0',
          }}>
            {phaseSec}s
          </span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#a0a4be', fontSize: 20, lineHeight: 1, padding: '0 4px',
              }}
              aria-label="Fechar jogo"
            >×</button>
          )}
        </div>
      </div>

      {/* Canvas do jogo */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '75%',
          background: 'radial-gradient(ellipse at center, #1a1d2e 0%, #0d0f1a 100%)',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          {insects.map(ins => {
            const isAlert   = ins.id === alertId && ins.collisionFrame === 0;
            const isTarget  = ins.group === curGroup;
            const imgSrc    = ins.collisionFrame > 0
              ? collisionSrc(ins.group, ins.collisionFrame as 1|2|3|4|5)
              : intactSrc(ins.group);

            return (
              <div
                key={ins.id}
                style={{
                  position: 'absolute',
                  left: `${ins.x}%`,
                  top:  `${ins.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '9%',
                  height: '9%',
                  transition: 'filter 0.1s',
                  filter: isAlert
                    ? `drop-shadow(0 0 8px ${ACTIVE_COLOR}) drop-shadow(0 0 16px ${ACTIVE_COLOR})`
                    : isTarget
                      ? `drop-shadow(0 0 2px ${ACTIVE_COLOR}44)`
                      : 'opacity(0.4)',
                  animation: isAlert ? 'inseto-pulse 0.6s ease-in-out infinite' : 'none',
                  opacity: isTarget ? 1 : 0.35,
                  zIndex: isAlert ? 10 : 1,
                }}
              >
                <img
                  src={imgSrc}
                  alt={ins.group}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                />
              </div>
            );
          })}

          {/* Instrução overlay */}
          <div style={{
            position: 'absolute', bottom: 12, left: 0, right: 0,
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: 12, color: 'rgba(255,255,255,0.5)',
              background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 99,
            }}>
              Toque nas {curGroup === 'formiga' ? 'formigas' : 'joaninhas'} que piscarem
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes inseto-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1.0); }
          50%       { transform: translate(-50%, -50%) scale(1.18); }
        }
      `}</style>
    </div>
  );
};

export default InsetosGame;
