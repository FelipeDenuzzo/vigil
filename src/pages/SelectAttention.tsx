import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';

export const SelectAttention: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 'var(--space-8)' }}>
        ← Voltar
      </Button>

      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Escolha o treino</h1>
      <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
        Selecione qual tipo de atenção você deseja praticar agora.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        <Card accent="var(--color-selective)" interactive onClick={() => navigate('/treinar/seletiva')}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🎯</div>
          <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Seletiva</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-selective)', marginBottom: 'var(--space-4)' }}>Em breve</p>
          <p style={{ color: 'var(--color-text-muted)' }}>Foco no alvo, ignorando distrações do ambiente.</p>
        </Card>

        <Card accent="var(--color-sustained)" interactive onClick={() => navigate('/treinar/sustentada')}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>⏱</div>
          <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Sustentada</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-sustained)', marginBottom: 'var(--space-4)' }}>Em breve</p>
          <p style={{ color: 'var(--color-text-muted)' }}>Manter a atenção ativa por períodos prolongados.</p>
        </Card>

        <Card accent="var(--color-alternating)" interactive onClick={() => navigate('/treinar/alternada')}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🔀</div>
          <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Alternada</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-alternating)', marginBottom: 'var(--space-4)' }}>Em breve</p>
          <p style={{ color: 'var(--color-text-muted)' }}>Mudar de regra ou foco sem se perder no caminho.</p>
        </Card>

        <Card accent="var(--color-divided)" interactive onClick={() => navigate('/treinar/dividida')}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>⚖️</div>
          <h2 style={{ color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>Dividida</h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-divided)', marginBottom: 'var(--space-4)' }}>Em breve</p>
          <p style={{ color: 'var(--color-text-muted)' }}>Executar duas tarefas ao mesmo tempo com eficiência.</p>
        </Card>
      </div>
    </div>
  );
};