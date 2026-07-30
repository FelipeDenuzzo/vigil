#!/usr/bin/env bash
# scripts/vercel-env-check.sh
# Verifica se as variáveis de ambiente obrigatórias para o frontend estão configuradas na Vercel.

set -euo pipefail

# Configurações de cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem Cor

REQUIRED_VARS=(
    "VITE_EVALUATOR_URL"
    "VITE_EVALUATOR_SECRET"
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
)

echo -e "${BLUE}=== Vigil: Verificação de Variáveis de Ambiente na Vercel ===${NC}\n"

# 1. Verificar se a CLI da Vercel está disponível
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Aviso: A Vercel CLI (comando 'vercel') não está instalada ou logada.${NC}"
    echo -e "Você precisará conferir as variáveis manualmente no painel da Vercel (https://vercel.com)."
    echo -e "\nLista de variáveis obrigatórias para cadastrar nas configurações do projeto (Environment Variables):"
    for var in "${REQUIRED_VARS[@]}"; do
        echo -e "  - ${YELLOW}$var${NC}"
    done
    exit 0
fi

# 2. Verificar se o projeto está vinculado localmente
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}Aviso: O projeto local ainda não está vinculado a um projeto da Vercel (.vercel não encontrado).${NC}"
    echo -e "Execute o comando '${BLUE}vercel link${NC}' para vincular e poder listar as variáveis remotas."
    echo -e "\nLista de variáveis obrigatórias:"
    for var in "${REQUIRED_VARS[@]}"; do
        echo -e "  - ${YELLOW}$var${NC}"
    done
    exit 0
fi

# 3. Listar variáveis configuradas na Vercel e verificar ausências
echo -e "${BLUE}Buscando variáveis ativas no projeto da Vercel...${NC}"
REMOTE_VARS_RAW=$(vercel env ls 2>/dev/null || echo "")

if [ -z "$REMOTE_VARS_RAW" ]; then
    echo -e "${RED}Erro: Não foi possível obter as variáveis de ambiente da Vercel CLI. Você está logado?${NC}"
    echo -e "Tente rodar: ${BLUE}vercel login${NC} e depois repita este script."
    exit 1
fi

MISSING=0
echo -e "\n${BLUE}Verificação do status das variáveis obrigatórias:${NC}"
for var in "${REQUIRED_VARS[@]}"; do
    if echo "$REMOTE_VARS_RAW" | grep -q "$var"; then
        echo -e "  [${GREEN}OK${NC}] $var está configurada na Vercel."
    else
        echo -e "  [${RED}AUSENTE${NC}] $var NÃO foi encontrada no painel da Vercel."
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -gt 0 ]; then
    echo -e "\n${RED}Atenção: Existem $MISSING variáveis obrigatórias ausentes na Vercel.${NC}"
    echo -e "Adicione-as no painel da Vercel ou via CLI usando:"
    echo -e "  ${BLUE}vercel env add <NOME_DA_VARIAVEL>${NC}"
else
    echo -e "\n${GREEN}Excelente! Todas as variáveis obrigatórias de frontend estão configuradas na Vercel.${NC}"
fi
