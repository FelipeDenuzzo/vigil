# Diretriz de Arquitetura — Pipeline de Avaliação do Vigil

**Repositório (Monorepo):** [vigil](https://github.com/FelipeDenuzzo/vigil) (Front-end e Back-end integrados)  
**Data:** 19 de junho de 2026  
**Status:** Diretriz aprovada — referência para toda construção futura de avaliação

---

## Visão Geral

O pipeline de avaliação do Vigil passou por uma migração para **Monorepo**. O backend (`vigil-evaluator`) foi consolidado como uma pasta dentro do repositório principal (`vigil`) para unificar o fluxo de CI/CD (Cloud Build) e evitar dessincronização de contratos entre front e back.

O pipeline é composto por **4 artefatos com responsabilidades independentes**. Nenhum artefato conhece os detalhes internos do outro. Modificações em um não devem afetar os demais.

Os treinos de referência ativos em produção e desenvolvimento são:
- **VisualSearchHunt** (Caça ao Alvo — Atenção Seletiva)
- **AcharOFaltando** (Achar o Faltando — Atenção Seletiva)
- **SelectiveListening** (Escuta Seletiva — Atenção Dividida)

Toda nova avaliação ou treino deve seguir os mesmos padrões arquiteturais estabelecidos por eles.

---

## Os 4 Artefatos

```
[1. TREINO]
  → emite eventos brutos (cliques, tempos, acertos, erros)
        │
[2. AVALIADOR INTERNO DO TREINO]
  → adapta os dados brutos da sessão
  → aplica diretrizes científicas
  → calcula métricas + severity + score
  → gera o log estruturado
        │
[3. INTERFACE DE ENVIO AO GEMINI]
  → monta e envia o prompt (1 prompt por tipo de atenção)
  → recebe o JSON de volta
        │
[4. COMPONENTE DE APRESENTAÇÃO]
  → exibe o laudo ao usuário
```

---

## Artefato 1 — Treino

**Responsabilidade:** executar o jogo e registrar o que aconteceu. Não sabe nada sobre avaliação.

**Treinos ativos no repositório:**

| Jogo / Treino | Tipo de Atenção | Localização do Componente Principal |
|---|---|---|
| **VisualSearchHunt** (Caça ao Alvo) | Seletiva | `src/attentions/selective/games/VisualSearchHunt/VisualSearchHunt.tsx` |
| **AcharOFaltando** (Achar o Faltando) | Seletiva | `src/attentions/selective/games/AcharOFaltando/AcharOFaltandoPlay.tsx` |
| **SelectiveListening** (Escuta Seletiva) | Dividida | `src/attentions/divided/games/SelectiveListening/SelectiveListening.tsx` |

**Estrutura de pastas por tipo de atenção (já existem no repositório):**

| Tipo | Pasta |
|---|---|
| Seletiva | `src/attentions/selective/` |
| Sustentada | `src/attentions/sustained/` |
| Alternada | `src/attentions/alternating/` |
| Dividida | `src/attentions/divided/` |

**Regra:** cada novo treino criado fica dentro da pasta `games/` do seu tipo de atenção, seguindo os padrões de separação de fases (instruções, simulação, jogo ativo, e carregamento de resultado).

*(Nota de Estímulo Visual - AcharOFaltando: Os estímulos visuais deste treino utilizarão os arquivos de imagem PNG locais localizados no diretório `public/simbolos/` (de `18.png` a `45.png`), em vez de caracteres Unicode simples, para proporcionar uma interface lúdica e visualmente rica).*

---

## Artefato 2 — Avaliador Interno do Treino

**Responsabilidade:** receber os eventos brutos do treino, adaptar, aplicar as diretrizes científicas, calcular métricas, determinar severity e montar o log estruturado para o Gemini.

**Regra crítica:** as diretrizes científicas (faixas de normalidade, valores de corte, padrões interpretativos) são definidas pelo responsável do produto com base em artigos científicos e codificadas aqui. O Gemini não decide nada sobre métricas — ele só recebe o resultado.

**Localização padrão:**
```
src/assessment/{nomeDotreino}/
```
*(Nota: Para treinos locais simplificados ou em fase de prototipagem, a lógica de cálculo de métricas e estrutura de dados pode residir no arquivo `logic.ts` dentro da própria pasta do treino, como ocorre em `AcharOFaltando`).*

### Arquivos obrigatórios por treino integrado ao Gemini

Cada pasta `src/assessment/{nomeDotreino}/` deve conter **exatamente** estes arquivos, com os nomes adaptados ao treino:

| Arquivo | Responsabilidade |
|---|---|
| `adaptSessionTo{NomeDoTreino}.ts` | Adapta os dados brutos da sessão para o formato interno do avaliador |
| `calculate{NomeDoTreino}Metrics.ts` | Calcula as métricas específicas do treino (ex: errorProfile, spatialProfile, tempos) |
| `{nomeDotreino}ScaleDefinitions.ts` | Define as faixas científicas de normalidade e valores de corte — preenchido pelo responsável do produto com base em artigos |
| `build{NomeDoTreino}ScaleResult.ts` | Aplica as faixas e determina `severity` e `score` |
| `build{NomeDoTreino}TechnicalReport.ts` | Monta o log estruturado (`EvaluatorInput`) pronto para enviar ao Gemini |
| `types.ts` | Tipos e interfaces específicos do treino |

### Referências existentes — VisualSearch & SelectiveListening

**Atenção Seletiva (VisualSearch):**

| Arquivo | Link |
|---|---|
| `adaptSessionToRoundClicks.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/adaptSessionToRoundClicks.ts) |
| `calculateVisualSearchMetrics.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/calculateVisualSearchMetrics.ts) |
| `visualSearchScaleDefinitions.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/visualSearchScaleDefinitions.ts) |
| `buildVisualSearchScaleResult.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/buildVisualSearchScaleResult.ts) |
| `buildVisualSearchTechnicalReport.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/buildVisualSearchTechnicalReport.ts) |
| `types.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/types.ts) |

