import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { UserBaseline, BaselineLevel } from './types';
import { useAuth } from '../lib/AuthContext';

interface Props {
  baseline: UserBaseline;
  onSave: (baseline: UserBaseline) => Promise<void>;
  saving: boolean;
  saveError: string | null;
}

const LABELS: Record<string, string> = {
  seletiva: 'Seletiva',
  sustentada: 'Sustentada',
  alternada: 'Alternada',
  dividida: 'Dividida',
};

const LEVEL_LABEL: Record<BaselineLevel, string> = {
  minimo: 'Referência',
  leve: 'Leve',
  moderado: 'Moderado',
  importante: 'Alta prioridade',
};

const LEVEL_COLOR: Record<BaselineLevel, string> = {
  minimo: 'var(--color-selective)',
  leve: 'var(--color-alternating)',
  moderado: 'var(--color-sustained)',
  importante: 'var(--color-divided)',
};

function findPriority(baseline: UserBaseline): string {
  const entries = Object.entries(baseline) as [string, UserBaseline[keyof UserBaseline]][];
  const lowest = entries.reduce((min, curr) => curr[1].score < min[1].score ? curr : min);
  return LABELS[lowest[0]];
}

export const OnboardingResult: React.FC<Props> = ({ baseline, onSave, saving, saveError }) => {
  const navigate = useNavigate();
  const { refreshAccess } = useAuth();
  const [saved, setSaved] = useState(false);
  const priority = findPriority(baseline);

  useEffect(() => {
    if (saved) return;
    onSave(baseline)
      .then(() => refreshAccess())
      .then(() => setSaved(true))
      .catch(() => {}); // erro exibido via saveError
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    navigate('/treinar', { replace: true });
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', maxWidth: '600px' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
        Seu ponto de partida
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
        Este é o seu baseline — a referência que a IA vai usar para medir sua evolução em cada sessão.
      </p>

      {/* Cards de resultado por tipo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {(Object.entries(baseline) as [string, UserBaseline[keyof UserBaseline]][]).map(([key, entry]) => (
          <div key={key} style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            borderLeft: `4px solid ${LEVEL_COLOR[entry.level]}`,
          }}>
            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>{LABELS[key]}</p>
            <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
              {entry.score}
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 400 }}> /100</span>
            </p>
            <p style={{ fontSize: 'var(--text-sm)', color: LEVEL_COLOR[entry.level] }}>
              {LEVEL_LABEL[entry.level]}
            </p>
          </div>
        ))}
      </div>

      {/* Recomendação do tipo prioritário */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
        borderTop: '3px solid var(--color-selective)',
      }}>
        <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Por onde começar</p>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Seu maior potencial de melhora agora está na atenção{' '}
          <strong style={{ color: 'var(--color-text)' }}>{priority}</strong>.
          Comece por ela para sentir progressos mais rápidos.
        </p>
      </div>

      {saveError && (
        <p style={{ color: 'var(--color-error, red)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          {saveError}
        </p>
      )}

      <Button
        variant="primary"
        onClick={handleContinue}
        disabled={saving || !saved}
        style={{ width: '100%' }}
      >
        {saving ? 'Salvando...' : 'Ir para o treino'}
      </Button>
    </div>
  );
};
