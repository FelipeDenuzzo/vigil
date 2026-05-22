import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';
import type { GameResult } from '../../../../shared/types';

type Shape = 'circle' | 'square' | 'triangle';
type Color = 'red' | 'blue' | 'green' | 'yellow';
type SearchMode = 'popout' | 'mixed' | 'conjunction' | 'hard-conjunction';
type RoundStatus = 'instruction' | 'playing' | 'won' | 'lost' | 'finished';
type ClickAction = 'mark' | 'unmark';

type Tile = {
  id: string;
  shape: Shape;
  color: Color;
  isTarget: boolean;
  selected: boolean;
};

type ClickEventLog = {
  timestampMs: number;
  roundIndex: number;
  phaseLevel: number;
  action: ClickAction;
  tileId: string;
  isTarget: boolean;
  clickedShape: Shape;
  clickedColor: Color;
  targetShape: Shape;
  targetColor: Color;
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
  clickEvents: ClickEventLog[];
};

type VisualSearchHuntProps = {
  onCorrectSound?: () => void;
  onErrorSound?: () => void;
  onEnd?: (result: GameResult) => void;
};

const SHAPES: Shape[] = ['circle', 'square', 'triangle'];
const COLORS: Color[] = ['red', 'blue', 'green', 'yellow'];
const FIXED_TIME_SECONDS = 30;
const MAX_PHASES = 5;

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

/*
  Preferência recomendada:
  coloque seus arquivos dentro de public/formas/
  Exemplo:
  public/formas/circle-red.png
  public/formas/square-blue.png
  public/formas/triangle-green.png
*/
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

  if (shape === 'circle') {
    return { ...base, borderRadius: 999 };
  }

  if (shape === 'square') {
    return { ...base, borderRadius: 8 };
  }

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
  if (level <= 2) {
    return {
      mode: 'popout',
      gridSize: 4,
      targetMin: 3,
      targetMax: 5,
      timeSeconds: FIXED_TIME_SECONDS,
    };
  }

  if (level <= 4) {
    return {
      mode: 'mixed',
      gridSize: 5,
      targetMin: 4,
      targetMax: 6,
      timeSeconds: FIXED_TIME_SECONDS,
    };
  }

  return {
    mode: 'conjunction',
    gridSize: 6,
    targetMin: 5,
    targetMax: 8,
    timeSeconds: FIXED_TIME_SECONDS,
  };
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
      if (variant === 0) {
        shape = targetShape;
        color = randomItem(otherColors);
      } else if (variant === 1) {
        shape = randomItem(otherShapes);
        color = targetColor;
      } else {
        shape = randomItem(otherShapes);
        color = randomItem(otherColors);
      }
    } else {
      const variant = index % 4;
      if (variant === 0) {
        shape = targetShape;
        color = randomItem(otherColors);
      } else if (variant === 1) {
        shape = randomItem(otherShapes);
        color = targetColor;
      } else {
        shape = randomItem(otherShapes);
        color = randomItem(otherColors);
      }
    }

    distractors.push({
      id: `distractor-${index}`,
      shape,
      color,
      isTarget: false,
      selected: false,
    });
  }

  return {
    tiles: shuffle([...targets, ...distractors]),
    totalTargets,
    config,
  };
}

