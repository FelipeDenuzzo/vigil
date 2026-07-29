// src/simulator/SimulatorRunner.ts
// Executa um cenário contra o GCP evaluator e retorna um SimulationLog completo.

import type { Scenario, SimulationLog } from './types';

export async function runScenario(
  scenario: Scenario,
  dryRun: boolean
): Promise<SimulationLog> {
  const id = `${scenario.id}-${Date.now()}`;
  const timestamp = new Date().toISOString();
  const payload = scenario.buildPayload();

  if (dryRun) {
    return {
      id,
      scenarioLabel: scenario.label,
      game: scenario.game,
      attentionType: scenario.attentionType,
      inputPayload: payload,
      httpStatus: null,
      responseBody: null,
      durationMs: 0,
      error: null,
      timestamp,
      localScore: scenario.localScore,
      aiScore: null,
      passed: true, // dry run sempre "passa" — só montou o payload
      expectedStatus: scenario.expectedStatus,
      dryRun: true,
    };
  }

  const url    = import.meta.env.VITE_EVALUATOR_URL as string | undefined;
  const secret = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

  if (!url || !secret) {
    return {
      id,
      scenarioLabel: scenario.label,
      game: scenario.game,
      attentionType: scenario.attentionType,
      inputPayload: payload,
      httpStatus: null,
      responseBody: null,
      durationMs: 0,
      error: 'VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados',
      timestamp,
      localScore: scenario.localScore,
      aiScore: null,
      passed: false,
      expectedStatus: scenario.expectedStatus,
      dryRun: false,
    };
  }

  const start = performance.now();
  let httpStatus: number | null = null;
  let responseBody: Record<string, unknown> | null = null;
  let error: string | null = null;

  try {
    const res = await fetch(`${url}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000), // mais generoso que o app real (45s)
    });

    httpStatus = res.status;

    try {
      responseBody = await res.json();
    } catch {
      responseBody = { raw: await res.text().catch(() => '(não lido)') };
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Math.round(performance.now() - start);
  const aiScore = (responseBody as any)?.score ?? null;
  const passed = httpStatus === scenario.expectedStatus;

  return {
    id,
    scenarioLabel: scenario.label,
    game: scenario.game,
    attentionType: scenario.attentionType,
    inputPayload: payload,
    httpStatus,
    responseBody,
    durationMs,
    error,
    timestamp,
    localScore: scenario.localScore,
    aiScore,
    passed,
    expectedStatus: scenario.expectedStatus,
    dryRun: false,
  };
}
