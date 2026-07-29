import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { runScenario } from './SimulatorRunner';
import { trilhaZigueZagueScenarios } from './scenarios/trilhaZigueZague';
import { insetosScenarios } from './scenarios/insetos';
import { colorShapeScenarios } from './scenarios/colorShape';
import { fruitWatchScenarios } from './scenarios/fruitWatch';
import { longMazesScenarios } from './scenarios/longMazes';
import { salaDeVigiliaScenarios } from './scenarios/salaDeVigilia';
import { acharOFaltandoScenarios } from './scenarios/acharOFaltando';
import { visualSearchScenarios } from './scenarios/visualSearch';
import { mentalVaultScenarios } from './scenarios/mentalVault';
import { selectiveListeningScenarios } from './scenarios/selectiveListening';
import type { SimulationLog, GameGroup, Scenario } from './types';
import './VigilSimulator.css';

// ── Registro dos grupos ──────────────────────────────────────────────────────
const GAME_GROUPS: GameGroup[] = [
  // Alternada
  {
    id: 'trilha',
    label: 'Trilha Zigue-Zague (alternada)',
    attentionType: 'alternada',
    scenarios: trilhaZigueZagueScenarios,
  },
  {
    id: 'insetos',
    label: 'Insetos (alternada)',
    attentionType: 'alternada',
    scenarios: insetosScenarios,
  },
  {
    id: 'colorshape',
    label: 'Color Shape (alternada)',
    attentionType: 'alternada',
    scenarios: colorShapeScenarios,
  },
  // Sustentada
  {
    id: 'fruitwatch',
    label: 'Fruit Watch / Foco Ninja (sustentada)',
    attentionType: 'sustentada',
    scenarios: fruitWatchScenarios,
  },
  {
    id: 'longmazes',
    label: 'Long Mazes (sustentada)',
    attentionType: 'sustentada',
    scenarios: longMazesScenarios,
  },
  {
    id: 'saladevigilia',
    label: 'Sala de Vigília (sustentada)',
    attentionType: 'sustentada',
    scenarios: salaDeVigiliaScenarios,
  },
  // Seletiva
  {
    id: 'acharofaltando',
    label: 'Achar o Faltando (seletiva)',
    attentionType: 'seletiva',
    scenarios: acharOFaltandoScenarios,
  },
  {
    id: 'visualsearch',
    label: 'Visual Search Hunt (seletiva)',
    attentionType: 'seletiva',
    scenarios: visualSearchScenarios,
  },
  // Dividida
  {
    id: 'mentalvault',
    label: 'Cofre Mental (dividida)',
    attentionType: 'dividida',
    scenarios: mentalVaultScenarios,
  },
  {
    id: 'selectivelistening',
    label: 'Escuta Seletiva (dividida)',
    attentionType: 'dividida',
    scenarios: selectiveListeningScenarios,
  },
];

// ── Syntax highlighter simples para JSON ─────────────────────────────────────
function highlightJSON(obj: unknown): string {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          return /:$/.test(match)
            ? `<span class="j-key">${match}</span>`
            : `<span class="j-str">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="j-bool">${match}</span>`;
        if (/null/.test(match))       return `<span class="j-null">${match}</span>`;
        return `<span class="j-num">${match}</span>`;
      }
    );
}

// ── Componente JSON Viewer ────────────────────────────────────────────────────
function JsonViewer({ title, data }: { title: string; data: unknown }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="sim-json-wrap">
      <p className="sim-json-title">{title}</p>
      <button className="sim-copy-btn" onClick={handleCopy} id={`copy-${title.replace(/\s/g,'-')}`}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
      <div
        className="sim-json-box"
        dangerouslySetInnerHTML={{ __html: data != null ? highlightJSON(data) : '<span class="j-null">—</span>' }}
      />
    </div>
  );
}

