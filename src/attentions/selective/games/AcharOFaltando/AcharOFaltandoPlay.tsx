// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoPlay.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRound, buildRoundResult } from './logic';
import type {
  MissingItemConfig,
  MissingItemRound,
  MissingItemRoundResult,
} from './types';
import { saveSession } from '../../../../shared/storage';
import { auth } from '../../../../lib/firebase';
import AcharOFaltandoSimulation from './AcharOFaltandoSimulation';

const DEFAULT_CONFIG: MissingItemConfig = {
  presentationMode: 'side-by-side',
  layoutMode: 'grid',
  gridSize: 8,
  itemType: 'symbols',
  differenceMode: 'mixed',
  differenceCount: 1,
  durationSec: 180,
  roundLimit: 10,
  seed: '',
  responseMode: 'click-difference',
  highContrast: false,
};

function formatSec(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const isSymbol = (item: string) => /^\d+$/.test(item) && Number(item) >= 18 && Number(item) <= 45;

type Phase = 'instructions' | 'simulation' | 'playing' | 'feedback' | 'finished';

export default function AcharOFaltandoPlay() {
  const navigate = useNavigate();
  const config = DEFAULT_CONFIG;

  const [phase, setPhase] = useState<Phase>('instructions');
  const [currentRound, setCurrentRound] = useState<MissingItemRound | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [results, setResults] = useState<MissingItemRoundResult[]>([]);
  const [markedCells, setMarkedCells] = useState<Array<{ board: 'A' | 'B'; index: number }>>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [remainingSec, setRemainingSec] = useState(config.durationSec);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [feedbackResult, setFeedbackResult] = useState<MissingItemRoundResult | null>(null);
  const [visibleBoard, setVisibleBoard] = useState<'A' | 'B'>('A');

  const roundStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startRound(rNum: number) {
    const round = generateRound(config, rNum);
    setCurrentRound(round);
    setMarkedCells([]);
    setSelectedItems([]);
    roundStartRef.current = Date.now();
    if (config.presentationMode === 'alternating') setVisibleBoard('A');
  }

  function startGame() {
    setRoundNumber(1);
    setResults([]);
    setElapsedSec(0);
    setRemainingSec(config.durationSec);
    startRound(1);
    setPhase('playing');
  }

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setRemainingSec(prev => {
        if (prev <= 1) { finishGame(); return 0; }
        return prev - 1;
      });
      setElapsedSec(prev => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' || config.presentationMode !== 'alternating') return;
    const interval = setInterval(() => {
      setVisibleBoard(b => b === 'A' ? 'B' : 'A');
    }, 1500);
    return () => clearInterval(interval);
  }, [phase, config.presentationMode]);

  function handleCellClick(board: 'A' | 'B', index: number) {
    if (phase !== 'playing' || config.responseMode !== 'click-difference') return;
    setMarkedCells(prev => {
      const key = `${board}:${index}`;
      const exists = prev.some(c => `${c.board}:${c.index}` === key);
      return exists ? prev.filter(c => `${c.board}:${c.index}` !== key) : [...prev, { board, index }];
    });
  }

  function handleSelectItem(item: string) {
    if (phase !== 'playing' || config.responseMode !== 'select-item') return;
    setSelectedItems(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item],
    );
  }

  function submitRound() {
    if (!currentRound) return;
    const responseTimeMs = Date.now() - roundStartRef.current;
    const result = buildRoundResult({
      config,
      round: currentRound,
      response: { markedIndexes: [], markedCells, selectedItems, responseTimeMs },
    });
    const updated = [...results, result];
    setResults(updated);
    setFeedbackResult(result);
    setPhase('feedback');
    setTimeout(() => {
      if (roundNumber >= config.roundLimit || remainingSec <= 0) {
        finishGame(updated);
      } else {
        const next = roundNumber + 1;
        setRoundNumber(next);
        startRound(next);
        setPhase('playing');
      }
    }, 1500);
  }

  function finishGame(finalResults?: MissingItemRoundResult[]) {
    if (timerRef.current) clearInterval(timerRef.current);
    const res = finalResults ?? results;
    
    const uid = auth.currentUser?.uid ?? 'anonymous';
    const sessionId = `achar-o-faltando-${Date.now()}`;
    saveSession(
      {
        sessionId,
        gameId: 'achar-o-faltando',
        attentionType: 'seletiva',
        sessionStatus: 'completed',
        schemaVersion: 1,
        uid,
        startedAt: Date.now() - elapsedSec * 1000,
        completedAt: Date.now(),
        rounds: res.map(r => ({
          roundNumber: r.roundNumber,
          hits: r.hits,
          omissions: r.omissions,
          falsePositives: r.falsePositives,
          responseTimeMs: r.responseTimeMs,
          correct: r.correct,
          gridSize: r.gridSize,
          itemType: r.itemType,
          differenceMode: r.differenceMode,
          targetItems: r.targetItems,
          differencePositions: r.differencePositions,
          response: r.response,
        })),
      },
      uid
    );

    setPhase('finished');
    navigate(`/treinar/seletiva/achar-o-faltando/resultado?sessionId=${sessionId}`);
  }

  if (phase === 'instructions') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        <button
          onClick={() => navigate('/treinar/seletiva')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: 14,
            marginBottom: 'var(--space-8)',
            padding: 0,
            display: 'block',
          }}
        >
          ← Voltar
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>🔎 Achar o Faltando</h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
            Compare as duas grades que aparecem na tela. Elas são quase iguais, mas existe uma
            diferença: um item <strong>faltando</strong> ou um item <strong>a mais</strong>.
            Encontre e marque essa diferença clicando na célula ou selecionando o item.
          </p>
          <button
            onClick={() => setPhase('simulation')}
            style={{
              padding: '12px 32px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Começar
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'simulation') {
    return <AcharOFaltandoSimulation onDone={startGame} />;
  }

  if ((phase === 'playing' || phase === 'feedback') && currentRound) {
    const isSideBySide = config.presentationMode === 'side-by-side';
    const isAlternating = config.presentationMode === 'alternating';
    const cols = currentRound.columns;

    const renderGrid = (items: string[], board: 'A' | 'B', label: string) => (
      <div>
        <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: 8, fontSize: 'var(--text-sm)' }}>{label}</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 2,
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 4,
            background: '#ffffff',
          }}
        >
          {items.map((item, idx) => {
            const isMarked = markedCells.some(c => c.board === board && c.index === idx);
            const isDiff = phase === 'feedback' && currentRound.differences.some(d => d.index === idx);
            return (
              <div
                key={idx}
                onClick={() => handleCellClick(board, idx)}
                style={{
                  width: cols >= 10 ? 28 : 36,
                  height: cols >= 10 ? 28 : 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: cols >= 10 ? 11 : 14,
                  fontFamily: 'monospace',
                  background: isMarked
                    ? 'var(--color-primary)'
                    : isDiff
                    ? 'rgba(255,100,100,0.2)'
                    : '#ffffff',
                  border: isMarked || isDiff ? '2px solid black' : '1px solid var(--color-border)',
                  borderRadius: 4,
                  cursor: config.responseMode === 'click-difference' ? 'pointer' : 'default',
                  color: isMarked ? 'white' : 'var(--color-text)',
                  userSelect: 'none',
                }}
              >
                {item && (
                  isSymbol(item) ? (
                    <img
                      src={`/simbolos/${item}.png`}
                      alt=""
                      style={{
                        width: '75%',
                        height: '75%',
                        objectFit: 'contain',
                        filter: isMarked ? 'brightness(0) invert(1)' : 'none',
                      }}
                    />
                  ) : (
                    item
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '16px 16px 80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={() => navigate('/treinar/seletiva')}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14 }}
          >
            ← Voltar
          </button>
          <div style={{ display: 'flex', gap: 24, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            <span>Rodada {roundNumber}/{config.roundLimit}</span>
            <span>⏱ {formatSec(remainingSec)}</span>
            {isAlternating && <span>Exibindo: Grade {visibleBoard}</span>}
          </div>
        </div>

        {isSideBySide && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            {renderGrid(currentRound.itemsA, 'A', 'Grade A')}
            {renderGrid(currentRound.itemsB, 'B', 'Grade B')}
          </div>
        )}
        {isAlternating && (
          <div style={{ marginBottom: 16 }}>
            {visibleBoard === 'A'
              ? renderGrid(currentRound.itemsA, 'A', 'Grade A')
              : renderGrid(currentRound.itemsB, 'B', 'Grade B')}
          </div>
        )}

        {config.responseMode === 'select-item' && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 'var(--text-sm)', marginBottom: 8 }}>Qual item está faltando ou a mais?</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentRound.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelectItem(opt)}
                  style={{
                    padding: '8px 16px',
                    background: selectedItems.includes(opt) ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color: selectedItems.includes(opt) ? 'white' : 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: 18,
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 48,
                    height: 48,
                  }}
                >
                  {isSymbol(opt) ? (
                    <img
                      src={`/simbolos/${opt}.png`}
                      alt=""
                      style={{
                        width: 24,
                        height: 24,
                        objectFit: 'contain',
                        filter: selectedItems.includes(opt) ? 'brightness(0) invert(1)' : 'none',
                      }}
                    />
                  ) : (
                    opt
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'feedback' && feedbackResult && (
          <div style={{
            textAlign: 'center', padding: 12, borderRadius: 'var(--radius-md)',
            background: feedbackResult.correct ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${feedbackResult.correct ? '#22c55e' : '#ef4444'}`,
            marginBottom: 16,
          }}>
            Rodada {feedbackResult.roundNumber}: <strong>{feedbackResult.correct ? '✅ Correto' : '❌ Incorreto'}</strong>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              onClick={submitRound}
              style={{
                padding: '12px 40px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Confirmar resposta
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
