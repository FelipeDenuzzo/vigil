# Labirintos Prolongados

Módulo de **atenção sustentada** do Vigil. O usuário navega por 3 labirintos progressivos (Fácil, Médio, Difícil), com coleta automática de métricas clínicas e laudo gerado via Gemini.

---

## Arquitetura do pipeline

```
LabirintosProlongadosGame
  └─ onComplete(MazeFullSessionLog)
       │
       ▼
SustainedHub  →  gera sessionId (uuid)
                 estado: 'result'
                 │
                 ▼
LongMazesEvaluationContainer  [Artefato 4]
  ├─ verifica cache Firestore (sessionReports)
  ├─ calculateLongMazesMetrics(log)           [Artefato 1]
  ├─ buildLongMazesTechnicalReport(metrics)   [Artefato 2]
  ├─ POST /evaluate → vigil-evaluator         [Artefato 3]
  │     └─ prompts/sustained.ts → Gemini
  ├─ saveReport → Firestore sessions + Firebase Storage
  └─ LongMazesReportPanel
        ├─ aba 🎯 Régua (score + level)
        ├─ aba 📋 Análise clínica
        └─ aba 📈 Fases (detalhamento por fase)
```

---

## Arquivos do módulo

| Arquivo | Responsável |
|---|---|
| `LabirintosProlongadosGame.tsx` | Jogo completo (3 fases, canvas, teclado, touch, D-pad) |
| `LongMazesEvaluationContainer.tsx` | Artefato 4 — orquestra avaliação e exibe laudo |
| `LongMazesEvaluationLoadingAnimation.tsx` | Animação de carregamento (analyzing / organizing) |
| `LongMazesReportPanel.tsx` | Painel de resultado com 3 abas |
| `useLongMazesEvaluation.ts` | Artefato 3 — chama vigil-evaluator e salva |
| `levels.ts` | Configuração das 3 fases (tamanho, tempo, densidade) |
| `logic.ts` | Geração de labirinto (DFS), movimento, detecção de becos |
| `types.ts` | Tipos do jogo: `MazeData`, `MazeSessionResult`, `MazeFullSessionLog` |

## Artefatos de avaliação (em `src/assessment/longMazes/`)

| Arquivo | Responsável |
|---|---|
| `types.ts` | `MazePhaseMetrics`, `MazeAggregatedMetrics`, `LongMazesSeverity` |
| `calculateLongMazesMetrics.ts` | Artefato 1 — cálculo determinístico de métricas e severity |
| `buildLongMazesTechnicalReport.ts` | Artefato 2 — monta `EvaluatorInput` para o vigil-evaluator |

---

## Métricas coletadas

| Métrica | Indicador clínico |
|---|---|
| `efficiencyPct` | Planejamento antecipatório (caminho real vs. ótimo) |
| `revisits` | Perseveração frontal |
| `deadEndEntries` | Impulsividade |
| `longStops` | Lapsos de atenção (paradas > 3s) |
| `postErrorPause` | Automonitoramento (tempo após bater em parede) |

## Regra de severity

1. `completedPhases === 0` → **importante**
2. `totalRevisits > 5` → **importante**
3. `totalRevisits ≥ 3` → **moderado**
4. `avgEfficiencyPct ≥ 85` e `totalLongStops ≤ 1` → **mínimo**
5. `avgEfficiencyPct ≥ 70` → **leve**
6. `avgEfficiencyPct ≥ 50` → **moderado**
7. abaixo disso → **importante**

---

## Persistência no Firestore

Cada sessão concluída gera dois registros:
- `sessions/{sessionId}` — metadados (score, level, game, attentionType, reportUrl)
- `sessionReports/{sessionId}` — laudo Gemini completo (cache para evitar rechamações)
- `laudos/{sessionId}.md` — laudo em Markdown no Firebase Storage
