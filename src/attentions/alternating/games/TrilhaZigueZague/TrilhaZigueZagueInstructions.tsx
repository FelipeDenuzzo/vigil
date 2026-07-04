// src/attentions/alternating/games/TrilhaZigueZague/TrilhaZigueZagueInstructions.tsx

import React from 'react';

interface Props {
  onStart: () => void;
  onClose?: () => void;
}

export const TrilhaZigueZagueInstructions: React.FC<Props> = ({ onStart, onClose }) => {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px 12px 0 0',
      }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#e8e9f0' }}>Instruções: Trilha Zigue-Zague</h2>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a3a8cc', fontSize: 24, cursor: 'pointer' }}>
            ×
          </button>
        )}
      </div>

      <div style={{
        padding: '24px 20px', background: 'rgba(0,0,0,0.2)', borderRadius: '0 0 12px 12px',
        color: '#a3a8cc', lineHeight: 1.5, fontSize: 15
      }}>
        <p style={{ marginTop: 0 }}>
          Bem-vindo à Trilha Zigue-Zague, um teste focado em <strong>Flexibilidade Cognitiva</strong>.
        </p>
        
        <p>O teste será dividido em duas fases curtas:</p>
        
        <ul style={{ paddingLeft: 20 }}>
          <li style={{ marginBottom: 12 }}>
            <strong style={{ color: '#fff' }}>Fase 1:</strong> Você verá vários círculos com números. 
            Sua missão é clicar neles em ordem numérica (1, 2, 3, 4, 5...), o mais rápido que puder.
          </li>
          <li>
            <strong style={{ color: '#fff' }}>Fase 2:</strong> Você verá números e letras. 
            Você deverá alternar entre eles em ordem (1, A, 2, B, 3, C, 4, D...), o mais rápido que puder, sem errar.
          </li>
        </ul>

        <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            💡 <em>Dica: Tente memorizar onde estão os próximos alvos para ganhar tempo!</em>
          </p>
        </div>

        <button
          onClick={onStart}
          style={{
            display: 'block', width: '100%', marginTop: 24, padding: '14px 0',
            background: '#10b981', color: '#fff', fontSize: 16, fontWeight: 600,
            border: 'none', borderRadius: 8, cursor: 'pointer'
          }}
        >
          Começar Treino
        </button>
      </div>
    </div>
  );
};

export default TrilhaZigueZagueInstructions;
