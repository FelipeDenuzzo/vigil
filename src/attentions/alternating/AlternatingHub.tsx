// src/attentions/alternating/AlternatingHub.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';

export const AlternatingHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button variant="ghost" onClick={() => navigate('/treinar')} style={{ marginBottom: 'var(--space-4)' }}>
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-alternating)' }}>Atenção Alternada</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Esta modalidade fortalece sua capacidade de alternar o foco entre diferentes tipos de tarefas de forma rápida e fluida.
        </p>
      </header>

      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>

          <Card
            style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            onClick={() => navigate('/treinar/alternada/color-shape')}
          >
            <div style={{ fontSize: 40, marginBottom: 'var(--space-3)' }}>🎨</div>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)', color: 'var(--color-alternating)' }}>
              Cor ou Forma
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
              Você verá uma figura na tela e precisa responder pela cor ou pela forma — a cada rodada, a regra pode mudar.
            </p>
            <Button variant="primary" onClick={(e) => { e.stopPropagation(); navigate('/treinar/alternada/color-shape'); }}>
              Jogar
            </Button>
          </Card>

        </div>
      </section>
    </div>
  );
};
