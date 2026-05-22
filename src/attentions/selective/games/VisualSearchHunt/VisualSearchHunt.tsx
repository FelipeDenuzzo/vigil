import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../shared/components/Button';
import { Card } from '../../../../shared/components/Card';
import type { GameResult } from '../../../../shared/types';

type Shape = 'circle' | 'square' | 'triangle';
type Color = 'red' | 'blue' | 'green' | 'yellow';

type RoundStatus = 'instruction' | 'playing' | 'won' | 'lost' | 'finished';

type Tile = {
  id: string;
  shape: Shape;
  color: Color;
  isTarget: boolean;
  found: boolean;
};

type ClickAction = 'mark' | 'unmark';

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
  targetsRemainingBeforeClick: number;
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

function getShapeStyle(shape: Shape, color: Color): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '70%',
    height: '70%',
    backgroundColor: COLOR_HEX[color],
  };

  if (shape === 'circle') {
    return { ...base, borderRadius: '999px' };
  }

  if (shape === 'square') {
    return { ...base, borderRadius: 8 };
  }

  return {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeft: '22px solid transparent',
    borderRight: '22px solid transparent',
    borderBottom: `40px solid ${COLOR_HEX[color]}`,
  };
}

function getLevelConfig(level: number) {
  if (level <= 2) {
    return {
      gridSize: 4,
      minTargets: 3,
      maxTargets: 5,
      timeSeconds: 28,
      errorPenaltySeconds: 0.5,
      distractorMode: 'popout' as const,
    };
  }

  if (level <= 4) {
    return {
      gridSize: 5,
      minTargets: 4,
      maxTargets: 6,
      timeSeconds: 24,
      errorPenaltySeconds: 1,
      distractorMode: 'mixed' as const,
    };
  }

  if (level <= 6) {
    return {
      gridSize: 6,
      minTargets: 5,
      maxTargets: 8,
      timeSeconds: 20,
      errorPenaltySeconds: 1,
      distractorMode: 'conjunction' as const,
    };
  }

  return {
    gridSize: 7,
    minTargets: 6,
    maxTargets: 9,
    timeSeconds: 16,
    errorPenaltySeconds: 1.5,
    distractorMode: 'hard-conjunction' as const,
  };
}

