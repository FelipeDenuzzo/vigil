import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-primary)', marginBottom: 'var(--space-4)' }}>Página não encontrada</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>Desculpe, a página que você procura não existe ou foi movida.</p>
      <Button onClick={() => navigate('/')}>Ir para o início</Button>
    </div>
  );
};