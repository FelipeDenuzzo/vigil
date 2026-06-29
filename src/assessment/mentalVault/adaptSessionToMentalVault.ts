// src/assessment/mentalVault/adaptSessionToMentalVault.ts

import type { RegistroRodada } from '../../attentions/divided/games/MentalVault/types';

export function adaptSessionToMentalVault(rawRounds: unknown): RegistroRodada[] {
  if (!Array.isArray(rawRounds)) return [];

  return rawRounds.map((r: any) => {
    return {
      sequenciaAlvo: Array.isArray(r.sequenciaAlvo) ? r.sequenciaAlvo.map(String) : [],
      sequenciaDigitada: Array.isArray(r.sequenciaDigitada) ? r.sequenciaDigitada.map(String) : [],
      condicaoRodada: r.condicaoRodada === 'mista' ? 'mista' : 'pura',
      totalDigitosApresentados: Number(r.totalDigitosApresentados) || 0,
      tentativas: Array.isArray(r.tentativas)
        ? r.tentativas.map((t: any) => ({
            indiceTentativa: Number(t.indiceTentativa) || 0,
            digito: Number(t.digito) || 0,
            corOuRegra: String(t.corOuRegra) as any,
            respostaCorreta: String(t.respostaCorreta) as any,
            respostaUsuario: String(t.respostaUsuario) as any,
            acertou: Boolean(t.acertou),
            tipoErro: t.tipoErro === null ? null : (String(t.tipoErro) as any),
            tempoReacaoMs: Number(t.tempoReacaoMs) || 0,
          }))
        : [],
    };
  });
}
