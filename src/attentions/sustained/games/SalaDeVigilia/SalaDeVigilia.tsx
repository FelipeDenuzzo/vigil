import React, { useState } from 'react';
import { SalaDeVigiliaInstructions } from './SalaDeVigiliaInstructions';
import { SalaDeVigiliaSimulation } from './SalaDeVigiliaSimulation';
import { SalaDeVigiliaPlay } from './SalaDeVigiliaPlay';
import { EvaluationReportPanel } from './EvaluationReportPanel';
import { SalaDeVigiliaRawSession } from '../../../../assessment/salaDeVigilia/types';
import { useSalaDeVigiliaEvaluation } from './useSalaDeVigiliaEvaluation';

interface SalaDeVigiliaProps {
  onClose: () => void;
  onRepeat: () => void;
}

type Phase = 'instructions' | 'simulation' | 'play' | 'evaluation';

export const SalaDeVigilia: React.FC<SalaDeVigiliaProps> = ({ onClose, onRepeat }) => {
  const [phase, setPhase] = useState<Phase>('instructions');
  const [rawSession, setRawSession] = useState<SalaDeVigiliaRawSession | null>(null);

  const { evaluate, report, isEvaluating, error } = useSalaDeVigiliaEvaluation();

  const handleFinishPlay = async (session: SalaDeVigiliaRawSession) => {
    setRawSession(session);
    setPhase('evaluation');
    await evaluate(session);
  };

  const handleRepeat = () => {
    setPhase('instructions');
    setRawSession(null);
    onRepeat();
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0f0f1a', color: 'white', display: 'flex', flexDirection: 'column' }}>
      {phase === 'instructions' && (
        <SalaDeVigiliaInstructions
          onNext={() => setPhase('simulation')}
          onClose={onClose}
        />
      )}

      {phase === 'simulation' && (
        <SalaDeVigiliaSimulation
          onNext={() => setPhase('play')}
          onClose={onClose}
        />
      )}

      {phase === 'play' && (
        <SalaDeVigiliaPlay
          onFinish={handleFinishPlay}
        />
      )}

      {phase === 'evaluation' && (
        <EvaluationReportPanel
          report={report}
          isEvaluating={isEvaluating}
          error={error}
          onClose={onClose}
          onRepeat={handleRepeat}
        />
      )}
    </div>
  );
};