// ── Componente ResultPanel ────────────────────────────────────────────────────
function ResultPanel({ log, loading }: { log: SimulationLog | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="sim-card">
        <div className="sim-loading">
          <div className="sim-spinner" />
          <span>Enviando para o GCP Evaluator… (até 60s)</span>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="sim-card">
        <p style={{ color: '#334155', textAlign: 'center', padding: '48px', margin: 0 }}>
          Selecione um cenário e clique em <strong style={{ color: '#6366f1' }}>Executar</strong>
        </p>
      </div>
    );
  }

  const statusClass = log.dryRun ? 'dry' : log.passed ? 'pass' : 'fail';
  const statusLabel = log.dryRun
    ? '🔵 Dry Run'
    : log.passed
      ? `✅ PASS — HTTP ${log.httpStatus}`
      : `❌ FAIL — HTTP ${log.httpStatus ?? 'timeout/erro'}`;

  return (
    <div className="sim-card">
      <div className="sim-status" id="sim-result-status" style={{ marginBottom: 16 }}>
        <span className={`sim-status ${statusClass}`}>{statusLabel}</span>
      </div>

      <div className="sim-metrics-row" style={{ marginBottom: 20 }}>
        <div className="sim-metric">
          <span className="sim-metric-label">Latência</span>
          <span className="sim-metric-value">{log.durationMs > 0 ? `${log.durationMs}ms` : '—'}</span>
        </div>
        <div className="sim-metric">
          <span className="sim-metric-label">Score local</span>
          <span className="sim-metric-value highlight">{log.localScore ?? '—'}</span>
        </div>
        <div className="sim-metric">
          <span className="sim-metric-label">Score IA</span>
          <span className="sim-metric-value highlight">{log.aiScore ?? '—'}</span>
        </div>
        <div className="sim-metric">
          <span className="sim-metric-label">Esperado</span>
          <span className="sim-metric-value">HTTP {log.expectedStatus}</span>
        </div>
      </div>

      {log.error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: '#f87171',
          marginBottom: 16,
        }}>
          ⚠️ {log.error}
        </div>
      )}

      <div className="sim-result-top">
        <JsonViewer title="Request (payload enviado)" data={log.inputPayload} />
        <JsonViewer title="Response (corpo da resposta)" data={log.responseBody} />
      </div>
    </div>
  );
}

