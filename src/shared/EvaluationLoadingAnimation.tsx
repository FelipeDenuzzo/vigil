// src/shared/EvaluationLoadingAnimation.tsx
// Animação de espera em 2 fases: IA gerando → App organizando.
// Componente global — reutilizável por todos os jogos do Vigil.

import { useEffect, useState } from 'react';

const PHASES = [
  {
    id: 'ai',
    icon: '🧠',
    title: 'Analisando sua sessão',
    subtitle: 'A IA está interpretando seus padrões de atenção...',
    color: '#6c8ef5',
  },
  {
    id: 'organize',
    icon: '📋',
    title: 'Organizando o relatório',
    subtitle: 'Montando as seções do relatório...',
    color: '#5ec893',
  },
] as const;

const STYLE_ID = 'vigil-loading-styles';

const CSS = `
@keyframes vigilPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50%       { opacity: 1;   transform: scale(1.1);  }
}
@keyframes vigilSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0);    }
}
@keyframes vigilSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes vigilBarFill {
  from { width: 0%; }
  to   { width: 100%; }
}
`;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

interface Props {
  /** Quando true, a segunda fase (organizar) está ativa */
  organizing?: boolean;
}

export function EvaluationLoadingAnimation({ organizing = false }: Props) {
  const [dots, setDots] = useState('');
  const phaseIndex = organizing ? 1 : 0;
  const phase = PHASES[phaseIndex];

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      style={{
        background: '#161820',
        border: `1px solid ${phase.color}44`,
        borderRadius: 16,
        padding: '36px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'vigilSlideUp 0.35s ease',
        transition: 'border-color 0.5s ease',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16, display: 'inline-block', animation: 'vigilPulse 1.8s ease-in-out infinite' }}>
        {phase.icon}
      </div>

      <div style={{
        width: 36, height: 36,
        border: `3px solid ${phase.color}33`,
        borderTop: `3px solid ${phase.color}`,
        borderRadius: '50%',
        animation: 'vigilSpin 0.9s linear infinite',
        margin: '0 auto 16px',
      }} />

      <p key={phase.id + '-title'} style={{ fontSize: 17, fontWeight: 700, color: '#e8e9f0', marginBottom: 6, animation: 'vigilSlideUp 0.3s ease' }}>
        {phase.title}{dots}
      </p>

      <p key={phase.id + '-sub'} style={{ fontSize: 13, color: '#ffffff', marginBottom: 24, animation: 'vigilSlideUp 0.4s ease' }}>
        {phase.subtitle}
      </p>

      <div style={{ height: 4, background: '#2a2d3e', borderRadius: 99, overflow: 'hidden', maxWidth: 240, margin: '0 auto 24px' }}>
        <div
          key={phase.id + '-bar'}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${phase.color}88, ${phase.color})`,
            borderRadius: 99,
            animation: 'vigilBarFill 12s linear forwards',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
        {PHASES.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: i === phaseIndex ? 1 : 0.35, transition: 'opacity 0.4s ease' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: i === phaseIndex ? p.color : '#4a4d62', display: 'inline-block', transition: 'background 0.4s ease' }} />
            <span style={{ fontSize: 11, color: '#6b6f88' }}>
              {i === 0 ? 'IA analisando' : 'App organizando'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
