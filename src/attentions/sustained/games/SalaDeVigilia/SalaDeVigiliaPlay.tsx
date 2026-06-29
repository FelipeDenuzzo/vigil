import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SalaDeVigiliaRawSession, LampadaEvent } from '../../../../assessment/salaDeVigilia/types';

interface Lampada {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  vx: number;
  vy: number;
}

interface SalaDeVigiliaPlayProps {
  onFinish: (session: SalaDeVigiliaRawSession) => void;
}

const SESSION_DURATION_MS = 180000; // 3 minutes
const RESPONSE_WINDOW_MS = 3000;

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
  const animationRef = useRef<number>();
  const lampsPhysicsRef = useRef<Lampada[]>([]);

  // Configuração inicial das lâmpadas e timer da sessão
  useEffect(() => {
    const initialLamps: Lampada[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `lamp-${i}`,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.1, // velocidade bem lenta
      vy: (Math.random() - 0.5) * 0.1,
    }));
    lampsPhysicsRef.current = initialLamps;
    setLampadas(initialLamps);
    sessionData.current.startedAt = Date.now();

    finishTimeoutRef.current = setTimeout(() => {
      endSession();
    }, SESSION_DURATION_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (windowTimeoutRef.current) clearTimeout(windowTimeoutRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loop de física
  useEffect(() => {
    const loop = () => {
      if (isFinished.current) return;
      const newLamps = lampsPhysicsRef.current.map(l => ({...l}));
      const radius = 4; // 4% de raio para cálculo de colisão e borda

      for (let i = 0; i < newLamps.length; i++) {
        let lamp = newLamps[i];
        lamp.x += lamp.vx;
        lamp.y += lamp.vy;

        // Bounce nas paredes
        if (lamp.x < radius) { lamp.x = radius; lamp.vx *= -1; }
        if (lamp.x > 100 - radius) { lamp.x = 100 - radius; lamp.vx *= -1; }
        if (lamp.y < radius) { lamp.y = radius; lamp.vy *= -1; }
        if (lamp.y > 100 - radius) { lamp.y = 100 - radius; lamp.vy *= -1; }
      }

      // Colisões entre lâmpadas
      for (let i = 0; i < newLamps.length; i++) {
        for (let j = i + 1; j < newLamps.length; j++) {
           const dx = newLamps[i].x - newLamps[j].x;
           const dy = newLamps[i].y - newLamps[j].y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           if (dist < radius * 2) {
              // Troca simples de velocidade
              const tempVx = newLamps[i].vx;
              const tempVy = newLamps[i].vy;
              newLamps[i].vx = newLamps[j].vx;
              newLamps[i].vy = newLamps[j].vy;
              newLamps[j].vx = tempVx;
              newLamps[j].vy = tempVy;

              // Afasta levemente para evitar grudar
              const overlap = (radius * 2) - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              newLamps[i].x += (nx * overlap) / 2;
              newLamps[i].y += (ny * overlap) / 2;
              newLamps[j].x -= (nx * overlap) / 2;
              newLamps[j].y -= (ny * overlap) / 2;
           }
        }
      }

      lampsPhysicsRef.current = newLamps;
      setLampadas(newLamps);
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const scheduleNextLamp = () => {
    if (isFinished.current || lampsPhysicsRef.current.length === 0) return;

    // Random delay between 8s and 20s
    const delay = 8000 + Math.random() * 12000; 

    timeoutRef.current = setTimeout(() => {
      if (isFinished.current) return;

      const randomLamp = lampsPhysicsRef.current[Math.floor(Math.random() * lampsPhysicsRef.current.length)];
      setActiveLampId(randomLamp.id);

      const newEvent: LampadaEvent = {
        id: uuidv4(),
        activatedAt: Date.now(),
        respondedAt: null,
        isFalseAlarm: false
      };
      activeEventRef.current = newEvent;
      sessionData.current.totalTargets += 1;

      // Window to respond
      windowTimeoutRef.current = setTimeout(() => {
        if (activeEventRef.current) {
          // Omission
          sessionData.current.events.push(activeEventRef.current);
          activeEventRef.current = null;
          setActiveLampId(null);
        }
        scheduleNextLamp();
      }, RESPONSE_WINDOW_MS);

    }, delay);
  };

  useEffect(() => {
    if (lampadas.length > 0 && !activeEventRef.current && !timeoutRef.current) {
      scheduleNextLamp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lampadas.length]);

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
              left: `${lamp.x}%`,
              top: `${lamp.y}%`,
              // Aumentamos a área de clique usando um padding interno invisível
              padding: '12px',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer'
            }}
          >
            {/* O visual da lâmpada */}
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#fbbf24' : '#374151',
              boxShadow: isActive ? '0 0 20px 10px rgba(251, 191, 36, 0.5)' : 'none',
              transition: 'background-color 0.1s, box-shadow 0.1s',
            }} />
          </div>
        );
      })}
    </div>
  );
};