**Atenção Dividida (SelectiveListening):**

| Arquivo | Link |
|---|---|
| `adaptSessionToSelectiveListening.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/selectiveListening/adaptSessionToSelectiveListening.ts) |
| `calculateSelectiveListeningMetrics.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/selectiveListening/calculateSelectiveListeningMetrics.ts) |
| `selectiveListeningScaleDefinitions.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/selectiveListening/selectiveListeningScaleDefinitions.ts) |
| `buildSelectiveListeningScaleResult.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/selectiveListening/buildSelectiveListeningScaleResult.ts) |
| `buildSelectiveListeningTechnicalReport.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/selectiveListening/buildSelectiveListeningTechnicalReport.ts) |
| `types.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/selectiveListening/types.ts) |

---

## Artefato 3 — Interface de Envio ao Gemini

**Responsabilidade:** receber o log estruturado do Avaliador Interno, enviar ao `vigil-evaluator` via POST, e retornar o JSON do laudo gerado pelo Gemini.

**Regra:** existe **1 prompt por tipo de atenção** — não por treino. Todos os treinos de atenção seletiva usam o mesmo prompt; todos os de sustentada usam outro; e assim por diante.

**Hook de referência (vigil — front-end):**

| Arquivo | Responsabilidade | Link |
|---|---|---|
| `useVisualSearchEvaluation.ts` | Hook React que orquestra o envio ao avaliador e recebe o resultado | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/useVisualSearchEvaluation.ts) |

**No vigil-evaluator (back-end):**

| Arquivo | Responsabilidade | Link |
|---|---|---|
| `src/evaluate.ts` | Orquestrador: seleciona o prompt por `attentionType`, chama o Gemini, valida o retorno | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/evaluate.ts) |
| `src/evaluators/visualSearch.ts` | Avaliador determinístico preservado — não usar em produção por ora | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/evaluators/visualSearch.ts) |
| `src/types.ts` | Interfaces `EvaluatorInput` e `EvaluationReport` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/types.ts) |