// ── Componente LogTable ───────────────────────────────────────────────────────
function LogTable({
  logs,
  activeId,
  onSelect,
}: {
  logs: SimulationLog[];
  activeId: string | null;
  onSelect: (log: SimulationLog) => void;
}) {
  if (logs.length === 0) {
    return (
      <div className="sim-log-empty">
        Nenhuma execução nesta sessão ainda.
      </div>
    );
  }

  return (
    <table className="sim-log-table" id="sim-log-table">
      <thead>
        <tr>
          <th>Horário</th>
          <th>Cenário</th>
          <th>Jogo</th>
          <th>Status</th>
          <th>Latência</th>
          <th>Score Local</th>
          <th>Score IA</th>
          <th>Resultado</th>
        </tr>
      </thead>
      <tbody>
        {[...logs].reverse().map((log) => {
          const cls = log.dryRun ? 'dry' : log.passed ? 'pass' : 'fail';
          const badge = log.dryRun ? 'Dry Run' : log.passed ? 'PASS' : 'FAIL';
          const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
          return (
            <tr
              key={log.id}
              className={activeId === log.id ? 'active' : ''}
              onClick={() => onSelect(log)}
            >
              <td>{time}</td>
              <td style={{ color: '#e2e8f0' }}>{log.scenarioLabel}</td>
              <td>{log.game}</td>
              <td>{log.httpStatus ?? '—'}</td>
              <td>{log.durationMs > 0 ? `${log.durationMs}ms` : '—'}</td>
              <td style={{ color: '#a5b4fc' }}>{log.localScore ?? '—'}</td>
              <td style={{ color: '#a5b4fc' }}>{log.aiScore ?? '—'}</td>
              <td><span className={`sim-badge ${cls}`}>{badge}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Página Principal ─────────────────────────────────────────────────────────
export function VigilSimulator() {
  const navigate = useNavigate();

  const [selectedGroupId, setSelectedGroupId] = useState(GAME_GROUPS[0].id);
  const [selectedScenarioId, setSelectedScenarioId] = useState(GAME_GROUPS[0].scenarios[0].id);
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [activeLog, setActiveLog] = useState<SimulationLog | null>(null);

  const currentGroup = GAME_GROUPS.find(g => g.id === selectedGroupId) ?? GAME_GROUPS[0];
  const currentScenario: Scenario =
    currentGroup.scenarios.find(s => s.id === selectedScenarioId)
    ?? currentGroup.scenarios[0];

  const handleGroupChange = (id: string) => {
    setSelectedGroupId(id);
    const group = GAME_GROUPS.find(g => g.id === id) ?? GAME_GROUPS[0];
    setSelectedScenarioId(group.scenarios[0].id);
  };

  const handleRun = useCallback(async () => {
    setLoading(true);
    try {
      const log = await runScenario(currentScenario, dryRun);
      setLogs(prev => [...prev, log]);
      setActiveLog(log);
    } finally {
      setLoading(false);
    }
  }, [currentScenario, dryRun]);

  return (
    <div className="sim-page">
      {/* Header */}
      <div className="sim-header">
        <div className="sim-header-icon">🧪</div>
        <div className="sim-header-info">
          <h1>Vigil Simulator</h1>
          <p>Testa payloads do app contra o GCP Evaluator — apenas para admins</p>
        </div>
        <button className="sim-back-btn" id="sim-back-btn" onClick={() => navigate('/admin')}>
          ← Admin
        </button>
      </div>

      {/* Layout */}
      <div className="sim-layout">
        {/* Controls */}
        <div>
          <div className="sim-card">
            <p className="sim-card-title">Configuração</p>

            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Jogo</label>
            <select
              id="sim-select-game"
              className="sim-select"
              value={selectedGroupId}
              onChange={e => handleGroupChange(e.target.value)}
            >
              {GAME_GROUPS.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>

            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Cenário</label>
            <select
              id="sim-select-scenario"
              className="sim-select"
              value={selectedScenarioId}
              onChange={e => setSelectedScenarioId(e.target.value)}
            >
              {currentGroup.scenarios.map(s => (
                <option key={s.id} value={s.id}>{s.expectedLevelEmoji} {s.label}</option>
              ))}
            </select>

            <p className="sim-scenario-desc">{currentScenario.description}</p>

            <div className="sim-expected">
              <span>Espera HTTP</span>
              <strong style={{ color: currentScenario.expectedStatus === 200 ? '#4ade80' : '#f87171' }}>
                {currentScenario.expectedStatus}
              </strong>
              {currentScenario.localScore !== null && (
                <>
                  <span style={{ marginLeft: 8 }}>Score local</span>
                  <strong style={{ color: '#a5b4fc' }}>{currentScenario.localScore}</strong>
                </>
              )}
            </div>

            {/* Dry Run toggle */}
            <div className="sim-toggle-row">
              <div className="sim-toggle-label">
                <span>Dry Run</span>
                <small>Só monta o payload, sem enviar</small>
              </div>
              <label className="sim-toggle">
                <input
                  id="sim-toggle-dryrun"
                  type="checkbox"
                  checked={dryRun}
                  onChange={e => setDryRun(e.target.checked)}
                />
                <span className="sim-toggle-track" />
              </label>
            </div>

            <button
              id="sim-run-btn"
              className={`sim-run-btn${dryRun ? ' dry-mode' : ''}`}
              disabled={loading}
              onClick={handleRun}
            >
              {loading
                ? '⏳ Executando…'
                : dryRun
                  ? '🔵 Gerar Payload (Dry Run)'
                  : '🚀 Executar contra GCP'
              }
            </button>
          </div>
        </div>

        {/* Result */}
        <ResultPanel log={activeLog} loading={loading} />
      </div>

      {/* Log */}
      <div className="sim-log-section">
        <div className="sim-log-header">
          <p className="sim-log-header-title">📋 Log da sessão ({logs.length})</p>
          {logs.length > 0 && (
            <button className="sim-log-clear-btn" id="sim-log-clear-btn" onClick={() => { setLogs([]); setActiveLog(null); }}>
              Limpar log
            </button>
          )}
        </div>
        <LogTable
          logs={logs}
          activeId={activeLog?.id ?? null}
          onSelect={(log) => setActiveLog(log)}
        />
      </div>
    </div>
  );
}
