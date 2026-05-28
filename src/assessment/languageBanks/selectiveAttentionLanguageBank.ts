// src/assessment/languageBanks/selectiveAttentionLanguageBank.ts
// Banco de linguagem para avaliação de Atenção Seletiva

export const selectiveAttentionLanguageBank = {
  definicao:
    "Capacidade de selecionar estímulos relevantes e inibir os distratores, mantendo a precisão.",

  termosternicos: [
    "Erro de comissão (falso alarme)",
    "Impulsividade",
    "Falha no controle inibitório",
    "Distratibilidade",
    "Conjunção ilusória (confusão de atributos)",
    "Atraso pós-erro (Post-error slowing - PES)",
    "Efeito de interferência / Conflito de resposta",
    "Trade-off velocidade-precisão",
    "Busca serial vs. pop-out",
  ],

  padroesDeerro: {
    cliqueImpulsivo:
      "O usuário clica rapidamente na pegadinha (distrator muito parecido com o alvo).",
    confusaoDeAtributo:
      "O usuário acerta a cor do alvo, mas erra a forma geométrica (ou vice-versa) quando a tela enche de informações.",
    ausenciaDeFreio:
      "Comete erro de comissão mas continua clicando rápido e de forma impulsiva, sem detectar a própria falha.",
    vulnerabilidadeAInterferencia:
      "Foca perfeitamente em imagens neutras, mas erra ao aparecer distração conflitante.",
    chuteImpulsivo:
      "Tempos de reação extremamente baixos (< 200ms) atrelados a altas taxas de erro — o dedo agiu antes do cérebro processar.",
  },

  severidade: {
    minimo:
      "Excelente capacidade de focar apenas no alvo, ignorando totalmente as distrações ao redor.",
    leve:
      "Bom nível de foco, apresentando pequenas distrações apenas quando a tela ficou muito cheia.",
    moderado:
      "Dificuldade em filtrar as distrações, o que resultou em respostas um pouco mais impulsivas diante das pegadinhas.",
    importante:
      "A agilidade superou a precisão. A dificuldade em frear o impulso fez com que o cérebro registrasse os distratores como alvos válidos.",
  },

  frasesDeInterpretacao: [
    "O seu 'Olho de Águia' funcionou muito bem nos níveis mais limpos.",
    "As distrações roubaram um pouco da sua atenção nas fases mais difíceis.",
    "Notamos que o aumento de informações gerou uma pequena confusão entre as cores e as formas dos símbolos.",
    "Você demonstrou um reflexo impressionante, mas às vezes a rapidez roubou a sua precisão diante das pegadinhas.",
    "O seu cérebro lidou muito bem com os alvos simples, mas precisou de um grande esforço mental extra para desvendar os alvos disfarçados entre distrações parecidas.",
    "Notamos um excelente sistema de 'freio': após um clique incorreto, você ajustou seu ritmo na jogada seguinte para garantir que não erraria novamente!",
    "A presença de informações conflitantes na tela gerou um congestionamento temporário no seu filtro de atenção.",
  ],

  indicadoresPositivos: [
    "Filtro atencional afiado",
    "Resistente a distrações e pegadinhas",
    "Ótimo controle dos impulsos",
    "Precisão cirúrgica",
    "Automonitoramento ativo",
    "Resistência à interferência",
    "Controle inibitório maduro",
    "Excelente calibragem entre velocidade e precisão",
  ],

  sinaisDeAlerta: {
    assimetriaEspacial:
      "Ignora consistentemente distratores ou alvos de um lado específico da tela, sugerindo possível negligência espacial.",
    impulsividadeSemCorrecao:
      "Alta impulsividade contínua sem autocorreção após erro (atraso pós-erro ausente), podendo sugerir disfunção executiva orbitofrontal.",
    colapsoDeConjuncao:
      "100% de acerto em fases simples, mas colapso para 0% quando a fase exige filtrar forma + cor simultaneamente.",
  },
} as const;