**Prompts por tipo de atenção — `vigil-evaluator/src/prompts/`:**

| Arquivo | Status | Link |
|---|---|---|
| `selective.ts` | ✅ Implementado | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/prompts/selective.ts) |
| `sustained.ts` | 🔲 Esqueleto — a preencher | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/prompts/sustained.ts) |
| `alternating.ts` | ✅ Implementado | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/prompts/alternating.ts) |
| `divided.ts` | 🔲 Esqueleto — a preencher | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/prompts/divided.ts) |
| `onboarding.ts`| ✅ Implementado (Backend processa 0-100) | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/src/prompts/onboarding.ts) |

**Regra de expansão:** ao criar o prompt de um novo tipo de atenção, adicionar o `case` correspondente na função `resolvePromptAndSchema()` dentro de `src/evaluate.ts`.

---

## Artefato 4 — Componente de Apresentação

**Responsabilidade:** receber o JSON do laudo retornado pelo Gemini ou calculado localmente e exibi-lo de forma visual e intuitiva para o usuário ou profissional.

**Componentes de Apresentação por Treino:**

**Caça ao Alvo (VisualSearchHunt):**
- [EvaluationReportPanel.tsx](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx): Painel principal de exibição do laudo Gemini.
- [VisualSearchEvaluationScreen.tsx](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationScreen.tsx): Tela completa de avaliação.
- [VisualSearchEvaluationContainer.tsx](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationContainer.tsx): Orquestrador de estado e navegação.

**Escuta Seletiva (SelectiveListening):**
- [SelectiveListeningReportPanel.tsx](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/divided/games/SelectiveListening/SelectiveListeningReportPanel.tsx): Painel de exibição do laudo.
- [SelectiveListeningResult.tsx](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/divided/games/SelectiveListening/SelectiveListeningResult.tsx): Gerenciador da tela final de resultados.

**Achar o Faltando (AcharOFaltando):**
- [AcharOFaltandoReportPanel.tsx](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/AcharOFaltando/AcharOFaltandoReportPanel.tsx): Exibição local das métricas calculadas (rodadas, acertos, omissões, falsos positivos e curva por rodada).
- [AcharOFaltandoEvaluationContainer.tsx](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/AcharOFaltando/AcharOFaltandoEvaluationContainer.tsx): Orquestrador local integrado ao Firestore (`sessionReports`).

---

## Fluxo de Persistência de Laudos

Para garantir que os laudos gerados pelo Gemini e as métricas de treino possam ser consultados retroativamente pelo profissional responsável, o Vigil implementa um fluxo estruturado de persistência em duas camadas:

### Camada 1 — Gravação Instantânea (Fallback)

Imediatamente após o cálculo das métricas locais e **antes** de chamar a IA, cada hook de avaliação (`use{Treino}Evaluation`) grava `score`, `level`, `game`, `attentionType` e `createdAt` diretamente no Firestore (coleção `sessions/{sessionId}`) com `{ merge: true }`. Isso garante que o histórico do paciente seja atualizado instantaneamente, mesmo que a IA falhe ou demore.

### Camada 2 — Persistência do Laudo Completo

Se o Gemini responde com sucesso, a função `saveReport()` executa:

```
[Laudo Gemini recebido]
        │
        ▼
[reportToMarkdown(report, input)] (Formatação .md)
        │
        ▼
[Upload p/ Firebase Storage]
│  (laudos/${uid}/${sessionId}.md)
        ▼
[Obtenção de Download URL (reportUrl)]
        │
        ▼
[Merge no Firestore (sessions/{sessionId})]
│  (score, level, reportUrl, createdAt)
```

O laudo em Markdown fica armazenado no Firebase Storage sob o caminho `/laudos/{uid}/{sessionId}.md`, isolado por UID para conformidade com LGPD. O URL de download (`reportUrl`) é salvo no documento da sessão no Firestore.

