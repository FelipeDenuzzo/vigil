#!/usr/bin/env bash
# scripts/cloudrun-secrets-check.sh
# Verifica e instrui sobre variáveis de ambiente e segredos requeridos no Cloud Run (GCP).

set -euo pipefail

# Configurações de cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem Cor

echo -e "${BLUE}=== Vigil: Verificação de Variáveis e Segredos do Cloud Run ===${NC}\n"

# 1. Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}Aviso: Google Cloud SDK (comando 'gcloud') não está instalado ou no PATH.${NC}"
    echo -e "Você precisará conferir as variáveis e segredos manualmente no console do GCP."
    echo -e "Visite: https://console.cloud.google.com/run"
    exit 0
fi

# 2. Obter informações de login ativo
ACTIVE_ACCOUNT=$(gcloud config get-value account 2>/dev/null || echo "")
ACTIVE_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

if [ -z "$ACTIVE_ACCOUNT" ] || [ -z "$ACTIVE_PROJECT" ]; then
    echo -e "${YELLOW}Aviso: GCP CLI não está totalmente configurada (conta ou projeto padrão não selecionados).${NC}"
    echo -e "Faça login com: ${BLUE}gcloud auth login${NC}"
    echo -e "E selecione o projeto com: ${BLUE}gcloud config set project <ID_DO_PROJETO>${NC}\n"
fi

# 3. Mostrar especificações de variáveis e segredos recomendados
echo -e "${BLUE}Variáveis e Segredos requeridos para o backend (vigil-evaluator):${NC}"

echo -e "\n--- 1. SEGREDOS RECOMENDADOS (Secret Manager) ---"
echo -e "Esses valores são confidenciais e devem ser armazenados de forma criptografada:"
echo -e "  - ${RED}GEMINI_API_KEY${NC}: Chave privada de acesso à API do Gemini (se usada de forma independente)."
echo -e "  - ${RED}EVALUATOR_SECRET${NC}: Hash SHA256 estática para autenticar requisições do frontend."

echo -e "\n  ${BLUE}Comandos gcloud para criar segredos:${NC}"
echo -e "  ${YELLOW}# Criar segredos no Secret Manager:${NC}"
echo -e "  gcloud secrets create GEMINI_API_KEY --replication-policy=\"automatic\" --project=\"$ACTIVE_PROJECT\""
echo -e "  gcloud secrets create EVALUATOR_SECRET --replication-policy=\"automatic\" --project=\"$ACTIVE_PROJECT\""
echo -e "  ${YELLOW}# Adicionar os valores reais aos segredos:${NC}"
echo -e "  echo -n \"sua_gemini_key\" | gcloud secrets versions add GEMINI_API_KEY --data-file=- --project=\"$ACTIVE_PROJECT\""
echo -e "  echo -n \"seu_evaluator_secret\" | gcloud secrets versions add EVALUATOR_SECRET --data-file=- --project=\"$ACTIVE_PROJECT\""

echo -e "\n--- 2. VARIÁVEIS DE AMBIENTE DIRETAS (Cloud Run Env) ---"
echo -e "Valores públicos ou de infraestrutura que podem ser expostos na configuração do container:"
echo -e "  - ${GREEN}GCP_PROJECT_ID${NC}: ID do projeto no Google Cloud."
echo -e "  - ${GREEN}GCP_REGION${NC}: Região de deploy (ex: southamerica-east1)."
echo -e "  - ${GREEN}GEMINI_MODEL${NC}: Modelo Gemini selecionado (default: gemini-2.5-flash)."
echo -e "  - ${GREEN}PORT${NC}: Porta de escuta do servidor (padrão: 8080)."

echo -e "\n--- 3. PERMISSÕES DA CONTA DE SERVIÇO (IAM) ---"
echo -e "A conta de serviço do Cloud Run precisa de acesso para ler os segredos e chamar a Vertex AI."
echo -e "Associe as seguintes roles no console do IAM:"
echo -e "  - ${BLUE}Secret Manager Secret Accessor${NC} (roles/secretmanager.secretAccessor)"
echo -e "  - ${BLUE}Vertex AI User${NC} (roles/aiplatform.user)"

echo -e "\n${GREEN}Dica: O fluxo do GitHub Actions está configurado no arquivo '.github/workflows/deploy-evaluator.yml' e já injeta essas variáveis automaticamente no build!${NC}"
