// src/attentions/alternating/games/TrilhaZigueZague/TrilhaZigueZagueResult.tsx

import React from 'react';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';

interface Props {
  geminiReport?: GeminiReport;
  loaded: boolean | 'organizing';
  onRepeat: () => void;
  onBackToStart: () => void;
}

export const TrilhaZigueZagueResult: React.FC<Props> = ({
  geminiReport,
  loaded,
  onRepeat,
  onBackToStart,
}) => {
  if (!loaded) {
    return (
      <div style={{ textAlign: 'center', color: '#a3a8cc', padding: 40 }}>
        Analisando seus resultados com Inteligência Artificial...
      </div>
    );
  }

  if (loaded === 'organizing') {
    return (
      <div style={{ textAlign: 'center', color: '#a3a8cc', padding: 40 }}>
        Montando o relatório final...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 24, textAlign: 'center' }}>
        Resultado: Trilha Zigue-Zague
      </h2>
      
      {geminiReport ? (
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 24 }}>
          <h3 style={{ color: '#fff', marginTop: 0 }}>Sua Pontuação: {geminiReport.score}</h3>
          
          <div style={{ marginTop: 24 }}>
            <h4 style={{ color: '#10b981' }}>O que você fez bem:</h4>
            <p style={{ color: '#e8e9f0', lineHeight: 1.6 }}>{geminiReport.general?.strengths?.join(', ') || '...'}</p>
          </div>

          <div style={{ marginTop: 24 }}>
            <h4 style={{ color: '#3b82f6' }}>O que melhorar:</h4>
            <p style={{ color: '#e8e9f0', lineHeight: 1.6 }}>{geminiReport.general?.weaknesses?.join(', ') || '...'}</p>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            <h4 style={{ color: '#e8e9f0', marginTop: 0 }}>Recomendação</h4>
            <p style={{ color: '#a3a8cc', margin: 0, lineHeight: 1.6 }}>{geminiReport.general?.recommendation || '...'}</p>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#ef4444', padding: 24, background: 'rgba(239,68,68,0.1)', borderRadius: 12 }}>
          Não foi possível gerar o relatório completo no momento. Tente novamente mais tarde.
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
        <button
          onClick={onRepeat}
          style={{
            padding: '12px 24px', background: 'transparent', color: '#a3a8cc', fontSize: 15, fontWeight: 600,
            border: '1px solid #3a3f58', borderRadius: 8, cursor: 'pointer'
          }}
        >
          Jogar Novamente
        </button>
        <button
          onClick={onBackToStart}
          style={{
            padding: '12px 24px', background: '#3b82f6', color: '#fff', fontSize: 15, fontWeight: 600,
            border: 'none', borderRadius: 8, cursor: 'pointer'
          }}
        >
          Voltar ao Hub
        </button>
      </div>
    </div>
  );
};
