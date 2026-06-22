// src/attentions/divided/games/MentalVault/types.ts

export type MentalVaultFase = 'instrucoes' | 'codificacao' | 'processamento' | 'recall' | 'resumo';
export type CondicaoRodada = 'pura' | 'mista';

export interface ConfigJogo {
  quantidadeConsoantes: number;   // Número de consoantes a memorizar (3 a 6)
  tempoExibicaoMs: number;        // Tempo de exibição de cada consoante (ex: 1500ms)
  totalTentativasDigitos: number; // Número de trials de dígitos na fase 2 (ex: 8)
  condicao: CondicaoRodada;       // 'pura' ou 'mista'
}

export interface TentativaFase2 {
  indiceTentativa: number;        // 1-indexed (1 a 8)
  digito: number;                 // Dígito apresentado (1-9, exceto 5)
  corOuRegra: 'azul' | 'vermelho' | 'padrao';
  respostaCorreta: 'esquerda' | 'direita';
  respostaUsuario: 'esquerda' | 'direita' | 'omissao';
  acertou: boolean;
  tipoErro: 'comissao' | 'omissao' | null;
  tempoReacaoMs: number;
}

export interface RegistroRodada {
  sequenciaAlvo: string[];
  sequenciaDigitada: string[];
  condicaoRodada: CondicaoRodada;
  totalDigitosApresentados: number;
  tentativas: TentativaFase2[];
}

export interface ResultadoSessao {
  nivelMaximo: number;
  rodadas: RegistroRodada[];
}
