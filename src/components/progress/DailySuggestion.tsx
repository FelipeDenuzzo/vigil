import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { AttentionProgress } from '../../hooks/useProgressData';
import { Button } from '../../shared/components/Button';

const ROUTES: Record<string, string> = {
  seletiva: '/treinar/seletiva', sustentada: '/treinar/sustentada',
  alternada: '/treinar/alternada', dividida: '/treinar/dividida',
};
const LABELS: Record<string, string> = {
  seletiva: 'Seletiva 🎯', sustentada: 'Sustentada ⏱', alternada: 'Alternada 🔀', dividida: 'Dividida ⚖️',
};

interface Props { byType: Record<string, AttentionProgress> }

function pickSuggestion(byType: Record<string, AttentionProgress>): { type: string; reason: string } | null {
  const types = Object.values(byType);
  if (types.length === 0) return null;

  // Prioridade 1: nunca treinado
  const never = types.find((t) => t.sessions.length === 0);
  if (never) return { type: never.type, reason: 'Você ainda não treinou este tipo.' };

  // Prioridade 2: mais dias sem treinar
  const sorted = [...types].sort((a, b) => (b.daysSinceLastPlay ?? 0) - (a.daysSinceLastPlay ?? 0));
  const oldest = sorted[0];
  if ((oldest.daysSinceLastPlay ?? 0) >= 3) {
    return { type: oldest.type, reason: `Não treinado há ${oldest.daysSinceLastPlay} dias.` };
  }

  // Prioridade 3: menor delta relativo ao baseline
  const withDelta = types.filter((t) => t.deltaFromBaseline !== null);
  if (withDelta.length > 0) {
    const weakest = withDelta.sort((a, b) => (a.deltaFromBaseline ?? 0) - (b.deltaFromBaseline ?? 0))[0];
    const sign = (weakest.deltaFromBaseline ?? 0) >= 0 ? '+' : '';
    return { type: weakest.type, reason: `Delta em relação ao baseline: ${sign}${weakest.deltaFromBaseline}pts.` };
  }

  return { type: sorted[0].type, reason: 'Continue treinando para manter o ritmo.' };
}

export const DailySuggestion: React.FC<Props> = ({ byType }) => {
  const navigate = useNavigate();
  const suggestion = pickSuggestion(byType);
  if (!suggestion) return null;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-4) var(--space-5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 'var(--space-3)',
      marginBottom: 'var(--space-6)',
    }}>
      <div>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>💡 Sugestão de hoje</p>
        <p style={{ margin: '2px 0 0', fontWeight: 700 }}>{LABELS[suggestion.type]}</p>
        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{suggestion.reason}</p>
      </div>
      <Button variant="secondary" onClick={() => navigate(ROUTES[suggestion.type])}>
        Treinar agora
      </Button>
    </div>
  );
};