export default function VisualSearchHunt({
  onCorrectSound,
  onErrorSound,
  onEnd,
}: VisualSearchHuntProps) {
  const navigate = useNavigate();

  const [level, setLevel] = useState(1);
  const [roundIndex, setRoundIndex] = useState(1);
  const [status, setStatus] = useState<RoundStatus>('instruction');

  const [targetShape, setTargetShape] = useState<Shape>('triangle');
  const [targetColor, setTargetColor] = useState<Color>('red');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [remainingTime, setRemainingTime] = useState(FIXED_TIME_SECONDS);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<'mark' | 'unmark' | null>(null);

  const config = useMemo(() => getLevelConfig(level), [level]);

  const timerRef = useRef<number | null>(null);
  const roundStartRef = useRef<number>(0);
  const clickLogRef = useRef<ClickEventLog[]>([]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showFeedback = useCallback((type: 'mark' | 'unmark') => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 120);
  }, []);

  const generateRound = useCallback(() => {
    const nextShape = randomItem(SHAPES);
    const nextColor = randomItem(COLORS);
    const generated = buildTiles(nextShape, nextColor, level);

    setTargetShape(nextShape);
    setTargetColor(nextColor);
    setTiles(generated.tiles);
    setRemainingTime(FIXED_TIME_SECONDS);
    clickLogRef.current = [];
    roundStartRef.current = 0;
  }, [level]);

  useEffect(() => {
    if (status === 'instruction') {
      generateRound();
    }
  }, [status, generateRound]);

  const finishRound = useCallback(
    (resultStatus: 'won' | 'lost') => {
      clearTimer();

      const endedAt = Date.now();
      const startedAt = roundStartRef.current || endedAt;

      const hits = tiles.filter((tile) => tile.selected && tile.isTarget).length;
      const errors = tiles.filter((tile) => tile.selected && !tile.isTarget).length;
      const missedTargets = tiles.filter((tile) => !tile.selected && tile.isTarget).length;
      const totalTargets = tiles.filter((tile) => tile.isTarget).length;

      const result: RoundResult = {
        roundIndex,
        level,
        targetShape,
        targetColor,
        status: resultStatus,
        hits,
        errors,
        missedTargets,
        totalTargets,
        gridSize: config.gridSize,
        durationMs: endedAt - startedAt,
        timeLimitSeconds: FIXED_TIME_SECONDS,
        remainingTimeSeconds: Number(remainingTime.toFixed(1)),
        startedAt,
        endedAt,
        clickEvents: [...clickLogRef.current],
      };

      setRoundResults((prev) => [...prev, result]);
      setStatus(resultStatus);
    },
    [
      clearTimer,
      tiles,
      roundIndex,
      level,
      targetShape,
      targetColor,
      config.gridSize,
      remainingTime,
    ],
  );

  const startRound = useCallback(() => {
    setStatus('playing');
    roundStartRef.current = Date.now();

    clearTimer();

    timerRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        const next = Number((prev - 0.1).toFixed(1));

        if (next <= 0) {
          window.setTimeout(() => finishRound('lost'), 0);
          return 0;
        }

        return next;
      });
    }, 100);
  }, [clearTimer, finishRound]);

  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (status !== 'playing') return;

      const nextAction: ClickAction = tile.selected ? 'unmark' : 'mark';

      const clickEvent: ClickEventLog = {
        timestampMs: Date.now(),
        roundIndex,
        phaseLevel: level,
        action: nextAction,
        tileId: tile.id,
        isTarget: tile.isTarget,
        clickedShape: tile.shape,
        clickedColor: tile.color,
        targetShape,
        targetColor,
      };

      clickLogRef.current.push(clickEvent);

      if (nextAction === 'mark') {
        onCorrectSound?.();
        showFeedback('mark');
      } else {
        onErrorSound?.();
        showFeedback('unmark');
      }

      setTiles((prev) =>
        prev.map((item) =>
          item.id === tile.id
            ? { ...item, selected: !item.selected }
            : item,
        ),
      );
    },
    [
      status,
      roundIndex,
      level,
      targetShape,
      targetColor,
      onCorrectSound,
      onErrorSound,
      showFeedback,
    ],
  );

  const goToNextRound = useCallback(() => {
    if (roundIndex >= MAX_PHASES) {
      const totalHits = roundResults.reduce((sum, round) => sum + round.hits, 0);
      const totalErrors = roundResults.reduce((sum, round) => sum + round.errors, 0);
      const roundsWon = roundResults.filter((round) => round.status === 'won').length;
      const roundsLost = roundResults.filter((round) => round.status === 'lost').length;
      const totalSelections = totalHits + totalErrors;

      const startedAt = roundResults[0]?.startedAt ?? Date.now();
      const completedAt = Date.now();

      const gameResult: GameResult = {
        sessionId: `session-${startedAt}`,
        gameId: 'visual-search-hunt',
        attentionType: 'selective',

        startedAt,
        completedAt,

        sessionStatus: 'completed',
        abandoned: false,
        completed: true,

        totalRoundsPlanned: roundResults.length,
        completedRounds: roundsWon + roundsLost,
        startedRounds: roundResults.length,
        lastRoundIndexReached: roundResults[roundResults.length - 1]?.roundIndex ?? roundIndex,
        lastLevelReached: roundResults[roundResults.length - 1]?.level ?? level,

        accuracy: totalSelections > 0 ? Number(((totalHits / totalSelections) * 100).toFixed(2)) : 0,
      };

      onEnd?.(gameResult);
      setStatus('finished');
      return;
    }

    setLevel((prev) => prev + 1);
    setRoundIndex((prev) => prev + 1);
    setStatus('instruction');
  }, [roundIndex, roundResults, onEnd]);

  const advanceRoundNow = useCallback(() => {
    clearTimer();

    const endedAt = Date.now();
    const startedAt = roundStartRef.current || endedAt;

    const hits = tiles.filter((tile) => tile.selected && tile.isTarget).length;
    const errors = tiles.filter((tile) => tile.selected && !tile.isTarget).length;
    const missedTargets = tiles.filter((tile) => !tile.selected && tile.isTarget).length;
    const totalTargets = tiles.filter((tile) => tile.isTarget).length;

    const result: RoundResult = {
      roundIndex,
      level,
      targetShape,
      targetColor,
      status: 'lost',
      hits,
      errors,
      missedTargets,
      totalTargets,
      gridSize: config.gridSize,
      durationMs: endedAt - startedAt,
      timeLimitSeconds: FIXED_TIME_SECONDS,
      remainingTimeSeconds: Number(remainingTime.toFixed(1)),
      startedAt,
      endedAt,
      clickEvents: [...clickLogRef.current],
    };

    setRoundResults((prev) => {
      const next = [...prev, result];

      const totalHits = next.reduce((sum, r) => sum + r.hits, 0);
      const totalErrors = next.reduce((sum, r) => sum + r.errors, 0);
      const roundsWon = next.filter((r) => r.status === 'won').length;
      const roundsLost = next.filter((r) => r.status === 'lost').length;
      const totalSelections = totalHits + totalErrors;

      if (roundIndex >= MAX_PHASES) {
        const started = next[0]?.startedAt ?? Date.now();
        const completedAt = Date.now();

        const gameResult: GameResult = {
          sessionId: `session-${started}`,
          gameId: 'visual-search-hunt',
          attentionType: 'selective',

          startedAt: started,
          completedAt,

          sessionStatus: 'completed',
          abandoned: false,
          completed: true,

          totalRoundsPlanned: next.length,
          completedRounds: roundsWon + roundsLost,
          startedRounds: next.length,
          lastRoundIndexReached: next[next.length - 1]?.roundIndex ?? roundIndex,
          lastLevelReached: next[next.length - 1]?.level ?? level,

          accuracy: totalSelections > 0 ? Number(((totalHits / totalSelections) * 100).toFixed(2)) : 0,
        };

        onEnd?.(gameResult);
        setStatus('finished');
      } else {
        setLevel((l) => l + 1);
        setRoundIndex((r) => r + 1);
        setStatus('instruction');
      }

      return next;
    });
  }, [clearTimer, tiles, roundIndex, level, targetShape, targetColor, config.gridSize, remainingTime, onEnd]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const gridTemplateColumns = `repeat(${config.gridSize}, minmax(0, 1fr))`;
  const nextPhaseNumber = roundIndex + 1;

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      {status === 'instruction' && (
        <Card>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ margin: 0 }}>Caça ao Alvo</h2>
              <p style={{ marginTop: 10, marginBottom: 0 }}>
                Encontre todos os {SHAPE_LABEL[targetShape]} {COLOR_LABEL[targetColor]}.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 100,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#ffffff',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={SHAPE_IMAGE[targetShape][targetColor]}
                  alt={`${targetShape} ${targetColor}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(event) => {
                    const img = event.currentTarget;
                    img.style.display = 'none';
                    const fallback = img.nextElementSibling as HTMLDivElement | null;
                    if (fallback) fallback.style.display = 'block';
                  }}
                />
                <div
                  style={{
                    display: 'none',
                    ...getShapeFallbackStyle(targetShape, targetColor),
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8, color: '#374151' }}>
              <p style={{ margin: 0 }}>Toque para marcar. Toque novamente para desmarcar.</p>
              <p style={{ margin: 0 }}>Marque apenas as figuras que combinam com o alvo mostrado.</p>
            </div>

            <Button onClick={startRound}>Começar — Fase {roundIndex}</Button>
          </div>
        </Card>
      )}

      {status === 'playing' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Card>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ textAlign: 'left', fontWeight: 700, color: '#111827' }}>
                Encontre os {SHAPE_LABEL[targetShape]} {COLOR_LABEL[targetColor]}
              </div>

              <div
                style={{
                  height: 10,
                  width: '100%',
                  borderRadius: 999,
                  background: '#e5e7eb',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(0, (remainingTime / FIXED_TIME_SECONDS) * 100)}%`,
                    background: '#111827',
                    transition: 'width 100ms linear',
                  }}
                />
              </div>

              <div>
                <Button onClick={advanceRoundNow} style={{ width: '100%' }}>Avançar</Button>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns,
                  gap: 10,
                  padding: 4,
                  borderRadius: 18,
                  border: `2px solid ${
                    feedback === 'mark'
                      ? '#22c55e'
                      : feedback === 'unmark'
                      ? '#f59e0b'
                      : '#e5e7eb'
                  }`,
                  transition: 'border-color 120ms ease',
                }}
              >
                {tiles.map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => handleTileClick(tile)}
                    aria-label={`${tile.shape} ${tile.color}`}
                    style={{
                      aspectRatio: '1 / 1',
                      minHeight: 58,
                      borderRadius: 14,
                      border: tile.selected ? '3px solid #111827' : '1px solid #e5e7eb',
                      background: tile.selected ? '#eff6ff' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'all 120ms ease',
                      zIndex: 20,
                    }}
                  >
                    <img
                      src={SHAPE_IMAGE[tile.shape][tile.color]}
                      alt=""
                      aria-hidden="true"
                      style={{
                        width: '72%',
                        height: '72%',
                        objectFit: 'contain',
                      }}
                      onError={(event) => {
                        const img = event.currentTarget;
                        img.style.display = 'none';
                        const fallback = img.nextElementSibling as HTMLDivElement | null;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />

                    <div
                      aria-hidden="true"
                      style={{
                        display: 'none',
                        ...getShapeFallbackStyle(tile.shape, tile.color),
                      }}
                    />

                    {tile.selected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: '#111827',
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {(status === 'won' || status === 'lost') && (
        <Card>
          <div style={{ display: 'grid', gap: 14 }}>
            <h3 style={{ margin: 0, textAlign: 'center' }}>
              {status === 'won' ? 'Fase concluída' : 'Tempo encerrado'}
            </h3>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button onClick={goToNextRound}>
                {roundIndex >= MAX_PHASES ? 'Finalizar' : `Fase ${nextPhaseNumber}`}
              </Button>

              <Button onClick={() => navigate('/selective')}>
                Sair
              </Button>
            </div>
          </div>
        </Card>
      )}

      {status === 'finished' && (
        <Card>
          <div style={{ display: 'grid', gap: 12 }}>
            <h3 style={{ margin: 0 }}>Treino finalizado</h3>
            <p style={{ margin: 0 }}>
              Sessão encerrada e pronta para integração com o log e avaliação detalhada.
            </p>
            <Button onClick={() => navigate('/selective')}>
              Voltar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}