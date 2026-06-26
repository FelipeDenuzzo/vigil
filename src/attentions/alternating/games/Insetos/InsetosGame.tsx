// src/attentions/alternating/games/Insetos/InsetosGame.tsx
// Mecânica:
//  • Arena quadrada menor (max 480px) renderizada em <canvas>
//  • Insetos andam só horizontal OU vertical (linhas retas)
//  • Viram 90° em esquinas aleatórias
//  • Ao se encontrarem: param, piscam (mudam de cor) — estado de alerta
//  • Clicar no inseto do grupo ATIVO em alerta = acerto
//  • Não clicar em 2.8s = omissão, retomam sozinhos

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Insect, InsectGroup, Direction, InsetosSessionLog } from './types';
import type { InsetosRawEvent } from '../../../../assessment/insetos/types';

/* ── Constantes ── */
const TOTAL_PHASES      = 6;
const PHASE_DURATION_MS = 30_000;
const NUM_EACH          = 4;          // 4 formigas + 4 joaninhas
const SPEED_BASE        = 80;         // px/s na fase 0
const SPEED_RAMP        = 8;          // px/s extra por fase
const TURN_MIN          = 1500;       // ms entre viradas espontâneas
const TURN_MAX          = 3200;
const COLLISION_PX      = 36;         // px - raio de encontro
const ALERT_MS          = 2800;       // janela de clique
const INSECT_SIZE       = 36;         // px
const HIT_RADIUS        = 28;         // px raio de toque
const MARGIN            = 28;         // px afastamento das bordas

const DIRS: Direction[] = ['up', 'down', 'left', 'right'];
function rDir(): Direction { return DIRS[Math.floor(Math.random() * 4)]; }
function rTurn(): number   { return TURN_MIN + Math.random() * (TURN_MAX - TURN_MIN); }
function rand(a: number, b: number) { return a + Math.random() * (b - a); }

function dirVec(d: Direction): [number, number] {
  if (d === 'up')   return [0, -1];
  if (d === 'down') return [0,  1];
  if (d === 'left') return [-1, 0];
  return [1, 0];
}

function makeInsect(id: string, group: InsectGroup, W: number, H: number, nowMs: number): Insect {
  return {
    id, group,
    x: rand(MARGIN, W - MARGIN),
    y: rand(MARGIN, H - MARGIN),
    dir: rDir(),
    speed: SPEED_BASE,
    nextTurnMs: nowMs + rTurn(),
    lastTurnMs: nowMs,
    frozen: false,
    alertStartMs: 0,
    collisionFrame: 0,
    collisionStartMs: 0,
  };
}

function buildInsects(W: number, H: number, nowMs: number): Insect[] {
  const list: Insect[] = [];
  for (let i = 0; i < NUM_EACH; i++) list.push(makeInsect(`f${i}`, 'formiga',  W, H, nowMs));
  for (let i = 0; i < NUM_EACH; i++) list.push(makeInsect(`j${i}`, 'joaninha', W, H, nowMs));
  return list;
}

function activeGroup(phase: number): InsectGroup {
  return phase % 2 === 0 ? 'formiga' : 'joaninha';
}

function resumeInsect(ins: Insect, nowMs: number, speed: number) {
  const others = DIRS.filter(d => d !== ins.dir);
  ins.dir          = others[Math.floor(Math.random() * others.length)];
  ins.frozen       = false;
  ins.alertStartMs = 0;
  ins.speed        = speed;
  ins.nextTurnMs   = nowMs + rTurn();
  ins.collisionFrame = 0;
}

/* ── Componente ── */
interface Props {
  sessionId: string;
  onComplete?: (log: InsetosSessionLog) => void;
  onClose?:    () => void;
}

