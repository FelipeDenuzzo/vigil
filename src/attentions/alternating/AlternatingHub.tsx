// src/attentions/alternating/AlternatingHub.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';

export const AlternatingHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="container"
      style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}
    >
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button
          variant="ghost"
          onClick={() => navigate('/treinar')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-alternating)' }}>
          Atenção Alternada
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Esta modalidade fortalece sua capacidade de alternar o foco entre diferentes tipos de tarefas de forma rápida e fluida.
        </p>
      </header>

      <section>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-6)',
          }}
        >
          <Card
            interactive
            accent="var(--color-alternating)"
            onClick={() => navigate('/treinar/alternada/color-shape')}
          >
            <p
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                marginBottom: 'var(--space-2)',
              }}
            >
              🎨 Cor ou Forma
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Você verá uma figura na tela e precisa responder pela cor ou pela
              forma — a cada rodada, a regra pode mudar.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
};
