// src/pages/Admin.tsx
// Painel de administração — acessível apenas para usuários com role: 'admin'.
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import db from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { AccessStatus } from '../lib/AuthContext';

interface UserRecord {
  uid: string;
  email: string;
  accessStatus: AccessStatus;
  role: string;
  createdAt: any;
}

const STATUS_LABEL: Record<AccessStatus, string> = {
  approved: '✅ Aprovado',
  pending:  '⏳ Pendente',
  blocked:  '🚫 Bloqueado',
};

const STATUS_COLOR: Record<AccessStatus, string> = {
  approved: 'rgba(34,197,94,0.12)',
  pending:  'rgba(234,179,8,0.12)',
  blocked:  'rgba(239,68,68,0.12)',
};

export function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users,   setUsers]   = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState<string | null>(null); // uid em salvamento
  const [search,  setSearch]  = useState('');
  const [statusFilter, setStatusFilter] = useState<AccessStatus | 'all'>('all');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list: UserRecord[] = snap.docs.map(d => ({
        uid:          d.id,
        email:        d.data().email ?? '—',
        accessStatus: d.data().accessStatus ?? 'pending',
        role:         d.data().role ?? 'user',
        createdAt:    d.data().createdAt,
      }));
      setUsers(list);
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(uid: string, status: AccessStatus) {
    setSaving(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { accessStatus: status });
      setUsers(prev =>
        prev.map(u => u.uid === uid ? { ...u, accessStatus: status } : u)
      );
    } finally {
      setSaving(null);
    }
  }

  async function toggleAdmin(uid: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setSaving(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(prev =>
        prev.map(u => u.uid === uid ? { ...u, role: newRole } : u)
      );
    } finally {
      setSaving(null);
    }
  }

  function formatDate(ts: any): string {
    if (!ts) return '—';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '—'; }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.accessStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    total:    users.length,
    approved: users.filter(u => u.accessStatus === 'approved').length,
    pending:  users.filter(u => u.accessStatus === 'pending').length,
    blocked:  users.filter(u => u.accessStatus === 'blocked').length,
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', margin: 0 }}>Painel Admin</h1>
          <p style={{ color: '#ffffff', fontSize: 'var(--text-sm)', marginTop: 4 }}>
            Logado como <strong>{user?.email}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={loadUsers}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: '#ffffff', fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}
          >
            ↻ Atualizar
          </button>
          <button
            onClick={() => navigate('/treinar')}
            style={{
              padding: '8px 16px', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)', background: 'transparent',
              color: '#ffffff', fontSize: 'var(--text-sm)', cursor: 'pointer',
            }}
          >
            ← Voltar ao app
          </button>
        </div>
      </div>

      {/* Cards de resumo (Clicáveis para filtrar) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {([
          { id: 'all',      label: 'Total',     value: counts.total,    color: 'var(--color-primary)' },
          { id: 'approved', label: 'Aprovados', value: counts.approved, color: '#22c55e' },
          { id: 'pending',  label: 'Pendentes', value: counts.pending,  color: '#eab308' },
          { id: 'blocked',  label: 'Bloqueados',value: counts.blocked,  color: '#ef4444' },
        ] as const).map(c => (
          <button
            key={c.id}
            onClick={() => setStatusFilter(c.id as any)}
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              background: statusFilter === c.id ? 'var(--color-surface)' : 'var(--color-surface-2)',
              border: `1px solid ${statusFilter === c.id ? c.color : 'var(--color-border)'}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: statusFilter === c.id ? 'scale(1.02)' : 'scale(1)',
              boxShadow: statusFilter === c.id ? `0 4px 12px ${c.color}20` : 'none',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: '#ffffff', marginTop: 4, fontWeight: statusFilter === c.id ? 'bold' : 'normal' }}>{c.label}</div>
          </button>
        ))}
      </div>

      {/* Busca */}
      <input
        type="search"
        placeholder="Buscar por e-mail…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '10px 14px', marginBottom: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
          color: 'var(--color-text)',
          fontSize: 'var(--text-sm)',
        }}
      />

      {/* Tabela */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#ffffff' }}>Carregando…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#ffffff' }}>Nenhum usuário encontrado.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filtered.map(u => (
            <div
              key={u.uid}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: 'var(--space-3)',
                alignItems: 'center',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: STATUS_COLOR[u.accessStatus],
                border: '1px solid var(--color-border)',
                flexWrap: 'wrap',
              }}
            >
              {/* Info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                  {u.role === 'admin' && (
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                      textTransform: 'uppercase', color: 'var(--color-primary)',
                      background: 'rgba(108,142,245,0.15)',
                      padding: '2px 6px', borderRadius: 4,
                    }}>admin</span>
                  )}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: '#ffffff', marginTop: 2 }}>
                  {STATUS_LABEL[u.accessStatus]} · cadastro em {formatDate(u.createdAt)}
                </div>
              </div>

              {/* Botões de status */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {(['approved', 'pending', 'blocked'] as AccessStatus[]).map(s => (
                  <button
                    key={s}
                    disabled={u.accessStatus === s || saving === u.uid}
                    onClick={() => setStatus(u.uid, s)}
                    title={STATUS_LABEL[s]}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: u.accessStatus === s ? '2px solid currentColor' : '1px solid var(--color-border)',
                      background: u.accessStatus === s ? STATUS_COLOR[s] : 'transparent',
                      color: s === 'approved' ? '#22c55e' : s === 'pending' ? '#eab308' : '#ef4444',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: u.accessStatus === s ? 'default' : 'pointer',
                      opacity: saving === u.uid ? 0.5 : 1,
                    }}
                  >
                    {s === 'approved' ? '✅' : s === 'pending' ? '⏳' : '🚫'}
                  </button>
                ))}
              </div>

              {/* Toggle admin — não pode remover o próprio admin */}
              <button
                disabled={u.uid === user?.uid || saving === u.uid}
                onClick={() => toggleAdmin(u.uid, u.role)}
                title={u.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: u.role === 'admin' ? 'var(--color-primary)' : 'var(--color-text-faint)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: u.uid === user?.uid ? 'not-allowed' : 'pointer',
                  opacity: saving === u.uid ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {u.role === 'admin' ? '👑 admin' : 'admin?'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
