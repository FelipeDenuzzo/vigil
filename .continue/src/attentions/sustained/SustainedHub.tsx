import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';

export function SustainedHub() {
  const navigate = useNavigate();

  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10)' }}>
      <header style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        <Button variant="ghost" onClick={() => navigate('/treinar')} style={{ justifySelf: 'start' }}>
          ← Voltar
        </Button>
        <h1 style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-sustained)' }}>Atenção sustentada</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Treina permanencia de foco por mais tempo, com estabilidade atencional.
        </p>
      </header>

      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ marginBottom: 'var(--space-3)' }}>Exercicios disponiveis</h2>
        <Card accent="var(--color-sustained)">
          <p style={{ color: 'var(--color-text-muted)' }}>
            Exercicios chegando em breve. Volte para a tela principal e explore outro tipo.
          </p>
        </Card>
      </section>

      <Button variant="secondary" onClick={() => navigate('/treinar')}>
        Voltar à seleção
      </Button>
    </main>
  );
}
