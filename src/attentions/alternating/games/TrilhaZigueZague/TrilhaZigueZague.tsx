// src/attentions/alternating/games/TrilhaZigueZague/TrilhaZigueZague.tsx

import React, { useState, useRef } from 'react';
import type { GamePhase, TrilhaNode, TrilhaZigueZagueSessionLog } from './types';
import { TrilhaZigueZagueInstructions } from './TrilhaZigueZagueInstructions';
import { TrilhaZigueZagueGame } from './TrilhaZigueZagueGame';

interface Props {
  sessionId: string;
  onComplete?: (log: TrilhaZigueZagueSessionLog) => void;
  onClose?: () => void;
}

// Layout fixo para padronização clínica
// X e Y em porcentagem (0-100)
const PHASE_1_NODES: TrilhaNode[] = [
  { id: '1', label: '1', x: 20, y: 30 },
  { id: '2', label: '2', x: 50, y: 15 },
  { id: '3', label: '3', x: 80, y: 30 },
  { id: '4', label: '4', x: 70, y: 60 },
  { id: '5', label: '5', x: 85, y: 80 },
  { id: '6', label: '6', x: 50, y: 85 },
  { id: '7', label: '7', x: 25, y: 75 },
  { id: '8', label: '8', x: 10, y: 55 },
  { id: '9', label: '9', x: 35, y: 50 },
  { id: '10', label: '10', x: 50, y: 35 },
  { id: '11', label: '11', x: 65, y: 50 },
  { id: '12', label: '12', x: 50, y: 65 },
];
const PHASE_1_SEQ = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const PHASE_2_NODES: TrilhaNode[] = [
  { id: '1', label: '1', x: 20, y: 15 },
  { id: 'A', label: 'A', x: 50, y: 15 },
  { id: '2', label: '2', x: 80, y: 25 },
  { id: 'B', label: 'B', x: 75, y: 55 },
  { id: '3', label: '3', x: 85, y: 85 },
  { id: 'C', label: 'C', x: 50, y: 80 },
  { id: '4', label: '4', x: 15, y: 85 },
  { id: 'D', label: 'D', x: 25, y: 55 },
  { id: '5', label: '5', x: 10, y: 35 },
  { id: 'E', label: 'E', x: 35, y: 45 },
  { id: '6', label: '6', x: 50, y: 35 },
  { id: 'F', label: 'F', x: 60, y: 45 },
];
const PHASE_2_SEQ = ['1', 'A', '2', 'B', '3', 'C', '4', 'D', '5', 'E', '6', 'F'];

export const TrilhaZigueZague: React.FC<Props> = ({ sessionId, onComplete, onClose }) => {
  const [phase, setPhase] = useState<GamePhase>('instructions');
  
  const startedAtRef = useRef(new Date().toISOString());
  const timePhase1Ref = useRef(0);
  const timePhase2Ref = useRef(0);
  const shiftingErrsRef = useRef(0);
  const sequencingErrsRef = useRef(0);

  const handlePhase1Complete = (timeMs: number, _shiftErr: number, seqErr: number) => {
    timePhase1Ref.current = timeMs / 1000;
    // seqErr in Phase1 goes to sequencingErrors, but we usually only care about Phase2 for shifting/sequencing.
    // We'll accumulate them anyway.
    sequencingErrsRef.current += seqErr;
    
    setPhase('intermission');
  };

  const handlePhase2Complete = (timeMs: number, shiftErr: number, seqErr: number) => {
    timePhase2Ref.current = timeMs / 1000;
    shiftingErrsRef.current += shiftErr;
    sequencingErrsRef.current += seqErr;
    
    setPhase('done');
    
    if (onComplete) {
      onComplete({
        sessionId,
        startedAt: startedAtRef.current,
        sessionData: {
          timePhase1: timePhase1Ref.current,
          timePhase2: timePhase2Ref.current,
          shiftingErrors: shiftingErrsRef.current,
          sequencingErrors: sequencingErrsRef.current
        }
      });
    }
  };

  if (phase === 'instructions') {
    return <TrilhaZigueZagueInstructions onStart={() => setPhase('phase1')} onClose={onClose} />;
  }

  if (phase === 'intermission') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 40, background: 'rgba(0,0,0,0.3)', borderRadius: 12 }}>
        <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 16 }}>Fase 1 Concluída!</h2>
        <p style={{ color: '#a3a8cc', fontSize: 16, marginBottom: 32 }}>
          Na próxima fase, você precisará conectar <strong>números e letras alternadamente</strong> em ordem alfabética e numérica.
          <br /><br />
          Ou seja: <strong>1, A, 2, B, 3, C...</strong>
        </p>
        <button
          onClick={() => setPhase('phase2')}
          style={{
            padding: '14px 48px', background: '#3b82f6', color: '#fff', fontSize: 16, fontWeight: 600,
            border: 'none', borderRadius: 8, cursor: 'pointer'
          }}
        >
          Iniciar Fase 2
        </button>
      </div>
    );
  }

  if (phase === 'phase1') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 16, color: '#a3a8cc' }}>
          <strong>Fase 1:</strong> Clique nos números em ordem (1, 2, 3...)
        </div>
        <TrilhaZigueZagueGame 
          nodes={PHASE_1_NODES} 
          expectedSequence={PHASE_1_SEQ} 
          isPhase2={false}
          onComplete={handlePhase1Complete} 
        />
      </div>
    );
  }

  if (phase === 'phase2') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 16, color: '#a3a8cc' }}>
          <strong>Fase 2:</strong> Alterne entre Números e Letras (1, A, 2, B...)
        </div>
        <TrilhaZigueZagueGame 
          nodes={PHASE_2_NODES} 
          expectedSequence={PHASE_2_SEQ} 
          isPhase2={true}
          onComplete={handlePhase2Complete} 
        />
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', color: '#fff', padding: 40 }}>
      Calculando resultados...
    </div>
  );
};

export default TrilhaZigueZague;
