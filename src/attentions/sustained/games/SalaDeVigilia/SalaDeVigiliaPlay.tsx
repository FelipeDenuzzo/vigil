import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SalaDeVigiliaRawSession, LampadaEvent } from '../../../assessment/salaDeVigilia/types';

interface Lampada {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

interface SalaDeVigiliaPlayProps {
  onFinish: (session: SalaDeVigiliaRawSession) => void;
}

const SESSION_DURATION_MS = 180000; // 3 minutes
const RESPONSE_WINDOW_MS = 1200;

export const SalaDeVigiliaPlay: React.FC<SalaDeVigiliaPlayProps> = ({ onFinish }) => {
  const [lampadas, setLampadas] = useState<Lampada[]>([]);
  const [activeLampId, setActiveLampId] = useState<string | null>(null);
  
  const sessionData = useRef({
    sessionId: uuidv4(),
    startedAt: Date.now(),
    events: [] as LampadaEvent[],
    falseAlarms: [] as number[],
    totalTargets: 0,
  });

  const activeEventRef = useRef<LampadaEvent | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const windowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFinished = useRef(false);

  useEffect(() => {
    const initialLamps: Lampada[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `lamp-${i}`,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
    }));
    setLampadas(initialLamps);
    sessionData.current.startedAt = Date.now();

    finishTimeoutRef.current = setTimeout(() => {
      endSession();
    }, SESSION_DURATION_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (windowTimeoutRef.current) clearTimeout(windowTimeoutRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleNextLamp = () => {
    if (isFinished.current || lampadas.length === 0) return;

    // Random delay between 8s and 20s
    const delay = 8000 + Math.random() * 12000; 

    timeoutRef.current = setTimeout(() => {
      if (isFinished.current) return;

      const randomLamp = lampadas[Math.floor(Math.random() * lampadas.length)];
      setActiveLampId(randomLamp.id);

      const newEvent: LampadaEvent = {
        id: uuidv4(),
        activatedAt: Date.now(),
        respondedAt: null,
        isFalseAlarm: false
      };
      activeEventRef.current = newEvent;
      sessionData.current.totalTargets += 1;

      // Visual flash lasts 250ms
      setTimeout(() => {
        setActiveLampId(null);
      }, 250);

      // Window to respond
      windowTimeoutRef.current = setTimeout(() => {
        if (activeEventRef.current) {
          // Omission
          sessionData.current.events.push(activeEventRef.current);
          activeEventRef.current = null;
        }
        scheduleNextLamp();
      }, RESPONSE_WINDOW_MS);

    }, delay);
  };

  useEffect(() => {
    if (lampadas.length > 0) {
      scheduleNextLamp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lampadas]);

  const endSession = () => {
    if (isFinished.current) return;
    isFinished.current = true;
    
    if (activeEventRef.current) {
      sessionData.current.events.push(activeEventRef.current);
      activeEventRef.current = null;
    }

    const rawSession: SalaDeVigiliaRawSession = {
      sessionId: sessionData.current.sessionId,
      startedAt: sessionData.current.startedAt,
      endedAt: Date.now(),
      durationMs: SESSION_DURATION_MS,
      events: sessionData.current.events,
      falseAlarms: sessionData.current.falseAlarms,
      totalTargets: sessionData.current.totalTargets,
      responseWindowMs: RESPONSE_WINDOW_MS,
    };

    onFinish(rawSession);
  };

  const handleContainerClick = () => {
    if (isFinished.current) return;
    
    if (!activeEventRef.current) {
      sessionData.current.falseAlarms.push(Date.now());
    }
  };

  const handleLampClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isFinished.current) return;

    if (activeEventRef.current && activeLampId === id) {
      // Hit!
      activeEventRef.current.respondedAt = Date.now();
      sessionData.current.events.push(activeEventRef.current);
      activeEventRef.current = null;
      setActiveLampId(null);
      
      // Stop omission window timeout
      if (windowTimeoutRef.current) clearTimeout(windowTimeoutRef.current);
      
      // Schedule next immediately
      scheduleNextLamp();
    } else {
      // False alarm clicking a wrong/inactive lamp or outside active window
      sessionData.current.falseAlarms.push(Date.now());
    }
  };

  return (
    <div 
      style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
      onClick={handleContainerClick}
    >
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', textAlign: 'right', zIndex: 10, color: 'white', opacity: 0.5 }}>
        TREINO ATIVO
      </div>

      {lampadas.map((lamp) => {
        const isActive = lamp.id === activeLampId;
        return (
          <div
            key={lamp.id}
            onClick={(e) => handleLampClick(e, lamp.id)}
            style={{
              position: 'absolute',
              left: \`\${lamp.x}%\`,
              top: \`\${lamp.y}%\`,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#fbbf24' : '#374151',
              boxShadow: isActive ? '0 0 20px 10px rgba(251, 191, 36, 0.5)' : 'none',
              transform: 'translate(-50%, -50%)',
              transition: 'background-color 0.1s, box-shadow 0.1s',
              cursor: 'pointer'
            }}
          />
        );
      })}
    </div>
  );
};
