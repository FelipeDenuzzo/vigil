import React, { useState, useEffect, useRef } from 'react';

interface Lampada {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  vx: number;
  vy: number;
}

interface SalaDeVigiliaSimulationProps {
  onNext: () => void;
  onClose: () => void;
}

export const SalaDeVigiliaSimulation: React.FC<SalaDeVigiliaSimulationProps> = ({ onNext, onClose }) => {
  const [lampadas, setLampadas] = useState<Lampada[]>([]);
  const [activeLampId, setActiveLampId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'acerto' | 'erro' | 'omisso' | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [simulationFinished, setSimulationFinished] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const animationRef = useRef<number>();
  const lampsPhysicsRef = useRef<Lampada[]>([]);

  // Start or restart simulation
  const startSimulation = () => {
    setSimulationFinished(false);
    setTimeLeft(30);
    setActiveLampId(null);
    setFeedback(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    // Initial Physics Setup
    const initialLamps: Lampada[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `lamp-${i}`,
      x: 10 + Math.random() * 80, // keep away from edges
      y: 10 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 0.1, // slow random velocity
      vy: (Math.random() - 0.5) * 0.1,
    }));
    lampsPhysicsRef.current = initialLamps;
    setLampadas(initialLamps);

    // Physics Loop
    const loop = () => {
      if (simulationFinished) return;
      const newLamps = lampsPhysicsRef.current.map(l => ({...l}));
      const radius = 4; // 4% collision radius

      for (let i = 0; i < newLamps.length; i++) {
        let lamp = newLamps[i];
        lamp.x += lamp.vx;
        lamp.y += lamp.vy;

        // Bounce walls
        if (lamp.x < radius) { lamp.x = radius; lamp.vx *= -1; }
        if (lamp.x > 100 - radius) { lamp.x = 100 - radius; lamp.vx *= -1; }
        if (lamp.y < radius) { lamp.y = radius; lamp.vy *= -1; }
        if (lamp.y > 100 - radius) { lamp.y = 100 - radius; lamp.vy *= -1; }
      }

      // Inter-lamp collision
      for (let i = 0; i < newLamps.length; i++) {
        for (let j = i + 1; j < newLamps.length; j++) {
           const dx = newLamps[i].x - newLamps[j].x;
           const dy = newLamps[i].y - newLamps[j].y;
           const dist = Math.sqrt(dx*dx + dy*dy);
           if (dist < radius * 2) {
              const tempVx = newLamps[i].vx;
              const tempVy = newLamps[i].vy;
              newLamps[i].vx = newLamps[j].vx;
              newLamps[i].vy = newLamps[j].vy;
              newLamps[j].vx = tempVx;
              newLamps[j].vy = tempVy;

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

    // End simulation after 30s
    sessionTimeoutRef.current = setTimeout(() => {
      setSimulationFinished(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }, 30000);

    // Tick the timer every second
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
  };

  // Simulation setup
  useEffect(() => {
    startSimulation();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lamp scheduling logic for simulation
  useEffect(() => {
    if (lampadas.length === 0 || simulationFinished || activeLampId) return;
    
    const scheduleNextLamp = () => {
      const delay = 2000 + Math.random() * 4000; // faster for simulation (2-6s)
      timeoutRef.current = setTimeout(() => {
        if (simulationFinished) return;

        const randomLamp = lampsPhysicsRef.current[Math.floor(Math.random() * lampsPhysicsRef.current.length)];
        setActiveLampId(randomLamp.id);
        setFeedback(null);

        // Omission window (3000ms)
        timeoutRef.current = setTimeout(() => {
          setFeedback('omisso');
          setActiveLampId(null);
          // Wait a bit before next lamp
          timeoutRef.current = setTimeout(() => {
            setFeedback(null);
            scheduleNextLamp();
          }, 1000);
        }, 3000);

      }, delay);
    };

    scheduleNextLamp();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [lampadas.length, simulationFinished, activeLampId]);

  const handleContainerClick = () => {
    if (simulationFinished) return;
    if (!activeLampId && feedback !== 'acerto' && feedback !== 'erro') {
      setFeedback('erro'); // False alarm
    }
  };

  const handleLampClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (simulationFinished) return;
    if (activeLampId === id) {
      setFeedback('acerto');
      setActiveLampId(null);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Schedule next lamp after hit
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        // Note: The useEffect will re-trigger scheduleNextLamp because activeLampId became null
      }, 3000);
    } else {
      setFeedback('erro');
    }
  };

  return (
    <div 
      style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
      onClick={handleContainerClick}
    >
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
        >
          ← Sair
        </button>
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', textAlign: 'right', zIndex: 10 }}>
        <div style={{ color: 'white', opacity: 0.8 }}>SIMULAÇÃO ({timeLeft}s)</div>
        <button 
          onClick={onNext}
          style={{ marginTop: '8px', padding: '6px 12px', background: 'var(--color-sustained, #2563eb)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Pular Simulação
        </button>
      </div>

      {feedback && (
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          fontSize: '2rem', fontWeight: 'bold', zIndex: 20,
          color: feedback === 'acerto' ? '#4ade80' : feedback === 'erro' ? '#f87171' : '#fbbf24'
        }}>
          {feedback === 'acerto' ? 'MUITO BEM!' : feedback === 'erro' ? 'FALSO ALARME' : 'OMISSÃO'}
        </div>
      )}

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
              padding: '12px', // hitbox expansivo
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer'
            }}
          >
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

      {/* Overlay de Fim de Simulado */}
      {simulationFinished && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: '2rem', textAlign: 'center'
        }}>
          <h2 style={{ color: 'white', fontSize: '2rem', marginBottom: '1rem' }}>Simulado Concluído!</h2>
          <p style={{ color: '#d1d5db', fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px' }}>
            Você completou a fase de treino livre. Sente-se confortável para iniciar a tarefa oficial com a medição de métricas?
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={startSimulation}
              style={{ padding: '12px 24px', background: '#374151', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem' }}
            >
              Repetir Simulado
            </button>
            <button
              onClick={onNext}
              style={{ padding: '12px 24px', background: 'var(--color-sustained, #2563eb)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              Iniciar Treino
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
