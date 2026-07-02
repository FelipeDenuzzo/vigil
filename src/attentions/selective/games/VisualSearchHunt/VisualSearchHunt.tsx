// src/attentions/selective/games/VisualSearchHunt/VisualSearchHunt.tsx

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// useNavigate removed
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';
import { VisualSearchEvaluationContainer } from './VisualSearchEvaluationContainer';
import type { GameResult } from '../../../../shared/types';
import { saveSession, saveResult } from '../../../../shared/storage';
import { auth } from '../../../../lib/firebase';
import type {
  VisualSearchClickLog,
  VisualSearchRoundLog,
  VisualSearchSessionLog,
  VisualSearchShape,
  VisualSearchColor,
} from './types';
import { useScaleToFit } from '../../../../hooks/useScaleToFit';

type Shape = 'circle' | 'square' | 'triangle';
type Color = 'red' | 'blue' | 'green' | 'yellow';
type SearchMode = 'popout' | 'mixed' | 'conjunction' | 'hard-conjunction';
type RoundStatus = 'intro' | 'simulator' | 'instruction' | 'playing' | 'won' | 'lost' | 'finished';
type ClickAction = 'mark' | 'unmark';

type Tile = {
  id: string;
  shape: Shape;
  color: Color;
  isTarget: boolean;
  selected: boolean;
  row?: number;
  col?: number;
};

type RoundResult = {
  roundIndex: number;
  level: number;
  targetShape: Shape;
  targetColor: Color;
  status: 'won' | 'lost';
  hits: number;
  errors: number;
  missedTargets: number;
  totalTargets: number;
  gridSize: number;
  durationMs: number;
  timeLimitSeconds: number;
  remainingTimeSeconds: number;
  startedAt: number;
  endedAt: number;
  clickEvents: VisualSearchClickLog[];
};

type VisualSearchHuntProps = {
  onCorrectSound?: () => void;
  onErrorSound?: () => void;
  onEnd?: (result: GameResult, sessionId: string) => void;
};

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
const FIXED_TIME_SECONDS = 30;
const MAX_PHASES = 10;
const SIMULATOR_ROUNDS = 3;

const SHAPE_LABEL: Record<Shape, string> = {
  circle: 'círculos',
  square: 'quadrados',
  triangle: 'triângulos',
};

const COLOR_LABEL: Record<Color, string> = {
  red: 'vermelhos',
  blue: 'azuis',
  green: 'verdes',
  yellow: 'amarelos',
};

const COLOR_HEX: Record<Color, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
};

const SHAPE_IMAGE: Record<Shape, Record<Color, string>> = {
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
};