> **Nota de privacidade:** O laudo armazenado no Firebase Storage é destinado exclusivamente ao acesso pelo profissional responsável (via Firebase Console ou painel administrativo futuro). O paciente/UX **não possui** botão de download nem acesso direto ao arquivo — ele visualiza apenas o laudo renderizado na interface do Artefato 4.

---

## Diretrizes de Avaliação — Camadas Lúdica e Clínica

O laudo emitido pela inteligência artificial segue uma estrutura de **Camada Dupla** que atende simultaneamente às necessidades motivacionais do paciente e às demandas técnicas do terapeuta:

### 🎮 Camada Lúdica (Gamificada / Leigo)
* **Público-Alvo**: O próprio usuário/jogador do Vigil.
* **Objetivo**: Reforçar o engajamento, incentivar a continuidade das sessões e evitar sentimentos de frustração.
* **Linguagem**: Extremamente simples, encorajadora, amigável e desprovida de jargões técnicos de saúde.
* **Elementos**: Classificação por score gamificado (0 a 100), medalhas ou emojis (ex: 🦊, 🦅), indicação de nível de jogo e mensagens de progresso motivacionais.

### 🏥 Camada Clínica (Técnica / Profissional)
* **Público-Alvo**: O neuropsicólogo, psicólogo ou profissional de reabilitação responsável pelo acompanhamento.
* **Objetivo**: Oferecer insumos objetivos detalhando o funcionamento de subcomponentes da atenção.
* **Linguagem**: Formal, científica, baseada em evidências numéricas coletadas durante a execução.
* **Métricas Detalhadas**:
  - *Precisão Serial (Ordem Exata)* e *Precisão de Itens*.
  - *Custo de Carga Cognitiva (Load Cost)*: Comparação de performance conforme a tarefa exige maior memória operacional ou intercalação de atividades secundárias (ex: Paradigma TBRS no Cofre Mental).
  - *Filtragem de Distratores / Taxa de Intrusão*: Capacidade de ignorar estímulos concorrentes (ex: escuta dicótica na Escuta Seletiva).
  - *Latência de Resposta*: Tempo médio de reação (ms) e flutuações de velocidade.

---

## Conformidade com as Normas do CFP (Conselho Federal de Psicologia)

Como a regulamentação do CFP (ex: Resoluções sobre Avaliação Psicológica) reserva o uso de **testes psicológicos clínicos diagnósticos** exclusivamente a psicólogos habilitados utilizando instrumentos aprovados pelo SATEPSI, o Vigil incorpora salvaguardas arquiteturais críticas:

