// src/attentions/alternating/games/Insetos/InsetosInstructions.tsx
// Tela de instruções do jogo Insetos

import React from 'react';

interface Props {
  onStart: () => void;
  onBack:  () => void;
}

const s = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '24px 16px',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 20,
  },
  card: {
    background: '#161820',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: '#e8e9f0',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a4be',
    textAlign: 'center' as const,
    lineHeight: 1.6,
  },
  stepRow: {
    display: 'flex' as const,
    gap: 12,
    alignItems: 'flex-start' as const,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(108,142,245,0.15)',
    border: '1px solid #6c8ef5',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: 13,
    fontWeight: 700,
    color: '#6c8ef5',
    flexShrink: 0,
  },
  stepText: {
    fontSize: 14,
    color: '#c8cad8',
    lineHeight: 1.6,
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 16px',
    background: 'linear-gradient(135deg, #6c8ef5, #a78bfa)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },
  ghostBtn: {
    width: '100%',
    padding: '12px 16px',
    background: 'none',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#a0a4be',
    fontSize: 14,
    cursor: 'pointer',
  },
};

export const InsetosInstructions: React.FC<Props> = ({ onStart, onBack }) => (
  <div style={s.container}>
    <div style={s.card}>
      <p style={s.title}>🐜🐞 Insetos em Alerta</p>
      <p style={s.subtitle}>
        Treine sua atenção alternada — <br />
        mude de foco rapidamente entre grupos de insetos!
      </p>
    </div>

    <div style={s.card}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#e8e9f0', marginBottom: 16 }}>
        Como jogar
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          {
            num: '1',
            text: 'Você verá formigas e joaninhas se movendo pela tela.',
          },
          {
            num: '2',
            text: <>Uma instrução no topo indica o grupo ativo:<br/>🐜 Formigas ou 🐞 Joaninhas.</>,
          },
          {
            num: '3',
            text: 'Quando um inseto do grupo ativo PISCAR, toque nele rapidamente!',
          },
          {
            num: '4',
            text: 'De tempos em tempos o grupo ativo muda — fique atento à troca!',
          },
        ].map(step => (
          <div key={step.num} style={s.stepRow}>
            <div style={s.stepNum}>{step.num}</div>
            <p style={s.stepText}>{step.text}</p>
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button type="button" style={s.primaryBtn} onClick={onStart}>
        Começar treino
      </button>
      <button type="button" style={s.ghostBtn} onClick={onBack}>
        ← Voltar
      </button>
    </div>
  </div>
);

export default InsetosInstructions;
