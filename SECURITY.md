# Política de Segurança — Vigil

## Versões Suportadas

Atualmente fornecemos patches de segurança para:

| Versão | Suportada |
|---|---|
| main (latest) | ✅ |
| branches antigas | ❌ |

---

## Reportando uma Vulnerabilidade

**Por favor, NÃO abra uma issue pública para vulnerabilidades de segurança.**

Se você descobriu uma vulnerabilidade de segurança, reporte de forma responsável:

1. **Abra um [Security Advisory](https://github.com/FelipeDenuzzo/vigil/security/advisories/new)** diretamente no GitHub (mantém confidencialidade)
2. Inclua:
   - Descrição da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestão de correção (se tiver)

---

## O que constitui uma vulnerabilidade

- Exposição de dados de sessões ou laudos de usuários
- Bypass de autenticação Firebase
- Injeção de dados no Firestore via frontend
- Exposição de variáveis de ambiente / chaves de API
- Execução remota de código no `vigil-evaluator`

---

## Tempo de Resposta

| Severidade | Tempo de resposta inicial | Tempo para patch |
|---|---|---|
| Crítico | 24h | 72h |
| Alto | 48h | 7 dias |
| Médio | 7 dias | 30 dias |
| Baixo | 14 dias | Próximo release |

---

## Boas Práticas do Projeto

- Chaves de API nunca são comitadas (`.env` no `.gitignore`)
- Regras do Firestore restringem leitura/escrita por `uid` autenticado
- O `vigil-evaluator` valida o token Firebase antes de chamar o Gemini
- Variáveis de ambiente de produção ficam apenas no painel da Vercel