1. **Definição de Escopo**: A plataforma Vigil é arquitetada e declarada estritamente como um **instrumento de treinamento, reabilitação e estimulação cognitiva**, não possuindo o status de teste psicológico ou diagnóstico neuropsicológico.
2. **Restrições de Prompting no Gemini**:
   - **Proibição Absoluta de Diagnósticos**: As instruções nos prompts enviados ao Gemini (ex: [divided.ts](file:///Users/felipedenuzzo/VIGIL/vigil/vigil-evaluator/src/prompts/divided.ts)) proíbem explicitamente o modelo de concluir, sugerir ou fechar diagnósticos específicos de transtornos clínicos ou de aprendizagem (ex: TDAH, DPAC, TEA).
   - **Aviso Legal e Recomendação**: O campo `clinicalRecommendation` deve incluir obrigatoriamente um alerta afirmando que as informações contidas no laudo são resultantes de um treino cognitivo virtual e não substituem exames especializados ou avaliações clínicas formais, direcionando o profissional a prosseguir com avaliações padronizadas e profissionais credenciados caso note discrepâncias importantes.
   - **Foco Funcional**: As notas clínicas emitidas focam no desempenho da tarefa e na descrição de subfunções cognitivas específicas (ex: "dificuldade de inibição de estímulo sonoro lateral"), sem rotular o paciente.
3. **Privacidade e Isolamento (LGPD)**: Todo o armazenamento de sessões e laudos é protegido com regras de segurança rígidas isoladas pelo `uid` do usuário autenticado no Firestore e no Firebase Storage, impedindo o acesso não autorizado a dados sensíveis de desempenho cognitivo.

---

## Fluxo de Simulação de Jogo Pré-Treino (Onboarding)

Para neutralizar variáveis que possam distorcer as métricas cognitivas reais do usuário — como ansiedade, desconforto com a interface ou dúvidas na mecânica do jogo —, todos os treinos do Vigil devem implementar um fluxo de onboarding em fases:

```
[Telas de Instruções] ──> [Fase de Simulação] ──> [Checagem Técnica] ──> [Treino Oficial]
(Explicação do Jogo)       (Jogo Simplificado)     (Fones de Ouvido)        (Métricas Gravadas)
```

1. **Fase de Instruções**: Explicação inicial com ilustrações visuais simples demonstrando o objetivo do treino (ex: [SelectiveListeningInstructions.tsx](file:///Users/felipedenuzzo/VIGIL/vigil/src/attentions/divided/games/SelectiveListening/SelectiveListeningInstructions.tsx)).
2. **Fase de Simulação (Tutorial Interativo)**:
   - Apresentação de uma partida reduzida de exemplo (ex: [SelectiveListeningSimulation.tsx](file:///Users/felipedenuzzo/VIGIL/vigil/src/attentions/divided/games/SelectiveListening/SelectiveListeningSimulation.tsx)).
   - O usuário joga uma versão simplificada sem limite de tempo punitivo, recebendo feedback imediato na tela após responder (ex: indicando se ouviu o canal correto e exibindo quais eras as respostas esperadas).
   - **Isolamento de Dados**: Os dados e erros cometidos durante a simulação **não são computados** nas estatísticas clínicas finais e **não são enviados** ao Firestore/Gemini.
3. **Checagem Técnica (On-Demand)**: Verificação e calibração de hardware necessária antes de começar (ex: confirmação visual e auditiva do uso de fones de ouvido estéreo).
4. **Treino Real**: O jogo entra na fase oficial de processamento de dados (`playing`), iniciando os logs brutos que posteriormente passarão pelo cálculo do avaliador interno.

---

## Regras Gerais do Pipeline

1. **O treino não sabe que existe avaliação** — ele só registra eventos.
2. **O avaliador interno não sabe que existe Gemini** — ele só calcula e monta o log.
3. **O Gemini não calcula nada** — ele só redige o texto psicológico/clínico e gamificado. Cálculos matemáticos pesados (como Custos de Dupla-Tarefa, Custos de Alternância ou interpolações de 0 a 100) devem ser processados no Backend (`vigil-evaluator`) antes de injetar os números no Payload do prompt.
4. **O componente de apresentação não interpreta nada** — ele só exibe o JSON recebido.
5. **Cada treino tem seu próprio avaliador interno** — as métricas são específicas de cada treino.
6. **Cada tipo de atenção tem um único prompt do Gemini** — compartilhado por todos os treinos daquele tipo.
7. **As diretrizes científicas** (faixas de normalidade, valores de corte) ficam exclusivamente no Artefato 2, codificadas com base em artigos científicos definidos pelo responsável do produto.
8. **O avaliador determinístico** (`vigil-evaluator/src/evaluators/visualSearch.ts`) está preservado e não deve ser removido — serve como fallback e referência futura.

---

## Mapa de Novos Artefatos a Criar

| Artefato | O que criar | Onde | Status |
|---|---|---|---|
| Prompts separados | `src/prompts/` com 1 arquivo por tipo de atenção | `vigil-evaluator` | ✅ Estrutura criada |
| Avaliador interno | Uma pasta `src/assessment/{treino}/` com os 6 arquivos obrigatórios para cada novo treino | `vigil` | 🔲 Criar ao iniciar novo treino |
| Schema expandido | Atualizar `EvaluationReport` com camadas geral + clínica + feedback lúdico | `vigil-evaluator/src/types.ts` | 🔲 Aguarda definição de produto |
| Componente atualizado | Atualizar `EvaluationReportPanel.tsx` para o novo schema | `vigil` | 🔲 Depende do schema expandido |

---

## Infraestrutura (referência rápida)

| Serviço | Função | Documentação |
|---|---|---|
| Cloud Run | Hospeda o vigil-evaluator | [PROVISION.md](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/PROVISION.md) |
| Vertex AI / Gemini 2.5 Flash | Gera o texto do laudo | [GEMINI.md](https://github.com/FelipeDenuzzo/vigil/blob/main/vigil-evaluator/GEMINI.md) |
| Vercel | Hospeda o frontend vigil | [vercel.json](https://github.com/FelipeDenuzzo/vigil/blob/main/vercel.json) |
| GitHub Actions | CI/CD automático | `.github/` em ambos os repositórios |

---

## Aprendizados Arquiteturais

> Esta seção registra riscos e armadilhas identificados em sessões reais de desenvolvimento. São princípios transversais — aplicáveis a qualquer treino ou artefato futuro, independentemente do código envolvido.

---

### 1 — Métricas sem diretriz científica não devem existir

Campos foram adicionados ao pipeline sem respaldo em artigos ou definição do responsável do produto. A existência do campo implica que ele será calculado, enviado, interpretado e exibido — gerando uma cadeia de dependências sobre algo que não tem base real.

**Regra:** antes de criar qualquer métrica, a diretriz científica precisa existir primeiro. Campo sem diretriz = campo proibido.

---

### 2 — Duplicação de responsabilidade cria divergência silenciosa

Havia dois lugares calculando a mesma coisa. Como o pipeline só usa um deles, o outro existia sem efeito — mas ambos podiam divergir silenciosamente sem gerar erro.

**Regra:** cada cálculo deve ter exatamente um dono. Duplicação de lógica é dívida técnica disfarçada de redundância.

---

### 3 — O contrato entre frontend e backend é um artefato de arquitetura, não detalhe de implementação

Quando o contrato entre sistemas diverge, o sistema falha silenciosamente — campos são ignorados, dados chegam zerados — em vez de falhar com erro detectável.

**Regra:** o contrato de comunicação entre sistemas deve ser definido e validado como parte da arquitetura, não descoberto na integração.

---

### 4 — Um servidor compartilhado precisa de roteamento explícito por domínio

Quando um servidor cresce para atender múltiplos tipos de dado sem roteamento explícito, o segundo caso de uso herda as regras de validação e interpretação do primeiro.

**Regra:** ao adicionar um segundo tipo de dado a um servidor existente, a primeira pergunta deve ser: o que muda no contrato, na validação e na interpretação?

---

### 5 — A camada de apresentação revela o que falta na camada de geração

O painel de exibição esperava dados em duas camadas (leigo e técnico), mas a camada de geração entregava dados planos duplicados para preencher os dois blocos. O resultado era linguagem técnica onde deveria haver linguagem acessível.

**Regra:** a interface de apresentação é um espelho do contrato de dados. Se ela renderiza mal, o problema está upstream na geração, não na exibição.

---

### 6 — Linguagem técnica e linguagem para leigos são produtos diferentes, não formatos diferentes

Não basta reformatar o mesmo conteúdo para públicos diferentes. Um resumo para o usuário e uma nota clínica para o profissional exigem instruções de geração distintas, campos distintos e revisão distinta.

**Regra:** tratar as duas camadas como o mesmo dado com formatação diferente garante que nenhuma das duas será adequada.

---

### 7 — A arquitetura documentada é o checklist de conformidade

Os problemas encontrados em sessões de desenvolvimento eram exatamente os pontos que a arquitetura marcava como pendentes ou em risco.

**Regra:** a documentação arquitetural não é histórico — é o checklist de conformidade de cada novo artefato criado. Consultá-la antes de começar é obrigatório.

---

### 8 — Campos opcionais sem uso ativo são ruído com custo

Campos declarados como opcionais, nunca enviados e nunca lidos pelo receptor existem apenas como confusão — quem lê o contrato não sabe se eles deveriam estar presentes ou não.

**Regra:** todo campo opcional deve ter uma justificativa de quando e por quem é preenchido. Sem essa justificativa, deve ser removido.

---

### 9 — Código gerado por analogia com outro contexto é o risco mais difícil de detectar

Este é o risco mais grave e mais silencioso do pipeline. Campos e cálculos foram criados **por analogia com outro treino** — estruturas que faziam sentido em um contexto foram transportadas para outro porque "pareciam equivalentes". O problema não gera erro de compilação, não quebra testes e os dados aparecem preenchidos. A inconsistência só é detectável por quem conhece a teoria por trás de cada treino.

Isso é diferente de inventar código aleatório — é mais perigoso porque tem aparência de legitimidade. A estrutura é coerente, os nomes fazem sentido, os valores são calculados. Mas a **semântica está errada** porque o conceito não pertence àquele domínio.

**Regra:** antes de criar um campo ou cálculo em um novo treino, a pergunta não é *"existe algo parecido em outro treino?"* — a pergunta é *"existe uma diretriz científica específica para este treino que justifica este campo?"*. Analogia com outro contexto é ponto de partida para investigação, nunca para implementação direta.

---

### 10 — Escapes Unicode em arquivos TSX/JSX devem ser caracteres literais, não sequências de escape

Em arquivos `.tsx` e `.jsx`, strings que contêm sequências de escape Unicode no formato `\uXXXX` (ex: `\u00e7`, `\uD83C\uDFAF`) dentro de literais JSX **não são interpretadas pelo parser** — elas aparecem literalmente na tela para o usuário como texto bruto (`Ca\u00e7a ao Alvo`, `\uD83C\uDFAF`).

Isso ocorre quando o código é gerado ou editado por ferramentas que produzem escapes JavaScript em vez de salvar o caractere UTF-8 diretamente no arquivo.

**Exemplos do problema:**

```tsx
// ❌ ERRADO — aparece literal na tela
<h2>Ca\u00e7a ao Alvo</h2>
<div>\uD83C\uDFAF</div>
<p>Voc\u00ea ver\u00e1 uma grade...</p>
```

```tsx
// ✅ CORRETO — caractere UTF-8 direto no arquivo
<h2>Caça ao Alvo</h2>
<div>🎯</div>
<p>Você verá uma grade...</p>
```

O problema se manifesta principalmente em emojis e caracteres acentuados do português (ç, ã, é, ê, í, ó, ú) quando o arquivo é gerado ou modificado por agentes de IA ou ferramentas que serializam strings com escapes.

**Regra:** todo arquivo `.tsx` e `.jsx` deve conter **caracteres UTF-8 literais** — nunca sequências `\uXXXX` dentro de JSX. Ao revisar código gerado automaticamente, verificar se os textos visíveis ao usuário estão em UTF-8 direto antes de fazer commit.

---

## Design System / UI Guidelines

### Regras de Texto e Cores

- **Nunca usar cores sutis para textos informativos.** Todo texto que não seja decorativo ou placeholder deve usar `color: rgb(232,233,240)` (`--color-text-primary`) ou a cor da categoria de atenção correspondente.
- Textos com opacidade reduzida (ex: `rgba(255,255,255,0.4)`) são reservados apenas para labels secundários de métricas ou timestamps.
- Disclaimers e avisos legais seguem a mesma regra: cor primária, nunca cor sutil.

### Padronização Visual de Hubs e Menus

Para garantir consistência na navegação e apresentação de cada modalidade de atenção, todas as telas principais (Hubs) devem adotar a seguinte estrutura de cabeçalho, **seguindo o modelo visual do Hub de Atenção Sustentada**:

1. **Alinhamento e Contêiner:** O Botão de Retorno, o Título e a Descrição devem estar agrupados e alinhados à esquerda dentro de um bloco de conteúdo centralizado na tela. O botão de voltar **não** deve ficar solto no canto superior esquerdo da tela inteira.
2. **Botão de Retorno:** Posicionado imediatamente acima do título da atenção. Botão transparente, sem bordas, com texto "← Voltar" na cor branca.
   - *Padrão:* `<button style="display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); background: transparent; border: none; color: rgb(255, 255, 255); margin-bottom: var(--space-4); padding: 0; cursor: pointer; font-size: var(--text-base);">← Voltar</button>`
3. **Título da Atenção:** Título principal (`<h1>`) utilizando a variável de cor da respectiva categoria de atenção.
   - *Padrão:* `<h1 style="font-size: var(--text-2xl); color: var(--color-{categoria});">Atenção {Categoria}</h1>`
4. **Descrição da Modalidade:** Breve parágrafo explicativo logo abaixo do título, na cor branca.
   - *Padrão:* `<p style="color: rgb(255, 255, 255); margin-top: var(--space-2);">Esta modalidade treina sua capacidade de...</p>`
5. **Prevenção de Duplicidade (Jogos Embutidos no Hub):** Se o treino for renderizado dentro da própria tela do Hub (sem navegar para uma rota de tela cheia separada), eventuais botões de "Voltar" internos do componente do jogo devem ser ocultados/retirados. A ação de sair do jogo embutido deve ser delegada exclusivamente ao Botão de Retorno do Hub (que fica do lado de fora) para evitar que a tela fique com botões de voltar duplicados.

### Ortografia, Gramática e Legibilidade

- É obrigatória a revisão ortográfica e gramatical cuidadosa de todos os textos apresentados ao usuário.
- Nas telas de introdução e instruções dos treinos, deve-se usar estrategicamente quebras de linha (tags `<br />` ou múltiplos parágrafos) para criar espaçamento. **Não apresentar blocos densos de texto** que dificultem a leitura.

### Navegação e Botões de Ação nos Treinos (Laudos)

- **Desacoplamento de Rotas (onRepeat / onClose):** Componentes de avaliação (Ex: `InsetosEvaluationContainer`, `ColorShapeEvaluationContainer`) **não devem** invocar navegações estáticas diretas (como `useNavigate('/treinar/alternada')`) em seus botões de conclusão.
- A responsabilidade de encerrar ou reiniciar o fluxo pertence ao componente orquestrador (`Hub` ou `Play`).
- O botão **"Repetir o treino"** deve invocar uma prop `onRepeat` enviada pelo pai, permitindo que a sessão recomece localmente (reset de estado) sem redirecionamento abrupto de rota.
- O botão **"Voltar ao início"** (ou "Voltar") deve invocar uma prop `onClose` ou `onBack` enviada pelo pai, que fará o unmount do jogo e exibirá novamente os cards de seleção no respectivo Hub.

---

### Checklist de conformidade — aplicar antes de criar qualquer novo artefato

- [ ] A métrica tem diretriz científica aprovada pelo responsável do produto?
- [ ] Existe exatamente um lugar calculando cada coisa?
- [ ] O contrato de entrada e saída está explicitamente definido?
- [ ] O servidor sabe diferenciar este caso dos outros que já atende?
- [ ] A camada de geração produz dados distintos para públicos distintos (leigo vs. clínico)?
- [ ] Os campos opcionais têm dono e condição de preenchimento definidos?
- [ ] A arquitetura documentada foi consultada antes de começar?
- [ ] Cada campo novo foi justificado por diretriz científica própria deste treino — não por analogia com outro?
- [ ] Os textos visíveis ao usuário em arquivos `.tsx`/`.jsx` estão em UTF-8 literal — sem sequências `\uXXXX`?
