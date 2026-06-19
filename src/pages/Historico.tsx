import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import db from '../lib/firebase';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';

interface SessionEntry {
  sessionId: string;
  game: string;
  attentionType: string;
  score: number;
  level: string;
  reportUrl?: string;
  createdAt?: { seconds: number };
}

const GAME_LABEL: Record<string, string> = {
  'visual-search': '🎯 Busca Visual',
  'long-mazes':    '🧩 Labirintos',
};

const LEVEL_COLOR: Record<string, string> = {
  'mínimo':    '#6dbf87',
  'leve':      '#a0b4f8',
  'moderado':  '#f5c070',
  'importante':'#f08080',
};

function formatDate(entry: SessionEntry): string {
  if (!entry.createdAt?.seconds) return '—';
  return new Date(entry.createdAt.seconds * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const Historico: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => d.data() as SessionEntry);
        setSessions(data);
      } catch (err) {
        console.error('[Historico]', err);
        setError('Não foi possível carregar o histórico. Tente novamente.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <Button variant="ghost" onClick={() => navigate('/treinar')} style={{ marginBottom: 'var(--space-8)' }}>
        ← Voltar
      </Button>

      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>📊 Histórico de treinos</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
        Todas as suas sessões avaliadas, da mais recente para a mais antiga.
      </p>

      {loading && (
        <p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p>
      )}

      {error && (
        <p style={{ color: '#f08080' }}>{error}</p>
      )}

      {!loading && !error && sessions.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
            Você ainda não completou nenhum treino avaliado.
          </p>
          <Button variant="secondary" onClick={() => navigate('/treinar')}>
            Iniciar primeiro treino
          </Button>
        </Card>
      )}

      {!loading && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {sessions.map((s) => (
            <Card key={s.sessionId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                  {GAME_LABEL[s.game] ?? s.game}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {formatDate(s)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>{s.score}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'block' }}>score</span>
                </div>

                <span style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: 'var(--text-sm)', fontWeight: 600,
                  background: `${LEVEL_COLOR[s.level] ?? '#8b8fa8'}22`,
                  color: LEVEL_COLOR[s.level] ?? '#8b8fa8',
                  border: `1px solid ${LEVEL_COLOR[s.level] ?? '#8b8fa8'}55`,
                }}>
                  {s.level}
                </span>

                {s.reportUrl && (
                  <a
                    href={s.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 16px', borderRadius: 99, fontSize: 'var(--text-sm)',
                      background: 'rgba(108,142,245,0.12)', color: '#a0b4f8',
                      border: '1px solid rgba(108,142,245,0.25)',
                    }}
                  >
                    Ver laudo
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
