import React from 'react';
import { Button } from '../shared/components/Button';
import { useAuth } from '../lib/AuthContext';

interface Props {
  onStart: () => void;
}

export const OnboardingWelcome: React.FC<Props> = ({ onStart }) => {
  const { displayName } = useAuth();

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', maxWidth: '600px' }}>
      <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🧠</div>

      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
        {displayName ? `Olá, ${displayName}!` : 'Bem-vindo ao Vigil!'}
      </h1>

      <p style={{ fontSize: 'var(--text-lg)', color: '#ffffff', marginBottom: 'var(--space-6)' }}>
        Antes de começar, vamos fazer um rastreamento rápido — cerca de <strong>5 minutos</strong> — para entender seu ponto de partida em cada tipo de atenção.
      </p>

      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <p style={{ fontWeight: 600, marginBottom: 'var(--space-3)' }}>O que vai acontecer:</p>
        <ol style={{ paddingLeft: 'var(--space-5)', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <li><strong style={{ color: 'var(--color-text)' }}>Etapa 1 — Calibragem (~1 min)</strong><br />Clique no circulo toda vez que ficar verde.</li>
          <li><strong style={{ color: 'var(--color-text)' }}>Etapa 2 — Controle (~2 min)</strong><br />Clique no quadrado preto quando aparecer.</li>
          <li><strong style={{ color: 'var(--color-text)' }}>Etapa 3 — Flexibilidade (~2 min)</strong><br />Alterne entre sequências seguindo a ordem correta.</li>
          <li><strong style={{ color: 'var(--color-text)' }}>Etapa 4 — Dupla-Tarefa (~2 min)</strong><br />Estoure bolhas azuis enquanto responde a estímulos sonoros.</li>
        </ol>
      </div>

      <p style={{ fontSize: 'var(--text-sm)', color: '#ffffff', marginBottom: 'var(--space-6)' }}>
        Este rastreamento é feito uma única vez. Os resultados ficam salvos e são usados para personalizar seus relatórios e acompanhar sua evolução.
      </p>

      <Button variant="primary" onClick={onStart} style={{ width: '100%' }}>
        Iniciar rastreamento
      </Button>
    </div>
  );
};
