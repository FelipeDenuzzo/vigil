import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';

const attentionCards = [
  {
    title: 'Atenção seletiva',
    description: 'Foco no alvo, ignorando distracoes.',
    color: 'var(--color-selective)',
    path: '/treinar/seletiva',
  },
  {
    title: 'Atenção sustentada',
    description: 'Manter a atenção por periodos prolongados.',
    color: 'var(--color-sustained)',
    path: '/treinar/sustentada',
  },
  {
    title: 'Atenção alternada',
    description: 'Mudar de regra sem se perder.',
    color: 'var(--color-alternating)',
    path: '/treinar/alternada',
  },
  {
    title: 'Atenção dividida',
    description: 'Executar duas tarefas ao mesmo tempo.',
    color: 'var(--color-divided)',
    path: '/treinar/dividida',
  },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <main>
      <section
        className="container"
        style={{
          paddingBlock: 'var(--space-16)',
          display: 'grid',
          gap: 'var(--space-8)',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(140deg, var(--color-surface-2), var(--color-surface-offset))',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-3)',
          }}
          aria-label="Logo VIGIL"
        >
          <svg viewBox="0 0 64 64" role="img" aria-hidden="true">
            <path d="M8 32c6-10 14-16 24-16s18 6 24 16c-6 10-14 16-24 16S14 42 8 32z" fill="none" stroke="var(--color-primary)" strokeWidth="4" />
            <path d="M14 20 28 52h8L50 20" fill="none" stroke="var(--color-text)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="40" cy="24" r="3" fill="var(--color-primary-hover)" />
          </svg>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', maxWidth: '22ch' }}>
            Treino de atenção para uma mente mais presente
          </h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: 700 }}>
            VIGIL e um programa digital que exercita sua atenção de forma progressiva, em sessoes curtas e adaptadas ao seu ritmo.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button onClick={() => navigate('/treinar')}>Começar o treino</Button>
          <Button
            variant="secondary"
            onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Como funciona?
          </Button>
        </div>
      </section>

      <section id="o-que-e-atencao" className="container" style={{ paddingBlock: 'var(--space-12)' }}>
        <Card style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>O que e atenção?</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Atenção e a capacidade de direcionar o foco mental para o que importa e manter esse foco diante de distracoes, uma habilidade que pode ser treinada no dia a dia.
          </p>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Quando fortalecemos a atenção, tarefas simples ficam mais fluidas: ler, cozinhar, conversar, organizar a rotina e finalizar atividades com menos desgaste.
          </p>
        </Card>
      </section>

      <section id="como-funciona" className="container" style={{ paddingBlock: 'var(--space-12)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-6)' }}>Como funciona o treino</h2>
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-4)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          <Card>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>1. Escolha o tipo de atenção</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Selecione entre atenção seletiva, sustentada, alternada ou dividida.</p>
          </Card>
          <Card>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>2. Faça o exercicio</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Sessoes curtas de 3 a 5 minutos, planejadas para caber na sua rotina.</p>
          </Card>
          <Card>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>3. Acompanhe sua evolução</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>Seu progresso fica salvo no dispositivo para acompanhar resultados ao longo do tempo.</p>
          </Card>
        </div>
      </section>

      <section className="container" style={{ paddingBlock: 'var(--space-12)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-6)' }}>Os 4 tipos de atenção</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {attentionCards.map((item) => (
            <Card key={item.title} accent={item.color} interactive onClick={() => navigate(item.path)}>
              <h3 style={{ marginBottom: 'var(--space-2)' }}>{item.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>{item.description}</p>
              <span style={{ color: item.color, fontWeight: 600 }}>Ver exercicios →</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="container container--narrow" style={{ paddingBlock: 'var(--space-12)' }}>
        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Por que treinar a atenção?</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          Nosso cerebro tem plasticidade, ou seja, consegue se adaptar e fortalecer habilidades ao longo da vida. O treino cognitivo pode apoiar essa capacidade de forma gradual e gentil.
        </p>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
          Com prática consistente, muitas pessoas percebem mais clareza mental, melhor organização e maior confiança para lidar com tarefas do cotidiano, sem pressão por desempenho perfeito.
        </p>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Pensar em envelhecimento saudavel tambem inclui cuidar da atenção. Pequenos exercicios frequentes podem contribuir para manter autonomia, presença e bem-estar cognitivo no dia a dia.
        </p>
      </section>

      <footer
        style={{
          borderTop: '1px solid var(--color-divider)',
          marginTop: 'var(--space-12)',
          paddingBlock: 'var(--space-8)',
        }}
      >
        <div className="container" style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <strong style={{ fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>VIGIL</strong>
          <p style={{ color: 'var(--color-text-muted)' }}>Desenvolvido para treinar mentes presentes</p>
        </div>
      </footer>
    </main>
  );
}
