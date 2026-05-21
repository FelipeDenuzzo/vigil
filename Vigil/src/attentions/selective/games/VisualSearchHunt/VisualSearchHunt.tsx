import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../../../../shared/types";
import type { SessionLog, RoundLog, GameResult } from "../../../../shared/types";
import { saveSession, saveResult } from "../../../../shared/storage";

const TOTAL_ROUNDS = 10;
const GAME_ID = "visual-search-hunt";

function createSessionId() {
  return `vsh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function VisualSearchHunt({ onEnd }: GameProps) {
  const [gameState, setGameState] = useState<"preview" | "playing" | "won" | "lost" | "completed">("preview");
  const [roundIndex, setRoundIndex] = useState(0);
  const [level, setLevel] = useState(1);

  const sessionIdRef = useRef<string>(createSessionId());
  const sessionRef = useRef<SessionLog>({
    sessionId: sessionIdRef.current,
    gameId: GAME_ID,
    attentionType: "selective",

    startedAt: Date.now(),
    completedAt: null,

    sessionStatus: "in_progress",

    started: false,
    abandoned: false,
    completed: false,

    totalRoundsPlanned: TOTAL_ROUNDS,
    completedRounds: 0,
    startedRounds: 0,

    lastRoundIndexReached: 0,
    lastLevelReached: 1,

    rounds: [],
  });

  const roundStartedAtRef = useRef<number | null>(null);
  const sessionFinishedRef = useRef(false);

  useEffect(() => {
    // Persist initial session record as soon as component mounts
    saveSession(sessionRef.current);
  }, []);

  function updateSession(partial: Partial<SessionLog>) {
    sessionRef.current = {
      ...sessionRef.current,
      ...partial,
    };
    saveSession(sessionRef.current);
  }

  function startRound() {
    const now = Date.now();
    roundStartedAtRef.current = now;

    const currentRound: RoundLog = {
      roundIndex,
      level,
      startedAt: now,
      completed: false,
      clicks: [],
      reactionTimes: [],
    } as RoundLog;

    const nextRounds = [...sessionRef.current.rounds];
    nextRounds[roundIndex] = currentRound;

    updateSession({
      started: true,
      startedRounds: Math.max(sessionRef.current.startedRounds, roundIndex + 1),
      lastRoundIndexReached: roundIndex + 1,
      lastLevelReached: level,
      rounds: nextRounds,
    });

    setGameState("playing");
  }

  function registerClick(action: "mark" | "unmark", isTarget: boolean) {
    const round = sessionRef.current.rounds[roundIndex];
    if (!round) return;

    round.clicks.push({
      timestamp: Date.now(),
      action,
      isTarget,
    });

    saveSession(sessionRef.current);
  }

  function finishRound(params: { accuracy: number; nextLevel: number; won: boolean }) {
    const now = Date.now();
    const round = sessionRef.current.rounds[roundIndex];
    if (!round) return;

    round.endedAt = now;
    round.completed = true;
    round.accuracy = params.accuracy;

    const completedRounds = sessionRef.current.completedRounds + 1;
    const nextRoundIndex = roundIndex + 1;

    updateSession({
      completedRounds,
      lastRoundIndexReached: Math.max(sessionRef.current.lastRoundIndexReached, nextRoundIndex),
      lastLevelReached: params.nextLevel,
      rounds: [...sessionRef.current.rounds],
    });

    if (nextRoundIndex >= TOTAL_ROUNDS) {
      sessionFinishedRef.current = true;

      updateSession({
        completedAt: now,
        sessionStatus: "completed",
        completed: true,
        abandoned: false,
        lastRoundIndexReached: TOTAL_ROUNDS,
      });

      setGameState("completed");

      const result: GameResult = {
        sessionId: sessionRef.current.sessionId,
        gameId: sessionRef.current.gameId,
        attentionType: sessionRef.current.attentionType,

        startedAt: sessionRef.current.startedAt,
        completedAt: now,

        sessionStatus: "completed",
        abandoned: false,
        completed: true,

        totalRoundsPlanned: TOTAL_ROUNDS,
        completedRounds,
        startedRounds: sessionRef.current.startedRounds,
        lastRoundIndexReached: TOTAL_ROUNDS,
        lastLevelReached: params.nextLevel,
      } as GameResult;

      saveResult(result);
      // Notify parent that session ended with final result
      try { onEnd(result); } catch (e) { console.warn('onEnd handler threw', e); }
      return;
    }

    setRoundIndex(nextRoundIndex);
    setLevel(params.nextLevel);
    setGameState(params.won ? "won" : "lost");
  }

  function finalizeAndExit() {
    // Ensure final session/result saved and propagate full result to parent
    const now = Date.now();
    const s = sessionRef.current;

    // If not already finalized, mark completedAt if applicable
    const finalSession: SessionLog = {
      ...s,
      completedAt: s.completedAt ?? now,
    } as SessionLog;
    sessionRef.current = finalSession;
    saveSession(finalSession);

    const result: GameResult = {
      sessionId: finalSession.sessionId,
      gameId: finalSession.gameId,
      attentionType: finalSession.attentionType,

      startedAt: finalSession.startedAt,
      completedAt: finalSession.completedAt,

      sessionStatus: finalSession.sessionStatus,
      abandoned: !!finalSession.abandoned,
      completed: !!finalSession.completed,

      totalRoundsPlanned: finalSession.totalRoundsPlanned,
      completedRounds: finalSession.completedRounds,
      startedRounds: finalSession.startedRounds,
      lastRoundIndexReached: finalSession.lastRoundIndexReached,
      lastLevelReached: finalSession.lastLevelReached,
    } as GameResult;

    saveResult(result);

    try { onEnd(result); } catch (e) { console.warn('onEnd handler threw', e); }
  }

  useEffect(() => {
    return () => {
      if (sessionFinishedRef.current) return;

      const s = sessionRef.current;

      if (!s.started) return;

      if (s.completed) return;

      const abandonedSession: SessionLog = {
        ...s,
        completedAt: Date.now(),
        sessionStatus: "abandoned",
        abandoned: true,
        completed: false,
      } as SessionLog;

      sessionRef.current = abandonedSession;
      saveSession(abandonedSession);

      const result: GameResult = {
        sessionId: abandonedSession.sessionId,
        gameId: abandonedSession.gameId,
        attentionType: abandonedSession.attentionType,

        startedAt: abandonedSession.startedAt,
        completedAt: abandonedSession.completedAt,

        sessionStatus: "abandoned",
        abandoned: true,
        completed: false,

        totalRoundsPlanned: abandonedSession.totalRoundsPlanned,
        completedRounds: abandonedSession.completedRounds,
        startedRounds: abandonedSession.startedRounds,
        lastRoundIndexReached: abandonedSession.lastRoundIndexReached,
        lastLevelReached: abandonedSession.lastLevelReached,
      } as GameResult;

      saveResult(result);
      try { onEnd(result); } catch (e) { console.warn('onEnd handler threw', e); }
    };
  }, []);

  return (
    <>
      {gameState === "preview" && (
        <button onClick={startRound}>COMEÇAR FASE</button>
      )}

      {gameState === "playing" && (
        <div>
          {/* seu jogo */}
          <button onClick={() => registerClick("mark", true)}>Marcar alvo</button>
          <button
            onClick={() =>
              finishRound({
                accuracy: 0.9,
                nextLevel: Math.min(level + 1, 10),
                won: true,
              })
            }
          >
            Finalizar fase
          </button>
        </div>
      )}

      {gameState === "won" || gameState === "lost" ? (
        <button onClick={startRound}>COMEÇAR FASE</button>
      ) : null}

      {gameState === "completed" && (
        <button onClick={finalizeAndExit}>Ver resultado / sair</button>
      )}
    </>
  );
}