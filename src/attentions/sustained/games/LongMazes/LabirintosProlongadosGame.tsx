import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LONG_MAZE_LEVELS } from './levels';
import { generateMaze, movePlayer, hasReachedEnd, registerVisit, buildResult } from './logic';
import type { MazeData, MazeDirection, MazePoint, MazeSessionResult, MazeFullSessionLog } from './types';

interface Props {
  onComplete?: (log: MazeFullSessionLog) => void;
  onClose?: () => void;
}

const CELL = 28;
const WALL_COLOR    = '#1a1c28';   // paredes escuras
const PATH_COLOR    = '#2e3350';   // caminho bem mais claro que a parede
const PLAYER_COLOR  = '#6c8ef5';
const END_COLOR     = '#6dbf87';
const END_REACHED_COLOR = '#ffe066'; // cor de chegada para animação
const START_COLOR   = '#f5c070';
const LONG_STOP_MS  = 3000;

function drawMaze(
  ctx: CanvasRenderingContext2D,
  maze: MazeData,
  player: MazePoint,
  cellSize: number,
  endReached = false,
  endPulse = 0   // 0-1 para pulsar a cor de chegada
) {
  const { grid, start, end } = maze;
  const rows = grid.length;
  const cols = grid[0].length;
  ctx.clearRect(0, 0, cols * cellSize, rows * cellSize);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const isWall = grid[y][x] === 1;
      ctx.fillStyle = isWall ? WALL_COLOR : PATH_COLOR;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      // borda sutil nas paredes para destacar ainda mais
      if (isWall) {
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // Ponto de partida
  ctx.fillStyle = START_COLOR;
  ctx.beginPath();
  ctx.roundRect(start.x * cellSize + 3, start.y * cellSize + 3, cellSize - 6, cellSize - 6, 3);
  ctx.fill();

  // Destino (animação de chegada)
  const endColor = endReached
    ? lerpColor(END_COLOR, END_REACHED_COLOR, endPulse)
    : END_COLOR;
  ctx.fillStyle = endColor;
  ctx.beginPath();
  ctx.roundRect(end.x * cellSize + 3, end.y * cellSize + 3, cellSize - 6, cellSize - 6, 3);
  ctx.fill();
  ctx.font = `${cellSize * 0.6}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏁', end.x * cellSize + cellSize / 2, end.y * cellSize + cellSize / 2);

  // Jogador
  const px = player.x * cellSize + cellSize / 2;
  const py = player.y * cellSize + cellSize / 2;
  const r  = cellSize * 0.36;
  ctx.beginPath();
  ctx.arc(px, py, r + 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(108,142,245,0.25)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = PLAYER_COLOR;
  ctx.fill();
}

/** Interpola duas cores hex simples */
function lerpColor(a: string, b: string, t: number): string {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

type Phase = 'menu' | 'playing' | 'end_animation' | 'confirm_abandon' | 'final_result';

export const LabirintosProlongadosGame: React.FC<Props> = ({ onComplete, onClose }) => {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const touchStart   = useRef<{ x: number; y: number } | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const longStopRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [phase,        setPhase]       = useState<Phase>('menu');
  const [levelIdx,     setLevelIdx]    = useState(0);
  const [maze,         setMaze]        = useState<MazeData | null>(null);
  const [player,       setPlayer]      = useState<MazePoint>({ x: 0, y: 0 });
  const [elapsed,      setElapsed]     = useState(0);
  const [steps,        setSteps]       = useState(0);
  const [revisits,     setRevisits]    = useState(0);
  const [phaseResults, setPhaseResults] = useState<MazeSessionResult[]>([]);
  const [dpadPressed,  setDpadPressed]  = useState<MazeDirection | null>(null);

  const visited         = useRef(new Set<string>());
  const visitedDeadEnds = useRef(new Set<string>());
  const stepsRef        = useRef(0);
  const revisitsRef     = useRef(0);
  const deadEndRef      = useRef(0);
  const longStopsRef    = useRef(0);
  const wallHitTimeRef  = useRef<number | null>(null);
  const postErrorPausesRef = useRef<number[]>([]);
  const playerRef       = useRef<MazePoint>({ x: 0, y: 0 });
  const mazeRef         = useRef<MazeData | null>(null);
  const elapsedRef      = useRef(0);
  const phaseRef        = useRef<Phase>('menu');

  const level = LONG_MAZE_LEVELS[levelIdx];

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { mazeRef.current   = maze;   }, [maze]);
  useEffect(() => { phaseRef.current  = phase;  }, [phase]);

  // Redesenha sempre que maze/player mudam (fora da animação de chegada)
  useEffect(() => {
    if (!maze || !canvasRef.current || phase === 'end_animation') return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    drawMaze(ctx, maze, player, CELL);
  }, [maze, player, phase]);

  // Animação de chegada: pulsa o alvo por 1s e depois avança
  const playEndAnimation = useCallback((onDone: () => void) => {
    setPhase('end_animation');
    const startTime = performance.now();
    const duration  = 1000;
    const m = mazeRef.current!;
    const p = playerRef.current;

    function frame(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const pulse = Math.abs(Math.sin(t * Math.PI * 4)); // 4 pulsos em 1s
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawMaze(ctx, m, p, CELL, true, pulse);
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(frame);
      } else {
        animFrameRef.current = null;
        onDone();
      }
    }
    animFrameRef.current = requestAnimationFrame(frame);
  }, []);

  const finishPhase = useCallback((success: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (longStopRef.current) clearTimeout(longStopRef.current);
    const m = mazeRef.current;
    if (!m) return;

    const avgPostError = postErrorPausesRef.current.length > 0
      ? postErrorPausesRef.current.reduce((a, b) => a + b, 0) / postErrorPausesRef.current.length
      : 0;

    const res = buildResult({
      success,
      level,
      elapsedMs: elapsedRef.current,
      steps: stepsRef.current,
      revisits: revisitsRef.current,
      deadEndEntries: deadEndRef.current,
      longStops: longStopsRef.current,
      postErrorPause: Math.round(avgPostError),
      shortestPathLength: m.shortestPathLength,
    });

    const updated = [...phaseResults, res];

    const advance = () => {
      setPhaseResults(updated);
      if (levelIdx < LONG_MAZE_LEVELS.length - 1) {
        setLevelIdx(levelIdx + 1);
        setPhase('menu');
      } else {
        const log: import('./types').MazeFullSessionLog = { phases: updated };
        onComplete?.(log);
        setPhase('final_result');
      }
    };

    if (success) {
      playEndAnimation(advance);
    } else {
      advance();
    }
  }, [level, levelIdx, phaseResults, onComplete, playEndAnimation]);

  const startGame = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const m = generateMaze(level);
    visited.current         = new Set();
    visitedDeadEnds.current = new Set();
    stepsRef.current        = 0;
    revisitsRef.current     = 0;
    deadEndRef.current      = 0;
    longStopsRef.current    = 0;
    postErrorPausesRef.current = [];
    wallHitTimeRef.current  = null;
    elapsedRef.current      = 0;
    registerVisit(visited.current, m.start);
    setMaze(m);
    setPlayer(m.start);
    setSteps(0);
    setRevisits(0);
    setElapsed(0);
    setPhase('playing');

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 100;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= level.timeLimitSec * 1000) finishPhase(false);
    }, 100);
  }, [level, finishPhase]);

  const resetLongStopTimer = useCallback(() => {
    if (longStopRef.current) clearTimeout(longStopRef.current);
    longStopRef.current = setTimeout(() => { longStopsRef.current += 1; }, LONG_STOP_MS);
  }, []);

  const move = useCallback((dir: MazeDirection) => {
    if (phaseRef.current !== 'playing') return;
    const m = mazeRef.current;
    if (!m) return;
    const now = Date.now();
    if (wallHitTimeRef.current !== null) {
      postErrorPausesRef.current.push(now - wallHitTimeRef.current);
      wallHitTimeRef.current = null;
    }
    const { blocked, position } = movePlayer(m.grid, playerRef.current, dir);
    if (blocked) {
      if (wallHitTimeRef.current === null) wallHitTimeRef.current = now;
      return;
    }
    resetLongStopTimer();
    stepsRef.current += 1;
    const isRevisit = registerVisit(visited.current, position);
    if (isRevisit) revisitsRef.current += 1;
    const key = `${position.x},${position.y}`;
    if (m.deadEndCells.has(key) && !visitedDeadEnds.current.has(key)) {
      visitedDeadEnds.current.add(key);
      deadEndRef.current += 1;
    }
    setSteps(stepsRef.current);
    setRevisits(revisitsRef.current);
    setPlayer(position);
    if (hasReachedEnd(position, m.end)) finishPhase(true);
  }, [finishPhase, resetLongStopTimer]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, MazeDirection> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); move(dir); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, move]);

  useEffect(() => () => {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (longStopRef.current)  clearTimeout(longStopRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
  };

  const handleAbandonRequest = () => setPhase('confirm_abandon');
  const handleAbandonConfirm = () => {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (longStopRef.current)  clearTimeout(longStopRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onClose?.();
  };
  const handleAbandonCancel = () => setPhase('playing');

  const timeLeft = Math.max(0, level.timeLimitSec - Math.floor(elapsed / 1000));
  const cols = maze?.grid[0].length ?? level.cols;
  const rows = maze?.grid.length    ?? level.rows;

  const dpadStyle = (dir: MazeDirection): React.CSSProperties => ({
    ...css.dpadBtn,
    background: dpadPressed === dir
      ? 'rgba(108,142,245,0.45)'
      : 'rgba(108,142,245,0.15)',
    transform: dpadPressed === dir ? 'scale(0.92)' : 'scale(1)',
    transition: 'background 0.08s, transform 0.08s',
  });

  const pressDpad = (dir: MazeDirection) => {
    setDpadPressed(dir);
    move(dir);
    setTimeout(() => setDpadPressed(null), 120);
  };

  // ── MENU
  if (phase === 'menu') return (
    <div style={css.screen}>
      <p style={css.title}>🧩 Labirintos</p>
      <p style={css.sub}>Treino de atenção sustentada — Fase {levelIdx + 1} de {LONG_MAZE_LEVELS.length}</p>
      <div style={css.infoBox}>
        <span>⏱ {level.timeLimitSec}s</span>
        <span>💹 {level.cols}×{level.rows}</span>
        <span>📈 {level.name}</span>
      </div>
      <p style={css.hint}>Use as setas do teclado ou o D-pad abaixo para mover. No celular, deslize na tela.</p>
      <button style={css.primaryBtn} onClick={startGame}>Iniciar Fase {levelIdx + 1}</button>
      {onClose && <button style={css.ghostBtn} onClick={onClose}>Voltar</button>}
    </div>
  );

  // ── CONFIRMAÇÃO DE ABANDONO
  if (phase === 'confirm_abandon') return (
    <div style={css.screen}>
      <p style={{ fontSize: 36 }}>⚠️</p>
      <p style={css.title}>Abandonar treino?</p>
      <p style={{ ...css.sub, textAlign: 'center', maxWidth: 280 }}>
        Se sair agora, o progresso desta sessão não será salvo e o resultado final não será gerado.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button style={css.primaryBtn} onClick={handleAbandonCancel}>Continuar</button>
        <button style={css.ghostBtn}   onClick={handleAbandonConfirm}>Sair mesmo assim</button>
      </div>
    </div>
  );

  // ── RESULTADO FINAL
  if (phase === 'final_result') return (
    <div style={css.screen}>
      <p style={{ fontSize: 48 }}>🏆</p>
      <p style={css.title}>Treino concluído!</p>
      <p style={css.sub}>Avaliação sendo processada...</p>
      {onClose && <button style={{ ...css.ghostBtn, marginTop: 16 }} onClick={onClose}>Sair</button>}
    </div>
  );

  // ── PLAYING + END_ANIMATION
  return (
    <div style={css.screen}>
      <div style={css.hud}>
        <span>⏱ {timeLeft}s</span>
        <span>👣 {steps}</span>
        <span style={{ color: '#f08080' }}>↩ {revisits}</span>
        <span style={{ color: '#8b8fa8' }}>Fase {levelIdx + 1}/{LONG_MAZE_LEVELS.length}</span>
      </div>
      <div
        style={{ overflow: 'auto', maxWidth: '100%', maxHeight: '55vh', borderRadius: 8 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas
          ref={canvasRef}
          width={cols * CELL}
          height={rows * CELL}
          style={{ display: 'block', touchAction: 'none' }}
        />
      </div>
      <div style={css.dpad}>
        <div style={css.dpadRow}>
          <button style={dpadStyle('up')}    onClick={() => pressDpad('up')}>▲</button>
        </div>
        <div style={css.dpadRow}>
          <button style={dpadStyle('left')}  onClick={() => pressDpad('left')}>◄</button>
          <div style={{ width: 52 }} />
          <button style={dpadStyle('right')} onClick={() => pressDpad('right')}>►</button>
        </div>
        <div style={css.dpadRow}>
          <button style={dpadStyle('down')}  onClick={() => pressDpad('down')}>▼</button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button style={css.ghostBtn} onClick={startGame}>↺ Reiniciar</button>
        <button style={css.ghostBtn} onClick={handleAbandonRequest}>Sair</button>
      </div>
    </div>
  );
};

const css: Record<string, React.CSSProperties> = {
  screen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 12, padding: 16,
    minHeight: '100%', background: '#12131e', color: '#e8e9f0',
  },
  title:  { fontSize: 22, fontWeight: 800, margin: 0 },
  sub:    { fontSize: 13, color: '#8b8fa8', margin: 0 },
  hint:   { fontSize: 12, color: '#6b6f88', textAlign: 'center', maxWidth: 260 },
  infoBox: {
    display: 'flex', gap: 16, fontSize: 13, color: '#8b8fa8',
    background: 'rgba(255,255,255,0.04)', padding: '6px 16px', borderRadius: 8,
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
    display: 'flex', gap: 20, fontSize: 14, fontWeight: 600,
    color: '#a0b4f8', width: '100%', justifyContent: 'center',
  },
  dpad:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginTop: 8 },
  dpadRow: { display: 'flex', gap: 3 },
  dpadBtn: {
    width: 52, height: 52, fontSize: 20, borderRadius: 10,
    background: 'rgba(108,142,245,0.15)', color: '#6c8ef5',
    border: '1px solid rgba(108,142,245,0.30)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    userSelect: 'none',
  },
};
