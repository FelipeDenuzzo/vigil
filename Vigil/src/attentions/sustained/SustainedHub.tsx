import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';

export const SustainedHub: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <Button variant="ghost" onClick={() => navigate('/treinar')} style={{ marginBottom: 'var(--space-4)' }}>
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-sustained)' }}>Atenção Sustentada</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
          Esta modalidade treina sua capacidade de manter o foco por períodos longos, aumentando a resistência cognitiva perante o cansaço.
        </p>
      </header>

      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Empty state list - Exercícios aqui futuramente */}
        </div>

        <Card style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Exercícios chegando em breve. Volte para a tela principal e explore outro tipo de atenção.
          </p>
          <Button variant="secondary" onClick={() => navigate('/treinar')}>
            Voltar à seleção
          </Button>
        </Card>
      </section>
    </div>
  );
};