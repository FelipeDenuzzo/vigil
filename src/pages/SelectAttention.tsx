// src/pages/SelectAttention.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { useAuth } from '../lib/AuthContext';
import { useAttentionStatus, AttentionType, AttentionStatus } from '../hooks/useAttentionStatus';

// ─── Badge de estado individual do card ──────────────────────────────────────

function AttentionBadge({ status, accentColor }: { status: AttentionStatus; accentColor: string }) {
  if (status.state === 'loading') {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        …
      </p>
    );
  }

  if (status.state === 'never') {
    return (
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        Nunca treinado · <span style={{ color: accentColor }}>Começar agora</span>
      </p>
    );
  }

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', margin: 0 }}>
        Última sessão: <strong style={{ color: 'var(--color-text)' }}>{status.lastDate}</strong>
      </p>
      {status.bestScore !== null && (
        <p style={{ fontSize: 'var(--text-sm)', color: accentColor, margin: 0 }}>
          Melhor score: {status.bestScore}pts
        </p>
      )}
    </div>
  );
}

// ─── Dados estáticos dos cards ────────────────────────────────────────────────

const ATTENTION_CARDS: Array<{
  type: AttentionType;
  emoji: string;
  label: string;
  description: string;
  route: string;
  accentVar: string;
}> = [
  {
    type: 'seletiva',
    emoji: '🎯',
    label: 'Seletiva',
    description: 'Foco no alvo, ignorando distrações do ambiente.',
    route: '/treinar/seletiva',
    accentVar: 'var(--color-selective)',
  },
  {
    type: 'sustentada',
    emoji: '⏱',
    label: 'Sustentada',
    description: 'Manter a atenção ativa por períodos prolongados.',
    route: '/treinar/sustentada',
    accentVar: 'var(--color-sustained)',
  },
  {
    type: 'alternada',
    emoji: '🔀',
    label: 'Alternada',
    description: 'Mudar de regra ou foco sem se perder no caminho.',
    route: '/treinar/alternada',
    accentVar: 'var(--color-alternating)',
  },
  {
    type: 'dividida',
    emoji: '⚖️',
    label: 'Dividida',
    description: 'Executar duas tarefas ao mesmo tempo com eficiência.',
    route: '/treinar/dividida',
    accentVar: 'var(--color-divided)',
  },
];

// ─── Saudação ─────────────────────────────────────────────────────────────────

function Greeting({ name }: { name: string | null }) {
  const hour = new Date().getHours();
  const period = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const greeting = name ? `${period}, ${name}.` : `${period}.`;

  return (
    <p style={{
      fontSize: 'var(--text-lg)',
      color: 'var(--color-text-muted)',
      marginBottom: 'var(--space-2)',
      marginTop: 0,
    }}>
      {greeting} O que vamos treinar hoje?
    </p>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export const SelectAttention: React.FC = () => {
  const navigate = useNavigate();
  const { user, displayName } = useAuth();
  const statusMap = useAttentionStatus(user?.uid);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 'var(--space-8)' }}>
        ← Voltar
      </Button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-2)',
      }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>Escolha o treino</h1>
        <Button variant="ghost" onClick={() => navigate('/historico')} style={{ fontSize: 'var(--text-sm)' }}>
          📊 Histórico
        </Button>
      </div>

      <Greeting name={displayName} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)',
        marginTop: 'var(--space-8)',
      }}>
        {ATTENTION_CARDS.map(({ type, emoji, label, description, route, accentVar }) => (
          <Card key={type} accent={accentVar} interactive onClick={() => navigate(route)}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{emoji}</div>
            <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>{label}</h2>
            <AttentionBadge status={statusMap[type]} accentColor={accentVar} />
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>{description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