function buildTiles(targetShape: Shape, targetColor: Color, level: number) {
  const config = getLevelConfig(level);
  const totalCells = config.gridSize * config.gridSize;
  const totalTargets =
    Math.floor(Math.random() * (config.maxTargets - config.minTargets + 1)) + config.minTargets;

  const targets: Tile[] = Array.from({ length: totalTargets }, (_, index) => ({
    id: `target-${index}`,
    shape: targetShape,
    color: targetColor,
    isTarget: true,
    found: false,
  }));

  const otherShapes = SHAPES.filter((s) => s !== targetShape);
  const otherColors = COLORS.filter((c) => c !== targetColor);

  const distractors: Tile[] = [];

  for (let i = 0; i < totalCells - totalTargets; i += 1) {
    let shape: Shape = randomItem(SHAPES);
    let color: Color = randomItem(COLORS);

    if (config.distractorMode === 'popout') {
      const emphasizeSingleFeature = Math.random() > 0.5;
      shape = emphasizeSingleFeature ? randomItem(otherShapes) : randomItem(SHAPES);
      color = emphasizeSingleFeature ? randomItem(COLORS) : randomItem(otherColors);
    }

    if (config.distractorMode === 'mixed') {
      const variant = i % 3;
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

    if (config.distractorMode === 'conjunction' || config.distractorMode === 'hard-conjunction') {
      const variant = i % 4;
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
      id: `distractor-${i}`,
      shape,
      color,
      isTarget: false,
      found: false,
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
  const [hits, setHits] = useState(0);
  const [errors, setErrors] = useState(0);
  const [targetsRemaining, setTargetsRemaining] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);

  const roundStartRef = useRef<number>(0);
  const clickLogRef = useRef<ClickEventLog[]>([]);
  const timerRef = useRef<number | null>(null);

  const config = useMemo(() => getLevelConfig(level), [level]);

  const clearRoundTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const generateRound = useCallback(() => {
    const nextShape = randomItem(SHAPES);
    const nextColor = randomItem(COLORS);
    const generated = buildTiles(nextShape, nextColor, level);

    setTargetShape(nextShape);
    setTargetColor(nextColor);
    setTiles(generated.tiles);
    setHits(0);
    setErrors(0);
    setTargetsRemaining(generated.totalTargets);
    setRemainingTime(generated.config.timeSeconds);
    clickLogRef.current = [];
    roundStartRef.current = 0;
  }, [level]);

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  const finishRound = useCallback(
    (resultStatus: 'won' | 'lost') => {
      clearRoundTimer();

      const endedAt = Date.now();
      const startedAt = roundStartRef.current || endedAt;
      const missedTargets = tiles.filter((tile) => tile.isTarget && !tile.found).length;

      const result: RoundResult = {
        roundIndex,
        level,
        targetShape,
        targetColor,
        status: resultStatus,
        hits,
        errors,
        missedTargets,
        totalTargets: hits + missedTargets,
        gridSize: config.gridSize,
        durationMs: endedAt - startedAt,
        timeLimitSeconds: config.timeSeconds,
        remainingTimeSeconds: Number(remainingTime.toFixed(1)),
        startedAt,
        endedAt,
        clickEvents: [...clickLogRef.current],
      };

      setRoundResults((prev) => [...prev, result]);
      setStatus(resultStatus);
    },
    [
      clearRoundTimer,
      tiles,
      roundIndex,
      level,
      targetShape,
      targetColor,
      hits,
      errors,
      config.gridSize,
      config.timeSeconds,
      remainingTime,
    ],
  );

  const startRound = useCallback(() => {
    setStatus('playing');
    roundStartRef.current = Date.now();

    clearRoundTimer();
    timerRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        const next = Number((prev - 0.1).toFixed(1));
        if (next <= 0) {
          finishRound('lost');
          return 0;
        }
        return next;
      });
    }, 100);
  }, [clearRoundTimer, finishRound]);

  const showFeedback = useCallback((type: 'success' | 'error') => {
    setFeedback(type);
    window.setTimeout(() => setFeedback(null), 160);
  }, []);

  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (status !== 'playing' || tile.found) return;

      const clickEvent: ClickEventLog = {
        timestampMs: Date.now(),
        roundIndex,
        phaseLevel: level,
        action: 'mark',
        tileId: tile.id,
        isTarget: tile.isTarget,
        clickedShape: tile.shape,
        clickedColor: tile.color,
        targetShape,
        targetColor,
        targetsRemainingBeforeClick: targetsRemaining,
      };

      clickLogRef.current.push(clickEvent);

      if (tile.isTarget) {
        onCorrectSound?.();
        showFeedback('success');

        setTiles((prev) =>
          prev.map((item) => (item.id === tile.id ? { ...item, found: true } : item)),
        );

        setHits((prev) => prev + 1);
        setTargetsRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            window.setTimeout(() => finishRound('won'), 150);
            return 0;
          }
          return next;
        });

        return;
      }

      onErrorSound?.();
      showFeedback('error');
      setErrors((prev) => prev + 1);
      setRemainingTime((prev) => Math.max(0, Number((prev - config.errorPenaltySeconds).toFixed(1))));
    },
    [
      status,
      roundIndex,
      level,
      targetShape,
      targetColor,
      targetsRemaining,
      onCorrectSound,
      onErrorSound,
      showFeedback,
      finishRound,
      config.errorPenaltySeconds,
    ],
  );

  const nextRound = useCallback(() => {
    const nextLevel = Math.min(level + 1, 8);
    setLevel(nextLevel);
    setRoundIndex((prev) => prev + 1);
    setStatus('instruction');
  }, [level]);

  useEffect(() => {
    if (status === 'instruction') {
      generateRound();
    }
  }, [status, generateRound]);

  const finishSession = useCallback(() => {
    const totalHits = roundResults.reduce((sum, round) => sum + round.hits, 0);
    const totalErrors = roundResults.reduce((sum, round) => sum + round.errors, 0);
    const roundsWon = roundResults.filter((round) => round.status === 'won').length;
    const roundsLost = roundResults.filter((round) => round.status === 'lost').length;
    const totalActions = totalHits + totalErrors;

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

      accuracy: totalActions > 0 ? Number(((totalHits / totalActions) * 100).toFixed(2)) : 0,
    };

    onEnd?.(gameResult);
    setStatus('finished');
  }, [onEnd, roundResults]);

  useEffect(() => {
    return () => clearRoundTimer();
  }, [clearRoundTimer]);

  const gridTemplateColumns = `repeat(${config.gridSize}, minmax(0, 1fr))`;

  const instructionText = `Encontre todos os ${SHAPE_LABEL[targetShape]} ${COLOR_LABEL[targetColor]}.`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      {status === 'instruction' && (
        <Card>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>Caça ao Alvo</h2>
              <p style={{ marginTop: 8 }}>
                {instructionText}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 120,
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                background: '#fff',
              }}
            >
              <div style={getShapeStyle(targetShape, targetColor)} />
            </div>

            <div>
              <p style={{ margin: 0 }}>
                Clique apenas nos alvos corretos e ignore as figuras parecidas.
              </p>
              <p style={{ marginTop: 8 }}>
                Nível {level} · Grade {config.gridSize}x{config.gridSize} · Tempo {config.timeSeconds}s
              </p>
            </div>

            <Button onClick={startRound}>Começar</Button>
          </div>
        </Card>
      )}

      {status === 'playing' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <Card>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>Alvo:</strong> {SHAPE_LABEL[targetShape]} {COLOR_LABEL[targetColor]}
                </div>
                <div>
                  <strong>Tempo:</strong> {remainingTime.toFixed(1)}s
                </div>
              </div>

              <div>
                <strong>Acertos:</strong> {hits} · <strong>Erros:</strong> {errors} · <strong>Faltando:</strong> {targetsRemaining}
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
                    width: `${(remainingTime / config.timeSeconds) * 100}%`,
                    background: feedback === 'error' ? '#ef4444' : '#111827',
                    transition: 'width 120ms linear, background-color 120ms linear',
                  }}
                />
              </div>
            </div>
          </Card>

          <Card>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns,
                gap: 8,
                padding: 4,
                borderRadius: 16,
                border: `2px solid ${
                  feedback === 'success' ? '#22c55e' : feedback === 'error' ? '#ef4444' : '#e5e7eb'
                }`,
                transition: 'border-color 120ms ease',
              }}
            >
              {tiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTileClick(tile)}
                  disabled={tile.found}
                  aria-label={`${tile.shape} ${tile.color}`}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    background: tile.found ? '#d1d5db' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 56,
                  }}
                >
                  <div style={getShapeStyle(tile.shape, tile.color)} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {(status === 'won' || status === 'lost') && (
        <Card>
          <div style={{ display: 'grid', gap: 12 }}>
            <h3 style={{ margin: 0 }}>
              {status === 'won' ? 'Rodada concluída' : 'Tempo esgotado'}
            </h3>

            <p style={{ margin: 0 }}>
              Acertos: {hits} · Erros: {errors}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {roundResults.length >= 5 ? (
                <Button onClick={finishSession}>Encerrar treino</Button>
              ) : (
                <Button onClick={nextRound}>Próxima fase</Button>
              )}

              <Button
                onClick={() => navigate('/selective')}
                variant="secondary"
              >
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
              Sessão encerrada e pronta para integração com o histórico e validação.
            </p>
            <Button onClick={() => navigate('/selective')}>Voltar</Button>
          </div>
        </Card>
      )}
    </div>
  );
}