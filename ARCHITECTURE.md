# Diretriz de Arquitetura — Pipeline de Avaliação do Vigil

**Repositórios:** [vigil](https://github.com/FelipeDenuzzo/vigil) · [vigil-evaluator](https://github.com/FelipeDenuzzo/vigil-evaluator)  
**Data:** 19 de junho de 2026  
**Status:** Diretriz aprovada — referência para toda construção futura de avaliação

---

## Visão Geral

O pipeline de avaliação do Vigil é composto por **4 artefatos com responsabilidades independentes**. Nenhum artefato conhece os detalhes internos do outro. Modificações em um não devem afetar os demais.

O treino de referência ativo é o **VisualSearchHunt** (Caça ao Alvo), único treino em produção no momento. Toda nova avaliação deve seguir o mesmo padrão estabelecido por ele.

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

**Treino de referência ativo:**

| Nome do arquivo | Localização |
|---|---|
| `VisualSearchHunt.tsx` | `src/attentions/selective/games/VisualSearchHunt/` |

**Estrutura de pastas por tipo de atenção (já existem no repositório):**

| Tipo | Pasta |
|---|---|
| Seletiva | `src/attentions/selective/` |
| Sustentada | `src/attentions/sustained/` |
| Alternada | `src/attentions/alternating/` |
| Dividida | `src/attentions/divided/` |

**Regra:** cada novo treino criado fica dentro da pasta `games/` do seu tipo de atenção, seguindo o mesmo padrão de `VisualSearchHunt`.

---

## Artefato 2 — Avaliador Interno do Treino

**Responsabilidade:** receber os eventos brutos do treino, adaptar, aplicar as diretrizes científicas, calcular métricas, determinar severity e montar o log estruturado para o Gemini.

**Regra crítica:** as diretrizes científicas (faixas de normalidade, valores de corte, padrões interpretativos) são definidas pelo responsável do produto com base em artigos científicos e codificadas aqui. O Gemini não decide nada sobre métricas — ele só recebe o resultado.

**Localização padrão:**
```
src/assessment/{nomeDotreino}/
```

### Arquivos obrigatórios por treino

Cada pasta `src/assessment/{nomeDotreino}/` deve conter **exatamente** estes arquivos, com os nomes adaptados ao treino:

| Arquivo | Responsabilidade |
|---|---|
| `adaptSessionTo{NomeDoTreino}.ts` | Adapta os dados brutos da sessão para o formato interno do avaliador |
| `calculate{NomeDoTreino}Metrics.ts` | Calcula as métricas específicas do treino (ex: errorProfile, spatialProfile, tempos) |
| `{nomeDotreino}ScaleDefinitions.ts` | Define as faixas científicas de normalidade e valores de corte — preenchido pelo responsável do produto com base em artigos |
| `build{NomeDoTreino}ScaleResult.ts` | Aplica as faixas e determina `severity` e `score` |
| `build{NomeDoTreino}TechnicalReport.ts` | Monta o log estruturado (`EvaluatorInput`) pronto para enviar ao Gemini |
| `types.ts` | Tipos e interfaces específicos do treino |

### Referência existente — VisualSearchHunt

| Arquivo | Link |
|---|---|
| `adaptSessionToRoundClicks.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/adaptSessionToRoundClicks.ts) |
| `calculateVisualSearchMetrics.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/calculateVisualSearchMetrics.ts) |
| `visualSearchScaleDefinitions.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/visualSearchScaleDefinitions.ts) |
| `buildVisualSearchScaleResult.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/buildVisualSearchScaleResult.ts) |
| `buildVisualSearchTechnicalReport.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/buildVisualSearchTechnicalReport.ts) |
| `types.ts` | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/assessment/visualSearch/types.ts) |

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
| `src/evaluate.ts` | Orquestrador: seleciona o prompt por `attentionType`, chama o Gemini, valida o retorno | [ver](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/src/evaluate.ts) |
| `src/evaluators/visualSearch.ts` | Avaliador determinístico preservado — não usar em produção por ora | [ver](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/src/evaluators/visualSearch.ts) |
| `src/types.ts` | Interfaces `EvaluatorInput` e `EvaluationReport` | [ver](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/src/types.ts) |

**Prompts por tipo de atenção — `vigil-evaluator/src/prompts/`:**

| Arquivo | Status | Link |
|---|---|---|
| `selective.ts` | ✅ Implementado | [ver](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/src/prompts/selective.ts) |
| `sustained.ts` | 🔲 Esqueleto — a preencher | [ver](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/src/prompts/sustained.ts) |
| `alternating.ts` | 🔲 Esqueleto — a preencher | [ver](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/src/prompts/alternating.ts) |
| `divided.ts` | 🔲 Esqueleto — a preencher | [ver](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/src/prompts/divided.ts) |

**Regra de expansão:** ao criar o prompt de um novo tipo de atenção, adicionar o `case` correspondente na função `resolvePromptAndSchema()` dentro de `src/evaluate.ts`.

---

## Artefato 4 — Componente de Apresentação

**Responsabilidade:** receber o JSON do laudo retornado pelo Gemini e exibi-lo ao usuário de forma visual. Não faz nenhum cálculo.

**Arquivos de referência existentes (VisualSearchHunt):**

| Arquivo | Responsabilidade | Link |
|---|---|---|
| `EvaluationReportPanel.tsx` | Painel principal de exibição do laudo | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/EvaluationReportPanel.tsx) |
| `VisualSearchEvaluationScreen.tsx` | Tela completa de avaliação | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationScreen.tsx) |
| `VisualSearchEvaluationContainer.tsx` | Container que gerencia estado e navegação da tela de avaliação | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationContainer.tsx) |
| `EagleScale.tsx` | Componente visual de escala/score | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/EagleScale.tsx) |
| `EvaluationLoadingAnimation.tsx` | Animação de carregamento enquanto aguarda o Gemini | [ver](https://github.com/FelipeDenuzzo/vigil/blob/main/src/attentions/selective/games/VisualSearchHunt/EvaluationLoadingAnimation.tsx) |

**Nota:** o `EvaluationReportPanel.tsx` precisará ser atualizado quando o schema do laudo for expandido para incluir as duas camadas (geral + clínica) e o feedback lúdico.

---

## Regras Gerais do Pipeline

1. **O treino não sabe que existe avaliação** — ele só registra eventos.
2. **O avaliador interno não sabe que existe Gemini** — ele só calcula e monta o log.
3. **O Gemini não calcula nada** — ele só redige o texto psicológico/clínico.
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
| Cloud Run | Hospeda o vigil-evaluator | [PROVISION.md](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/PROVISION.md) |
| Vertex AI / Gemini 2.5 Flash | Gera o texto do laudo | [GEMINI.md](https://github.com/FelipeDenuzzo/vigil-evaluator/blob/main/GEMINI.md) |
| Vercel | Hospeda o frontend vigil | [vercel.json](https://github.com/FelipeDenuzzo/vigil/blob/main/vercel.json) |
| GitHub Actions | CI/CD automático | `.github/` em ambos os repositórios |
