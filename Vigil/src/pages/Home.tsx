import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {/* Header / Hero */}
      <header className="container" style={{ paddingTop: 'var(--space-16)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
          {/* Logo SVG Placeholder */}
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M32 0L64 32L32 64L0 32L32 0Z" fill="var(--color-primary-glow)" />
            <path d="M32 16L48 32L32 48L16 32L32 16Z" fill="var(--color-primary)" />
            <circle cx="32" cy="32" r="4" fill="var(--color-bg)" />
          </svg>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
          Treino de atenção para uma mente mais presente
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-lg)', margin: '0 auto var(--space-8)' }}>
          VIGIL é um programa digital que exercita sua atenção de forma progressiva, em sessões curtas e adaptadas ao seu ritmo.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button size="lg" onClick={() => navigate('/treinar')}>Começar o treino</Button>
          <Button size="lg" variant="secondary" onClick={() => scrollToSection('como-funciona')}>Como funciona?</Button>
        </div>
      </header>

      {/* O que é atenção? */}
      <section id="o-que-e-atencao" className="container" style={{ background: 'var(--color-surface)', padding: 'var(--space-12) var(--space-8)', borderRadius: 'var(--radius-xl)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>O que é atenção?</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          Atenção é a capacidade de direcionar o foco mental para o que importa e manter esse foco diante de distrações — uma habilidade que pode ser treinada.
        </p>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Através de exercícios práticos, você pode fortalecer os diferentes tipos de atenção e melhorar seu desempenho cognitivo no dia a dia.
        </p>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="container">
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-8)', textAlign: 'center' }}>Como funciona o treino</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          <Card>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>1. Escolha o tipo de atenção</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Seletiva, sustentada, alternada ou dividida</p>
          </Card>
          <Card>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>2. Faça o exercício</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Sessões curtas de 3 a 5 minutos</p>
          </Card>
          <Card>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>3. Acompanhe sua evolução</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Seu progresso é salvo no dispositivo</p>
          </Card>
        </div>
      </section>

      {/* Tipos de atenção */}
      <section className="container">
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-8)', textAlign: 'center' }}>Os 4 tipos de atenção</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          <Card accent="var(--color-selective)" interactive onClick={() => navigate('/treinar/seletiva')}>
            <h3 style={{ color: 'var(--color-selective)', marginBottom: 'var(--space-2)' }}>🎯 Seletiva</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Foco no alvo, ignorando distrações.</p>
            <span style={{ color: 'var(--color-selective)' }}>Ver exercícios →</span>
          </Card>
          <Card accent="var(--color-sustained)" interactive onClick={() => navigate('/treinar/sustentada')}>
            <h3 style={{ color: 'var(--color-sustained)', marginBottom: 'var(--space-2)' }}>⏱ Sustentada</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Manter a atenção por períodos prolongados.</p>
            <span style={{ color: 'var(--color-sustained)' }}>Ver exercícios →</span>
          </Card>
          <Card accent="var(--color-alternating)" interactive onClick={() => navigate('/treinar/alternada')}>
            <h3 style={{ color: 'var(--color-alternating)', marginBottom: 'var(--space-2)' }}>🔀 Alternada</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Mudar de regra sem se perder.</p>
            <span style={{ color: 'var(--color-alternating)' }}>Ver exercícios →</span>
          </Card>
          <Card accent="var(--color-divided)" interactive onClick={() => navigate('/treinar/dividida')}>
            <h3 style={{ color: 'var(--color-divided)', marginBottom: 'var(--space-2)' }}>⚖️ Dividida</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>Executar duas tarefas ao mesmo tempo.</p>
            <span style={{ color: 'var(--color-divided)' }}>Ver exercícios →</span>
          </Card>
        </div>
      </section>

      {/* Por que treinar? */}
      <section className="container" style={{ background: 'var(--color-surface)', padding: 'var(--space-12) var(--space-8)', borderRadius: 'var(--radius-xl)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Por que treinar a atenção?</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          A neuroplasticidade permite que o nosso cérebro se adapte e crie novas conexões ao longo de toda a vida. Praticar exercícios mentais ajuda no envelhecimento saudável.
        </p>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Dedicar alguns minutos do seu dia a treinar o foco pode trazer benefícios reais na forma como você absorve informações, realiza tarefas e se conecta com o momento presente.
        </p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-8) 0', textAlign: 'center', marginTop: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>VIGIL</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Desenvolvido para treinar mentes presentes</p>
      </footer>
    </div>
  );
};