export const InsetosGame: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  const ARENA = 480;

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const insectsRef   = useRef<Insect[]>([]);
  const eventsRef    = useRef<InsetosRawEvent[]>([]);
  const lastTickMs   = useRef(0);
  const phaseStartMs = useRef(0);
  const phaseRef     = useRef(0);
  const scoreRef     = useRef(0);
  const rafRef       = useRef(0);
  const imgsRef      = useRef<Record<string, HTMLImageElement>>({});
  const startedAtRef = useRef('');

  const [phase, setPhase]       = useState(0);
  const [timeLeft, setTimeLeft] = useState(PHASE_DURATION_MS);
  const [score, setScore]       = useState(0);
  const [done, setDone]         = useState(false);

  /* Pré-carrega imagens */
  useEffect(() => {
    const srcs = [
      '/Insetos/Formiga integra.png',
      '/Insetos/Joaninha Integra.png',
      ...[1,2,3,4,5].map(f => `/Insetos/Formiga colisão ${f}.png`),
      ...[1,2,3,4,5].map(f => `/Insetos/Joaninha colisão ${f}.png`),
    ];
    srcs.forEach(src => {
      const img = new Image();
      img.src = src;
      imgsRef.current[src] = img;
    });
  }, []);

  /* ── Loop principal ── */
  const loop = useCallback((nowMs: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = ARENA, H = ARENA;

    const dt           = lastTickMs.current === 0 ? 0 : (nowMs - lastTickMs.current) / 1000;
    lastTickMs.current = nowMs;
    const curPhase     = phaseRef.current;
    const speed        = SPEED_BASE + curPhase * SPEED_RAMP;
    const group        = activeGroup(curPhase);
    const insects      = insectsRef.current;

    /* ─ Move insetos ─ */
    for (const ins of insects) {
      if (ins.frozen) {
        if (ins.alertStartMs > 0 && nowMs - ins.alertStartMs > ALERT_MS) {
          eventsRef.current.push({
            type: 'omission', timestamp: ins.alertStartMs,
            phase: curPhase, activeGroup: group, alertState: 1,
          });
          resumeInsect(ins, nowMs, speed);
        }
        continue;
      }

      if (nowMs >= ins.nextTurnMs) {
        const others = DIRS.filter(d => d !== ins.dir);
        ins.dir        = others[Math.floor(Math.random() * others.length)];
        ins.nextTurnMs = nowMs + rTurn();
        ins.lastTurnMs = nowMs;
      }

      const [dx, dy] = dirVec(ins.dir);
      ins.x += dx * ins.speed * dt;
      ins.y += dy * ins.speed * dt;

      if (ins.x < MARGIN)     { ins.x = MARGIN;     ins.dir = 'right'; ins.nextTurnMs = nowMs + rTurn(); }
      if (ins.x > W - MARGIN) { ins.x = W - MARGIN; ins.dir = 'left';  ins.nextTurnMs = nowMs + rTurn(); }
      if (ins.y < MARGIN)     { ins.y = MARGIN;      ins.dir = 'down';  ins.nextTurnMs = nowMs + rTurn(); }
      if (ins.y > H - MARGIN) { ins.y = H - MARGIN;  ins.dir = 'up';    ins.nextTurnMs = nowMs + rTurn(); }
    }

    /* ─ Detecta encontros ─ */
    const moving = insects.filter(i => !i.frozen);
    for (let a = 0; a < moving.length; a++) {
      for (let b = a + 1; b < moving.length; b++) {
        const ia = moving[a], ib = moving[b];
        const dx = ia.x - ib.x, dy = ia.y - ib.y;
        if (Math.sqrt(dx * dx + dy * dy) < COLLISION_PX) {
          ia.frozen = true; ia.alertStartMs = nowMs;
          ib.frozen = true; ib.alertStartMs = nowMs;
        }
      }
    }

    /* ─ Fase ─ */
    const remaining = PHASE_DURATION_MS - (nowMs - phaseStartMs.current);
    setTimeLeft(Math.max(0, remaining));

    if (remaining <= 0) {
      const next = curPhase + 1;
      if (next >= TOTAL_PHASES) {
        setDone(true);
        onComplete?.({
          sessionId,
          startedAt: startedAtRef.current,
          rawEvents: eventsRef.current,
        });
        return;
      }
      phaseRef.current     = next;
      phaseStartMs.current = nowMs;
      for (const ins of insects) resumeInsect(ins, nowMs, SPEED_BASE + next * SPEED_RAMP);
      setPhase(next);
      eventsRef.current.push({
        type: 'switch', timestamp: nowMs,
        phase: next, activeGroup: activeGroup(next), isPostSwitch: true,
      });
    }

    /* ── Render canvas ── */
    const blink = Math.floor(nowMs / 380) % 2 === 0;

    ctx.clearRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7);
    bg.addColorStop(0, '#1a1d2e');
    bg.addColorStop(1, '#0d0f1a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (const ins of insects) {
      const isActive = ins.group === group;
      const isAlert  = ins.frozen;
      const alertCol = ins.group === 'formiga' ? '#f97316' : '#ef4444';

      ctx.save();
      ctx.globalAlpha = isAlert
        ? (blink ? (isActive ? 1 : 0.35) : (isActive ? 0.55 : 0.15))
        : (isActive ? 1 : 0.25);

      if (isAlert && isActive) {
        ctx.shadowColor = blink ? '#ffffff' : alertCol;
        ctx.shadowBlur  = blink ? 22 : 14;
      } else if (isActive) {
        ctx.shadowColor = alertCol;
        ctx.shadowBlur  = 4;
      }

      /* anel piscando */
      if (isAlert && isActive) {
        ctx.beginPath();
        ctx.arc(ins.x, ins.y, INSECT_SIZE / 2 + 9, 0, Math.PI * 2);
        ctx.strokeStyle = blink ? '#ffffff' : alertCol;
        ctx.lineWidth   = 2.5;
        ctx.shadowBlur  = 0;
        ctx.stroke();
        ctx.shadowColor = blink ? '#ffffff' : alertCol;
        ctx.shadowBlur  = blink ? 22 : 14;
      }

      /* imagem */
      const imgKey = ins.collisionFrame > 0
        ? `/Insetos/${ins.group === 'formiga' ? 'Formiga' : 'Joaninha'} colisão ${ins.collisionFrame}.png`
        : ins.group === 'formiga'
          ? '/Insetos/Formiga integra.png'
          : '/Insetos/Joaninha Integra.png';

      const img  = imgsRef.current[imgKey];
      const half = INSECT_SIZE / 2;
      if (img?.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, ins.x - half, ins.y - half, INSECT_SIZE, INSECT_SIZE);
      } else {
        ctx.beginPath();
        ctx.arc(ins.x, ins.y, half, 0, Math.PI * 2);
        ctx.fillStyle = alertCol;
        ctx.fill();
      }

      ctx.restore();
    }

    /* hint */
    ctx.font      = '11px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Toque nas ${group === 'formiga' ? 'formigas' : 'joaninhas'} que pararem`,
      W / 2, H - 12
    );

    rafRef.current = requestAnimationFrame(loop);
  }, [done, sessionId, onComplete, ARENA]); // eslint-disable-line

  useEffect(() => {
    const nowMs          = performance.now();
    startedAtRef.current = new Date().toISOString();
    phaseStartMs.current = nowMs;
    lastTickMs.current   = 0;
    insectsRef.current   = buildInsects(ARENA, ARENA, nowMs);
    rafRef.current       = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []); // eslint-disable-line

  /* ── Clique ── */
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (done) return;
    const rect   = e.currentTarget.getBoundingClientRect();
    const scaleX = ARENA / rect.width;
    const scaleY = ARENA / rect.height;
    const cx     = (e.clientX - rect.left) * scaleX;
    const cy     = (e.clientY - rect.top)  * scaleY;

    const nowMs    = performance.now();
    const curPhase = phaseRef.current;
    const group    = activeGroup(curPhase);
    const speed    = SPEED_BASE + curPhase * SPEED_RAMP;
    const isPost   = curPhase > 0 && (nowMs - phaseStartMs.current) < 3000;

    for (const ins of insectsRef.current) {
      if (!ins.frozen) continue;
      const dx = ins.x - cx, dy = ins.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) >= HIT_RADIUS) continue;

      if (ins.group === group) {
        eventsRef.current.push({
          type: 'hit', timestamp: nowMs,
          phase: curPhase, activeGroup: group,
          rt: nowMs - ins.alertStartMs,
          isPostSwitch: isPost, alertState: 1,
        });
        scoreRef.current += 1;
        setScore(scoreRef.current);
      } else {
        eventsRef.current.push({
          type: 'commission_error', timestamp: nowMs,
          phase: curPhase, activeGroup: group,
        });
      }
      resumeInsect(ins, nowMs, speed);
      break;
    }
  }, [done, ARENA]); // eslint-disable-line

  /* ── HUD ── */
  const curGroup   = activeGroup(phase);
  const phaseSec   = Math.ceil(timeLeft / 1000);
  const ACTIVE_COL = curGroup === 'formiga' ? '#f97316' : '#ef4444';

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', fontFamily: 'Inter, sans-serif', userSelect: 'none' }}>

      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '12px 12px 0 0',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#a0a4be' }}>
            Fase <strong style={{ color: '#fff' }}>{phase + 1}</strong>/{TOTAL_PHASES}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: ACTIVE_COL + '22', color: ACTIVE_COL, border: `1px solid ${ACTIVE_COL}`,
          }}>
            {curGroup === 'formiga' ? '🐜 Formigas' : '🐞 Joaninhas'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#a0a4be' }}>⭐ <strong style={{ color: '#fff' }}>{score}</strong></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: phaseSec <= 5 ? '#f08080' : '#e8e9f0' }}>{phaseSec}s</span>
          {onClose && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0a4be', fontSize: 18, lineHeight: 1, padding: 0 }}
              aria-label="Fechar"
            >×</button>
          )}
        </div>
      </div>

      {/* Canvas quadrado responsivo */}
      <canvas
        ref={canvasRef}
        width={ARENA}
        height={ARENA}
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          maxWidth: ARENA,
          height: 'auto',
          borderRadius: '0 0 12px 12px',
          border: `2px solid ${ACTIVE_COL}44`,
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      />
    </div>
  );
};

export default InsetosGame;
