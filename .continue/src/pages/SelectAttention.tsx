import { useNavigate } from 'react-router-dom';
import { Card } from '../shared/components/Card';
import { Button } from '../shared/components/Button';
import type { AttentionInfo } from '../shared/types';

const ATTENTIONS: Array<AttentionInfo & { path: string }> = [
  {
    id: 'selective',
    label: 'Atenção seletiva',
    description: 'Foco no alvo, ignorando distracoes.',
    color: 'var(--color-selective)',
    icon: '🎯',
    gamesCount: 0,
    path: '/treinar/seletiva',
  },
  {
    id: 'sustained',
    label: 'Atenção sustentada',
    description: 'Manter a atenção por periodos prolongados.',
    color: 'var(--color-sustained)',
    icon: '⏱️',
    gamesCount: 0,
    path: '/treinar/sustentada',
  },
  {
    id: 'alternating',
    label: 'Atenção alternada',
    description: 'Mudar de regra sem se perder.',
    color: 'var(--color-alternating)',
    icon: '🔁',
    gamesCount: 0,
    path: '/treinar/alternada',
  },
  {
    id: 'divided',
    label: 'Atenção dividida',
    description: 'Executar duas tarefas ao mesmo tempo.',
    color: 'var(--color-divided)',
    icon: '🧠',
    gamesCount: 0,
    path: '/treinar/dividida',
  },
];

export function SelectAttention() {
  const navigate = useNavigate();

  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10)' }}>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 'var(--space-6)' }}>
        ← Voltar
      </Button>

      <header style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Escolha o tipo de atenção para treinar</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Selecione um modulo para iniciar. Novos exercicios serao adicionados progressivamente.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {ATTENTIONS.map((attention) => (
          <Card
            key={attention.id}
            accent={attention.color}
            interactive
            onClick={() => navigate(attention.path)}
            style={{
              border: `1px solid ${attention.color}55`,
              boxShadow: `0 0 0 1px ${attention.color}22, var(--shadow-sm)`,
              minHeight: 190,
              display: 'grid',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 24 }}>{attention.icon}</span>
              <span style={{ color: attention.color, fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {attention.gamesCount === 0 ? 'Em breve' : `${attention.gamesCount} exercicios`}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--text-lg)' }}>{attention.label}</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>{attention.description}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