// Keyframes injetados uma vez no <head>
const TARGET_FADE_STYLE_ID = 'vsh-target-fade-style';
if (typeof document !== 'undefined' && !document.getElementById(TARGET_FADE_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = TARGET_FADE_STYLE_ID;
  style.textContent = `
    @keyframes vshTargetFadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .vsh-target-fade {
      animation: vshTargetFadeIn 800ms ease 350ms both;
    }
    .vsh-tile-selected-overlay {
      position: absolute;
      inset: 0;
      background: rgba(107, 114, 128, 0.28);
      pointer-events: none;
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getShapeFallbackStyle(shape: Shape, color: Color): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '68%',
    height: '68%',
    backgroundColor: COLOR_HEX[color],
  };
  if (shape === 'circle') return { ...base, borderRadius: 999 };
  if (shape === 'square') return { ...base, borderRadius: 8 };
  return {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeft: '20px solid transparent',
    borderRight: '20px solid transparent',
    borderBottom: `38px solid ${COLOR_HEX[color]}`,
  };
}

function getLevelConfig(level: number): {
  mode: SearchMode;
  gridSize: number;
  targetMin: number;
  targetMax: number;
  timeSeconds: number;
} {
  if (level === 1) return { mode: 'popout', gridSize: 4, targetMin: 3, targetMax: 4, timeSeconds: FIXED_TIME_SECONDS };
  if (level === 2) return { mode: 'popout', gridSize: 4, targetMin: 4, targetMax: 5, timeSeconds: FIXED_TIME_SECONDS };
  if (level === 3) return { mode: 'mixed', gridSize: 5, targetMin: 4, targetMax: 6, timeSeconds: FIXED_TIME_SECONDS };
  if (level === 4) return { mode: 'mixed', gridSize: 5, targetMin: 5, targetMax: 7, timeSeconds: FIXED_TIME_SECONDS };
  if (level === 5) return { mode: 'mixed', gridSize: 6, targetMin: 6, targetMax: 8, timeSeconds: FIXED_TIME_SECONDS };
  if (level === 6) return { mode: 'conjunction', gridSize: 6, targetMin: 6, targetMax: 9, timeSeconds: FIXED_TIME_SECONDS };
  if (level === 7) return { mode: 'conjunction', gridSize: 7, targetMin: 7, targetMax: 10, timeSeconds: FIXED_TIME_SECONDS };
  if (level === 8) return { mode: 'conjunction', gridSize: 7, targetMin: 8, targetMax: 12, timeSeconds: FIXED_TIME_SECONDS };
  return { mode: 'hard-conjunction', gridSize: 8, targetMin: 10, targetMax: 14, timeSeconds: FIXED_TIME_SECONDS };
}

function buildTiles(targetShape: Shape, targetColor: Color, level: number) {
  const config = getLevelConfig(level);
  const totalCells = config.gridSize * config.gridSize;
  const totalTargets =
    Math.floor(Math.random() * (config.targetMax - config.targetMin + 1)) + config.targetMin;

  const targets: Tile[] = Array.from({ length: totalTargets }, (_, index) => ({
    id: `target-${index}`,
    shape: targetShape,
    color: targetColor,
    isTarget: true,
    selected: false,
  }));

  const otherShapes = SHAPES.filter((shape) => shape !== targetShape);
  const otherColors = COLORS.filter((color) => color !== targetColor);
  const distractors: Tile[] = [];

  for (let index = 0; index < totalCells - totalTargets; index += 1) {
    let shape: Shape = randomItem(SHAPES);
    let color: Color = randomItem(COLORS);

    if (config.mode === 'popout') {
      const popByShape = Math.random() > 0.5;
      shape = popByShape ? randomItem(otherShapes) : randomItem(SHAPES);
      color = popByShape ? randomItem(COLORS) : randomItem(otherColors);
    } else if (config.mode === 'mixed') {
      const variant = index % 3;
      if (variant === 0) { shape = targetShape; color = randomItem(otherColors); }
      else if (variant === 1) { shape = randomItem(otherShapes); color = targetColor; }
      else { shape = randomItem(otherShapes); color = randomItem(otherColors); }
    } else {
      const variant = index % 4;
      if (variant === 0) { shape = targetShape; color = randomItem(otherColors); }
      else if (variant === 1) { shape = randomItem(otherShapes); color = targetColor; }
      else { shape = randomItem(otherShapes); color = randomItem(otherColors); }
    }

    distractors.push({ id: `distractor-${index}`, shape, color, isTarget: false, selected: false });
  }

  return { tiles: shuffle([...targets, ...distractors]), totalTargets, config };
}

type SearchAnalysis = {
  systematicMoves: number;
  erraticMoves: number;
  organizationIndex: number | undefined;
  scanPattern: 'chaotic' | 'row-wise' | 'column-wise' | 'mixed';
  leftSideClicks: number;
  rightSideClicks: number;
  leftSideTargetMisses: number;
  rightSideTargetMisses: number;
  spatialAsymmetryIndex: number | undefined;
};

function analyzeVisualSearchOrganization(clickLog: VisualSearchClickLog[], gridSize: number, tiles: Tile[]): SearchAnalysis {
  const markClicks = clickLog.filter((c) => c.action === 'mark');

  const result: SearchAnalysis = {
    systematicMoves: 0,
    erraticMoves: 0,
    organizationIndex: undefined,
    scanPattern: 'chaotic',
    leftSideClicks: 0,
    rightSideClicks: 0,
    leftSideTargetMisses: 0,
    rightSideTargetMisses: 0,
    spatialAsymmetryIndex: undefined,
  };

  if (markClicks.length < 2) return result;

  let horizontalMovements = 0;
  let verticalMovements = 0;

  for (let i = 1; i < markClicks.length; i += 1) {
    const prev = markClicks[i - 1];
    const curr = markClicks[i];
    if (prev.row === undefined || curr.row === undefined || prev.col === undefined || curr.col === undefined) continue;
    const rowDelta = Math.abs(curr.row - prev.row);
    const colDelta = Math.abs(curr.col - prev.col);
    const manhattan = rowDelta + colDelta;
    if (manhattan <= 2) result.systematicMoves += 1;
    else result.erraticMoves += 1;
    if (colDelta > rowDelta) horizontalMovements += 1;
    else if (rowDelta > colDelta) verticalMovements += 1;
  }

  const totalComparableMoves = result.systematicMoves + result.erraticMoves;
  if (totalComparableMoves > 0) {
    result.organizationIndex = Number(((result.systematicMoves / totalComparableMoves) * 100).toFixed(2));
  }

  if (result.organizationIndex !== undefined && result.organizationIndex < 30) result.scanPattern = 'chaotic';
  else if (horizontalMovements > verticalMovements * 1.5) result.scanPattern = 'row-wise';
  else if (verticalMovements > horizontalMovements * 1.5) result.scanPattern = 'column-wise';
  else if (result.organizationIndex !== undefined && result.organizationIndex >= 40) result.scanPattern = 'mixed';
  else result.scanPattern = 'chaotic';

  for (const click of markClicks) {
    if (click.screenHalf === 'left') result.leftSideClicks += 1;
    else if (click.screenHalf === 'right') result.rightSideClicks += 1;
  }

  for (const tile of tiles) {
    if (!tile.isTarget || tile.selected || tile.row === undefined || tile.col === undefined) continue;
    const centerCol = gridSize / 2;
    if (tile.col < centerCol) result.leftSideTargetMisses += 1;
    else result.rightSideTargetMisses += 1;
  }

  const totalSideClicks = result.leftSideClicks + result.rightSideClicks;
  if (totalSideClicks > 0) {
    const asymmetry = Math.abs(result.leftSideClicks - result.rightSideClicks) / totalSideClicks;
    result.spatialAsymmetryIndex = Number((asymmetry * 100).toFixed(2));
  }

  return result;
}

// ─── Simulator ───────────────────────────────────────────────────────────────

type SimTile = {
  id: string;
  shape: Shape;
  color: Color;
  isTarget: boolean;
  feedback: 'correct' | 'wrong' | null;
};

function buildSimTiles(targetShape: Shape, targetColor: Color): SimTile[] {
  const gridSize = 4;
  const totalCells = gridSize * gridSize;
  const totalTargets = 3;
  const otherShapes = SHAPES.filter((s) => s !== targetShape);
  const otherColors = COLORS.filter((c) => c !== targetColor);

  const targets: SimTile[] = Array.from({ length: totalTargets }, (_, i) => ({
    id: `sim-target-${i}`,
    shape: targetShape,
    color: targetColor,
    isTarget: true,
    feedback: null,
  }));

  const distractors: SimTile[] = Array.from({ length: totalCells - totalTargets }, (_, i) => ({
    id: `sim-dist-${i}`,
    shape: randomItem(i % 2 === 0 ? otherShapes : SHAPES),
    color: randomItem(i % 2 === 0 ? COLORS : otherColors),
    isTarget: false,
    feedback: null,
  }));

  return shuffle([...targets, ...distractors]);
}

type SimState = {
  round: number;
  targetShape: Shape;
  targetColor: Color;
  tiles: SimTile[];
  hits: number;
  totalTargets: number;
  done: boolean;
};

function SimulatorScreen({ onFinish }: { onFinish: () => void }) {
  const [state, setState] = useState<SimState>(() => {
    const shape = randomItem(SHAPES);
    const color = randomItem(COLORS);
    return {
      round: 1,
      targetShape: shape,
      targetColor: color,
      tiles: buildSimTiles(shape, color),
      hits: 0,
      totalTargets: 3,
      done: false,
    };
  });

  const [roundMsg, setRoundMsg] = useState<string | null>(null);

  function handleSimClick(tile: SimTile) {
    if (state.done) return;
    if (tile.feedback !== null) return;

    const fb: 'correct' | 'wrong' = tile.isTarget ? 'correct' : 'wrong';
    const newTiles = state.tiles.map((t) =>
      t.id === tile.id ? { ...t, feedback: fb } : t,
    );
    const newHits = fb === 'correct' ? state.hits + 1 : state.hits;
    const allFound = newHits >= state.totalTargets;

    setState((prev) => ({ ...prev, tiles: newTiles, hits: newHits }));

    if (allFound) {
      const isLast = state.round >= SIMULATOR_ROUNDS;
      setRoundMsg(isLast ? null : '✅ Todos encontrados! Próxima rodada...');
      setTimeout(() => {
        setRoundMsg(null);
        if (isLast) {
          setState((prev) => ({ ...prev, done: true }));
        } else {
          const nextShape = randomItem(SHAPES);
          const nextColor = randomItem(COLORS);
          setState({
            round: state.round + 1,
            targetShape: nextShape,
            targetColor: nextColor,
            tiles: buildSimTiles(nextShape, nextColor),
            hits: 0,
            totalTargets: 3,
            done: false,
          });
        }
      }, 1200);
    }
  }

  if (state.done) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)',
          color: '#eab308', padding: '8px 20px', borderRadius: '99px',
          fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.05em',
          width: 'fit-content', margin: '0 auto 16px auto'
        }}>
          <span style={{ fontSize: '18px' }}>🚧</span> MODO DE PRÁTICA
        </div>
        <Card>
          <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 36 }}>🎉</div>
            <h2 style={{ margin: 0 }}>Prática concluída!</h2>
            <h2 style={{ margin: 0, textTransform: 'uppercase' }}>Você entendeu como funciona?</h2>
            <div style={{ marginTop: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button onClick={onFinish} style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}>
                Ir para o Treino de Atenção →
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const shape = randomItem(SHAPES);
                  const color = randomItem(COLORS);
                  setState({
                    round: 1,
                    targetShape: shape,
                    targetColor: color,
                    tiles: buildSimTiles(shape, color),
                    hits: 0,
                    totalTargets: 3,
                    done: false,
                  });
                }}
                style={{ width: '100%', padding: '12px 16px', fontSize: '15px' }}
              >
                Repetir o Simulado
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)',
        color: '#eab308', padding: '8px 20px', borderRadius: '99px',
        fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.05em',
        width: 'fit-content', margin: '0 auto 8px auto'
      }}>
        <span style={{ fontSize: '18px' }}>🚧</span> MODO DE PRÁTICA
      </div>
      <Card>
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <span style={{ fontSize: 13, color: '#ffffff', position: 'relative' }}>
              Prática {state.round}/{SIMULATOR_ROUNDS}
              {state.round === 1 && (
                <span style={{
                  position: 'absolute', left: 0, top: '20px', whiteSpace: 'nowrap',
                  background: 'var(--color-primary)', color: '#fff', fontSize: '10px',
                  padding: '2px 6px', borderRadius: '4px', zIndex: 10
                }}>
                  ↑ quantidade de fases
                </span>
              )}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)', position: 'relative' }}>
              {state.round === 1 ? 'Aqui aparece o tempo que você tem para concluir a fase' : 'Sem timer — sem pressão!'}
              {state.round === 1 && (
                <span style={{
                  position: 'absolute', right: 0, top: '20px', whiteSpace: 'nowrap',
                  background: 'var(--color-primary)', color: '#fff', fontSize: '10px',
                  padding: '2px 6px', borderRadius: '4px', zIndex: 10
                }}>
                  ↑ indicador de tempo
                </span>
              )}
            </span>
          </div>
          <div style={{ textAlign: 'center', fontWeight: 700, position: 'relative', marginTop: state.round === 1 ? '12px' : '0' }}>
            {state.round === 1 ? (
              <>
                Aqui aparece o item que você precisa encontrar na grade abaixo
                <span style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '24px', whiteSpace: 'nowrap',
                  background: 'var(--color-primary)', color: '#fff', fontSize: '10px',
                  padding: '2px 6px', borderRadius: '4px', zIndex: 10
                }}>
                  ↑ item-alvo a buscar
                </span>
              </>
            ) : (
              <>
                Encontre os{' '}
                <span style={{ textTransform: 'uppercase' }}>
                  {SHAPE_LABEL[state.targetShape]} {COLOR_LABEL[state.targetColor]}
                </span>
              </>
            )}
          </div>
          {state.round === 1 && (
            <div style={{
              textAlign: 'center',
              fontSize: '13px',
              color: '#fff',
              lineHeight: '1.5',
              padding: '10px 16px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px dashed rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              margin: '12px auto 0 auto',
              maxWidth: '360px',
            }}>
              Essa é a figura que você precisa encontrar.<br /> No treino real, ela será mostrada antes da fase começar e não aparecerá durante a fase.
            </div>
          )}
          <div
            key={`sim-target-${state.round}`}
            className="vsh-target-fade"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 10 }}>
              <img
                src={SHAPE_IMAGE[state.targetShape][state.targetColor]}
                alt={`${state.targetShape} ${state.targetColor}`}
                loading="eager" decoding="sync"
                style={{ width: 48, height: 48, objectFit: 'contain' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
          {roundMsg && (
            <div style={{ textAlign: 'center', fontSize: 14, color: '#22c55e', fontWeight: 600 }}>{roundMsg}</div>
          )}
        </div>
      </Card>
      <Card>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 6,
            padding: 3,
            aspectRatio: '1 / 1',
          }}
        >
          {state.tiles.map((tile) => {
            const fb = tile.feedback;
            return (
              <button
                key={tile.id}
                onClick={() => handleSimClick(tile)}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  border: fb === 'correct'
                    ? '3px solid #22c55e'
                    : fb === 'wrong'
                    ? '3px solid #ef4444'
                    : '2px solid #e5e7eb',
                  background: fb === 'correct'
                    ? 'rgba(34,197,94,0.1)'
                    : fb === 'wrong'
                    ? 'rgba(239,68,68,0.08)'
                    : '#f9fafb',
                  cursor: fb !== null ? 'default' : 'pointer',
                  padding: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'border-color 120ms, background 120ms',
                }}
                aria-label={`${tile.shape} ${tile.color}`}
              >
                <img
                  src={SHAPE_IMAGE[tile.shape][tile.color]}
                  alt=""
                  loading="eager"
                  decoding="sync"
                  style={{ width: '62%', height: '62%', objectFit: 'contain', display: 'block' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                {fb === 'correct' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, pointerEvents: 'none' }}>✅</div>
                )}
                {fb === 'wrong' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, pointerEvents: 'none' }}>❌</div>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Intro ────────────────────────────────────────────────────────────────────

function IntroScreen({ onSimulator, onSkip }: { onSimulator: () => void; onSkip: () => void }) {
  return (
    <Card>
      <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>🎯</div>
        <h2 style={{ margin: 0 }}>Caça ao Alvo</h2>
        <p style={{ color: '#fff', fontSize: '1.15rem', lineHeight: 1.6, margin: 0 }}>
          Você verá uma grade com figuras coloridas. Encontre e clique em{' '}
          <strong>todas as figuras que correspondem ao alvo</strong> mostrado no topo.<br />
          O timer começa quando você iniciar cada fase.
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          <Button onClick={onSimulator}>Veja como o treino funciona</Button>
          <button
            onClick={onSkip}
            style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Pular e começar direto
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VisualSearchHunt({
  onCorrectSound,
  onErrorSound,
  onEnd,
}: VisualSearchHuntProps) {

  const [level, setLevel] = useState(1);
  const [roundIndex, setRoundIndex] = useState(1);
  const [status, setStatus] = useState<RoundStatus>('intro');
  const [targetShape, setTargetShape] = useState<Shape>('triangle');
  const [targetColor, setTargetColor] = useState<Color>('red');
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [remainingTime, setRemainingTime] = useState(FIXED_TIME_SECONDS);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<'mark' | 'unmark' | null>(null);

  const pendingFinishRef = useRef(false);

  const config = useMemo(() => getLevelConfig(level), [level]);
  const timerRef = useRef<number | null>(null);
  const roundStartRef = useRef<number>(0);
  const clickLogRef = useRef<VisualSearchClickLog[]>([]);
  const sessionLogRef = useRef<VisualSearchSessionLog | null>(null);

  const roundGeneratedRef = useRef(false);
  const generateRoundRef = useRef<(() => void) | null>(null);

  const uidRef = useRef<string | undefined>(auth.currentUser?.uid);
  useEffect(() => { uidRef.current = auth.currentUser?.uid; }, []);

  const scale = useScaleToFit(640, 800, 24);

  const persistRoundLog = useCallback((result: RoundResult) => {
    try {
      if (!sessionLogRef.current) return;
      const startedAt = result.startedAt;
      const reactionTimes = clickLogRef.current
        .filter((c) => c.action === 'mark' && c.isTarget)
        .map((c) => c.timestampMs - startedAt);
      const totalSelections = result.hits + result.errors;
      const accuracy = totalSelections > 0 ? Number(((result.hits / totalSelections) * 100).toFixed(2)) : 0;
      const searchAnalysis = analyzeVisualSearchOrganization([...clickLogRef.current], result.gridSize, tiles);
      const distractorOpportunities = result.totalTargets > 0
        ? result.gridSize * result.gridSize - result.totalTargets
        : 0;
      const roundLog: VisualSearchRoundLog = {
        roundIndex: result.roundIndex,
        level: result.level,
        startedAt,
        endedAt: result.endedAt,
        completed: result.status === 'won',
        targetShape: result.targetShape as VisualSearchShape,
        targetColor: result.targetColor as VisualSearchColor,
        totalTargets: result.totalTargets,
        hits: result.hits,
        errors: result.errors,
        missedTargets: result.missedTargets,
        gridSize: result.gridSize,
        timeLimitSeconds: result.timeLimitSeconds,
        remainingTimeSeconds: result.remainingTimeSeconds,
        durationMs: result.durationMs,
        reactionTimes,
        clicks: [...clickLogRef.current],
        accuracy,
        distractorOpportunities,
        systematicMoves: searchAnalysis.systematicMoves,
        erraticMoves: searchAnalysis.erraticMoves,
        organizationIndex: searchAnalysis.organizationIndex,
        scanPattern: searchAnalysis.scanPattern,
        leftSideClicks: searchAnalysis.leftSideClicks,
        rightSideClicks: searchAnalysis.rightSideClicks,
        leftSideTargetMisses: searchAnalysis.leftSideTargetMisses,
        rightSideTargetMisses: searchAnalysis.rightSideTargetMisses,
        spatialAsymmetryIndex: searchAnalysis.spatialAsymmetryIndex,
      };
      sessionLogRef.current.rounds.push(roundLog);
      saveSession(sessionLogRef.current, uidRef.current);
    } catch (e) {}
  }, [tiles]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const showFeedback = useCallback((type: 'mark' | 'unmark') => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 120);
  }, []);

  const generateRound = useCallback(() => {
    if (roundGeneratedRef.current) return;
    roundGeneratedRef.current = true;

    const nextShape = randomItem(SHAPES);
    const nextColor = randomItem(COLORS);
    const generated = buildTiles(nextShape, nextColor, level);
    const tilesWithCoords = generated.tiles.map((tile, index) => ({
      ...tile,
      row: Math.floor(index / generated.config.gridSize),
      col: index % generated.config.gridSize,
    }));
    setTargetShape(nextShape);
    setTargetColor(nextColor);
    setTiles(tilesWithCoords);
    setRemainingTime(FIXED_TIME_SECONDS);
    clickLogRef.current = [];
    roundStartRef.current = 0;
  }, [level]);

  generateRoundRef.current = generateRound;

  useEffect(() => {
    if (status === 'instruction') {
      roundGeneratedRef.current = false;
      generateRoundRef.current?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const finishSession = useCallback((results: RoundResult[]) => {
    const totalHits = results.reduce((s, r) => s + r.hits, 0);
    const totalErrors = results.reduce((s, r) => s + r.errors, 0);
    const roundsWon = results.filter((r) => r.status === 'won').length;
    const roundsLost = results.filter((r) => r.status === 'lost').length;
    const startedAt = results[0]?.startedAt ?? Date.now();
    const completedAt = Date.now();
    const totalSelections = totalHits + totalErrors;
    const sessionId = sessionLogRef.current?.sessionId ?? `vsh-${startedAt}`;
    const gameResult: GameResult = {
      sessionId,
      gameId: 'visual-search-hunt',
      attentionType: 'selective',
      startedAt, completedAt, sessionStatus: 'completed', abandoned: false, completed: true,
      totalRoundsPlanned: results.length, completedRounds: roundsWon + roundsLost,
      startedRounds: results.length,
      lastRoundIndexReached: results[results.length - 1]?.roundIndex ?? roundIndex,
      lastLevelReached: results[results.length - 1]?.level ?? level,
      accuracy: totalSelections > 0 ? Number(((totalHits / totalSelections) * 100).toFixed(2)) : 0,
    };
    try {
      if (sessionLogRef.current) {
        sessionLogRef.current.completedAt = completedAt;
        sessionLogRef.current.abandoned = false;
        saveSession(sessionLogRef.current, uidRef.current);
      }
      saveResult(gameResult, uidRef.current);
    } catch (e) {}
    
    setCompletedSessionId(sessionId);
    // Cast 'finished' to any since it's not in RoundStatus, or just let completedSessionId override rendering
    setStatus('intro'); // Status doesn't matter much if completedSessionId takes over
  }, [roundIndex, level]);

  const finishRound = useCallback(
    (resultStatus: 'won' | 'lost') => {
      clearTimer();
      const endedAt = Date.now();
      const startedAt = roundStartRef.current || endedAt;
      const hits = tiles.filter((t) => t.selected && t.isTarget).length;
      const errors = tiles.filter((t) => t.selected && !t.isTarget).length;
      const missedTargets = tiles.filter((t) => !t.selected && t.isTarget).length;
      const totalTargets = tiles.filter((t) => t.isTarget).length;
      const result: RoundResult = {
        roundIndex, level, targetShape, targetColor,
        status: resultStatus, hits, errors, missedTargets, totalTargets,
        gridSize: config.gridSize,
        durationMs: endedAt - startedAt,
        timeLimitSeconds: FIXED_TIME_SECONDS,
        remainingTimeSeconds: Number(remainingTime.toFixed(1)),
        startedAt, endedAt,
        clickEvents: [...clickLogRef.current],
      };
      setRoundResults((prev) => [...prev, result]);
      try {
        if (!sessionLogRef.current) {
          const sStarted = Date.now();
          sessionLogRef.current = {
            sessionId: `vsh-${sStarted}`, gameId: 'visual-search-hunt', attentionType: 'selective',
            startedAt: sStarted, sessionStatus: 'started', schemaVersion: 1, abandoned: false, rounds: [],
          };
          saveSession(sessionLogRef.current, uidRef.current);
        }
        persistRoundLog(result);
      } catch (e) {}
      setStatus(resultStatus);
    },
    [clearTimer, tiles, roundIndex, level, targetShape, targetColor, config.gridSize, remainingTime, persistRoundLog],
  );

  const startRound = useCallback(() => {
    if (!sessionLogRef.current) {
      const sStarted = Date.now();
      sessionLogRef.current = {
        sessionId: `vsh-${sStarted}`, gameId: 'visual-search-hunt', attentionType: 'selective',
        startedAt: sStarted, sessionStatus: 'started', schemaVersion: 1, abandoned: false, rounds: [],
      };
      try { saveSession(sessionLogRef.current, uidRef.current); } catch {}
    }
    setStatus('playing');
    roundStartRef.current = Date.now();
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        const next = Number((prev - 0.1).toFixed(1));
        if (next <= 0) { window.setTimeout(() => finishRound('lost'), 0); return 0; }
        return next;
      });
    }, 100);
  }, [clearTimer, finishRound]);

  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (status !== 'playing') return;
      const nextAction: ClickAction = tile.selected ? 'unmark' : 'mark';
      let screenHalf: 'left' | 'right' | undefined;
      if (tile.col !== undefined) screenHalf = tile.col < config.gridSize / 2 ? 'left' : 'right';
      const clickEvent: VisualSearchClickLog = {
        timestampMs: Date.now(), action: nextAction, isTarget: tile.isTarget, tileId: tile.id,
        roundIndex, phaseLevel: level,
        clickedShape: tile.shape as VisualSearchShape, clickedColor: tile.color as VisualSearchColor,
        targetShape: targetShape as VisualSearchShape, targetColor: targetColor as VisualSearchColor,
        row: tile.row, col: tile.col, screenHalf,
      };
      clickLogRef.current.push(clickEvent);
      if (nextAction === 'mark') { onCorrectSound?.(); showFeedback('mark'); }
      else { onErrorSound?.(); showFeedback('unmark'); }
      setTiles((prev) => prev.map((item) => item.id === tile.id ? { ...item, selected: !item.selected } : item));
    },
    [status, roundIndex, level, targetShape, targetColor, config.gridSize, onCorrectSound, onErrorSound, showFeedback],
  );

  const goToNextRound = useCallback(() => {
    if (roundIndex >= MAX_PHASES) {
      finishSession(roundResults);
      return;
    }
    setLevel((prev) => prev + 1);
    setRoundIndex((prev) => prev + 1);
    setStatus('instruction');
  }, [roundIndex, roundResults, finishSession]);

  const advanceRoundNow = useCallback(() => {
    clearTimer();
    const endedAt = Date.now();
    const startedAt = roundStartRef.current || endedAt;
    const hits = tiles.filter((t) => t.selected && t.isTarget).length;
    const errors = tiles.filter((t) => t.selected && !t.isTarget).length;
    const missedTargets = tiles.filter((t) => !t.selected && t.isTarget).length;
    const totalTargets = tiles.filter((t) => t.isTarget).length;
    const result: RoundResult = {
      roundIndex, level, targetShape, targetColor, status: 'lost',
      hits, errors, missedTargets, totalTargets, gridSize: config.gridSize,
      durationMs: endedAt - startedAt, timeLimitSeconds: FIXED_TIME_SECONDS,
      remainingTimeSeconds: Number(remainingTime.toFixed(1)), startedAt, endedAt,
      clickEvents: [...clickLogRef.current],
    };
    try {
      if (!sessionLogRef.current) {
        const sStarted = Date.now();
        sessionLogRef.current = {
          sessionId: `vsh-${sStarted}`, gameId: 'visual-search-hunt', attentionType: 'selective',
          startedAt: sStarted, sessionStatus: 'started', schemaVersion: 1, abandoned: false, rounds: [],
        };
        saveSession(sessionLogRef.current, uidRef.current);
      }
      persistRoundLog(result);
    } catch (e) {}

    if (roundIndex >= MAX_PHASES) {
      pendingFinishRef.current = true;
      setRoundResults((prev) => [...prev, result]);
    } else {
      setRoundResults((prev) => [...prev, result]);
      setLevel((l) => l + 1);
      setRoundIndex((r) => r + 1);
      setStatus('instruction');
    }
  }, [clearTimer, tiles, roundIndex, level, targetShape, targetColor, config.gridSize, remainingTime, persistRoundLog]);

  useEffect(() => {
    if (pendingFinishRef.current && roundResults.length > 0) {
      pendingFinishRef.current = false;
      finishSession(roundResults);
    }
  }, [roundResults, finishSession]);

  useEffect(() => { return () => clearTimer(); }, [clearTimer]);

  const markSessionAbandoned = useCallback(() => {
    try {
      const now = Date.now();
      if (!sessionLogRef.current) {
        sessionLogRef.current = {
          sessionId: `vsh-${now}`, gameId: 'visual-search-hunt', attentionType: 'selective',
          startedAt: now, sessionStatus: 'started', schemaVersion: 1,
          abandoned: true, abandonedAtRound: roundIndex, abandonedAtLevel: level, completedAt: now, rounds: [],
        };
      } else {
        sessionLogRef.current.abandoned = true;
        sessionLogRef.current.abandonedAtRound = roundIndex;
        sessionLogRef.current.abandonedAtLevel = level;
        sessionLogRef.current.completedAt = now;
      }
      saveSession(sessionLogRef.current, uidRef.current);
    } catch (e) {}
  }, [level, roundIndex]);

  const restartTraining = useCallback(() => {
    try { markSessionAbandoned(); } catch (e) {}
    clearTimer();
    setLevel(1); setRoundIndex(1); setStatus('intro');
    setTiles([]); setRoundResults([]); setRemainingTime(FIXED_TIME_SECONDS);
    clickLogRef.current = []; roundStartRef.current = 0; sessionLogRef.current = null;
    roundGeneratedRef.current = false;
    pendingFinishRef.current = false;
  }, [clearTimer, markSessionAbandoned]);

  useEffect(() => {
    return () => {
      try {
        if (sessionLogRef.current && !sessionLogRef.current.completedAt) {
          sessionLogRef.current.abandoned = true;
          sessionLogRef.current.abandonedAtRound = roundIndex;
          sessionLogRef.current.abandonedAtLevel = level;
          sessionLogRef.current.completedAt = Date.now();
          saveSession(sessionLogRef.current, uidRef.current);
        }
      } catch (e) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridTemplateColumns = `repeat(${config.gridSize}, minmax(0, 1fr))`;
  const nextPhaseNumber = roundIndex + 1;
  const tileGap = config.gridSize <= 5 ? 6 : config.gridSize <= 6 ? 5 : 3;

  if (completedSessionId) {
    return (
      <VisualSearchEvaluationContainer
        sessionId={completedSessionId}
        onRepeat={() => {
          setCompletedSessionId(null);
          setStatus('intro');
          setLevel(1);
          setRoundIndex(1);
          setRoundResults([]);
        }}
        onClose={() => onEnd?.({} as any, completedSessionId)}
      />
    );
  }

  return (
    <div style={{ 
      maxWidth: 640, 
      margin: '0 auto', 
      padding: 12,
      transform: `scale(${scale})`,
      transformOrigin: 'top center',
      width: '100%'
    }}>

      {status === 'intro' && (
        <IntroScreen
          onSimulator={() => setStatus('simulator')}
          onSkip={() => setStatus('instruction')}
        />
      )}

      {status === 'simulator' && (
        <SimulatorScreen onFinish={() => setStatus('instruction')} />
      )}

      {status === 'instruction' && (
        <Card>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={startRound}>{`Começar — Fase ${roundIndex}`}</Button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0 }}>Caça ao Alvo</h2>
              <p style={{ marginTop: 8, marginBottom: 0 }}>
                Encontre todos os{' '}
                <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                  {SHAPE_LABEL[targetShape]} {COLOR_LABEL[targetColor]}
                </span>.
              </p>
            </div>

            <div
              key={`target-${roundIndex}`}
              className="vsh-target-fade"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 120, borderRadius: 18, border: 'none', background: 'transparent', boxShadow: 'none' }}
            >
              <div style={{ width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', borderRadius: 12 }}>
                <img
                  src={SHAPE_IMAGE[targetShape][targetColor]}
                  alt={`${targetShape} ${targetColor}`}
                  loading="eager" decoding="sync"
                  style={{ width: 70, height: 70, objectFit: 'contain' }}
                  onError={(event) => {
                    const img = event.currentTarget;
                    img.style.opacity = '0'; img.style.pointerEvents = 'none';
                    const fallback = img.nextElementSibling as HTMLDivElement | null;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', ...getShapeFallbackStyle(targetShape, targetColor) }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      {status === 'playing' && (
        <div style={{ display: 'grid', gap: 8 }}>
          <Card>
            <div style={{ height: 6, width: '100%', borderRadius: 999, background: '#e5e7eb', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(0, (remainingTime / FIXED_TIME_SECONDS) * 100)}%`, background: '#111827', transition: 'width 100ms linear' }} />
            </div>
          </Card>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <Card style={{ flex: 1, margin: 0 }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns,
                    gap: tileGap,
                    padding: 3,
                    borderRadius: 8,
                    width: '100%',
                    maxHeight: '72vh',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                  }}
                >
                  {tiles.map((tile) => {
                    const isSelected = tile.selected;
                    return (
                      <button
                        key={tile.id}
                        onClick={() => handleTileClick(tile)}
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          border: isSelected ? '3px solid #6b7280' : '2px solid #e5e7eb',
                          background: isSelected ? '#f3f4f6' : '#f9fafb',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'border-color 80ms, background 80ms, box-shadow 80ms',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: isSelected
                            ? 'inset 0 0 0 1px #d1d5db, 0 0 0 2px rgba(107,114,128,0.18)'
                            : 'none',
                        }}
                        aria-label={`${tile.shape} ${tile.color}${isSelected ? ' selecionado' : ''}`}
                      >
                        <img
                          src={SHAPE_IMAGE[tile.shape][tile.color]}
                          alt=""
                          loading="eager"
                          decoding="sync"
                          style={{
                            width: '62%',
                            height: '62%',
                            objectFit: 'contain',
                            display: 'block',
                            opacity: isSelected ? 0.55 : 1,
                            transition: 'opacity 80ms',
                          }}
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const fb = img.nextElementSibling as HTMLElement | null;
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                        <div
                          style={{
                            display: 'none',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'absolute',
                            inset: 0,
                            opacity: isSelected ? 0.55 : 1,
                          }}
                        >
                          <div style={getShapeFallbackStyle(tile.shape, tile.color)} />
                        </div>
                        {isSelected && (
                          <div className="vsh-tile-selected-overlay" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {feedback && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      borderRadius: 8,
                      border: `3px solid ${feedback === 'mark' ? '#22c55e' : '#ef4444'}`,
                      opacity: 0.5,
                      transition: 'opacity 120ms',
                    }}
                  />
                )}
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Button onClick={advanceRoundNow} style={{ height: '100%', minWidth: 100, fontSize: '18px', padding: '0 24px' }}>Avançar</Button>
            </div>
          </div>
        </div>
      )}

      {(status === 'won' || status === 'lost') && (() => {
        const last = roundResults[roundResults.length - 1];
        return (
          <Card>
            <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 40 }}>{status === 'won' ? '🎯' : '⏱️'}</div>
              <h2 style={{ margin: 0 }}>{status === 'won' ? 'Fase concluída!' : 'Tempo esgotado'}</h2>
              {status === 'won' && last && (
                <div style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                  <div>✅ Acertos: <strong>{last.hits}</strong> / {last.totalTargets}</div>
                  <div>❌ Erros: <strong>{last.errors}</strong></div>
                  {last.missedTargets > 0 && <div>👁️ Perdidos: <strong>{last.missedTargets}</strong></div>}
                </div>
              )}
              {roundIndex < MAX_PHASES ? (
                <Button onClick={goToNextRound}>
                  {`Fase ${nextPhaseNumber} →`}
                </Button>
              ) : (
                <Button onClick={() => finishSession(roundResults)}>Ver resultado final</Button>
              )}
              <button
                onClick={restartTraining}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Recomeçar do início
              </button>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
