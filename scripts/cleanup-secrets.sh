#!/usr/bin/env bash
# scripts/cleanup-secrets.sh
# Script para auditoria e limpeza de segredos no histórico do Git e arquivos locais.

set -euo pipefail

# Configurações de cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem Cor

echo -e "${BLUE}=== Vigil: Auditoria e Limpeza de Segredos ===${NC}"

# 1. Verificar dependências necessárias
echo -e "\n${BLUE}[1/5] Verificando dependências...${NC}"
DEPENDENCIES=("git" "trufflehog" "git-filter-repo")
MISSING=0

for dep in "${DEPENDENCIES[@]}"; do
    if ! command -v "$dep" &> /dev/null; then
        echo -e "${RED}Erro: '$dep' não está instalado ou não está no PATH.${NC}"
        case "$dep" in
            "trufflehog")
                echo -e "  -> Instale usando: brew install trufflehog (macOS) ou visite https://github.com/trufflesecurity/trufflehog"
                ;;
            "git-filter-repo")
                echo -e "  -> Instale usando: brew install git-filter-repo (macOS) ou pip install git-filter-repo"
                ;;
        esac
        MISSING=1
    else
        echo -e "  - $dep: ${GREEN}Instalado${NC}"
    fi
done

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}\nPor favor, instale as dependências ausentes antes de continuar.${NC}"
    exit 1
fi

# 2. Executar scan inicial de segurança
echo -e "\n${BLUE}[2/5] Rodando TruffleHog para buscar segredos existentes...${NC}"
echo "Escaneando diretório local e histórico do Git..."

# Rodar scan no repositório local
if trufflehog git file://. --only-verified 2>/dev/null; then
    echo -e "${YELLOW}Aviso: TruffleHog completou o escaneamento do histórico do Git.${NC}"
else
    echo -e "${YELLOW}Aviso: TruffleHog falhou ou encontrou problemas ao ler o histórico Git local.${NC}"
fi

# 3. Validar se o usuário pediu confirmação do rewrite destrutivo
CONFIRM=0
for arg in "$@"; do
    if [ "$arg" == "--confirm" ]; then
        CONFIRM=1
    fi
done

if [ $CONFIRM -eq 0 ]; then
    echo -e "\n${YELLOW}=== MODO DE APENAS LEITURA (DRY-RUN) ===${NC}"
    echo -e "Para reescrever o histórico do Git e limpar segredos permanentemente,"
    echo -e "você deve rodar este script passando a flag ${GREEN}--confirm${NC}:"
    echo -e "  $0 --confirm"
    exit 0
fi

# 4. Iniciar processo de limpeza estrutural
echo -e "\n${BLUE}[3/5] Iniciando limpeza permanente do histórico...${NC}"

# Criar um clone espelho (mirror clone) de segurança em um diretório temporário
REPO_DIR=$(pwd)
TEMP_CLONE_DIR=$(mktemp -d -t vigil-mirror-XXXXXX)
echo -e "Criando clone de backup em: ${YELLOW}$TEMP_CLONE_DIR${NC}"
git clone --mirror "$REPO_DIR" "$TEMP_CLONE_DIR"

# Entrar no clone de backup para fazer a reescrita destrutiva com segurança
cd "$TEMP_CLONE_DIR"

# Definir arquivos sensíveis a remover do histórico
SENSIBLE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    ".env.development"
    "*.json-chave"
    "*key.json"
    "gha-creds-*.json"
)

echo "Removendo arquivos sensíveis de todo o histórico do Git..."
for file in "${SENSIBLE_FILES[@]}"; do
    echo -e "  Removendo: ${YELLOW}$file${NC}"
    # Evita erros se o padrão não existir no histórico
    git-filter-repo --path "$file" --invert-paths --force || true
done

# Criar arquivo de substituição de strings (redact de segredos conhecidos)
REPLACEMENTS_FILE=$(mktemp)
# Lista de substituições de segredos detectados (adicionar novos conforme necessário)
cat << 'EOF' > "$REPLACEMENTS_FILE"
81767ae368c4b12d82ae3046208668f470c4b75bfb906d72eb191f2a31011fb2==>[REDACTED_EVALUATOR_SECRET]
AIzaSyCyyIXR6VNwChgZxl7B1bLLLuu4LOAkwTE==>[REDACTED_FIREBASE_API_KEY]
EOF

echo "Substituindo segredos em arquivos de texto de todo o histórico..."
git-filter-repo --replace-text "$REPLACEMENTS_FILE" --force || true
rm -f "$REPLACEMENTS_FILE"

# 5. Validação final pós-limpeza
echo -e "\n${BLUE}[4/5] Validando a limpeza do repositório temporário...${NC}"
echo "Verificando se ainda existem segredos conhecidos..."

if grep -rn "81767ae368c4b12d82ae3046208668f470c4b75bfb906d72eb191f2a31011fb2" . &>/dev/null; then
    echo -e "${RED}Erro: O segredo ainda está presente em algum arquivo!${NC}"
else
    echo -e "${GREEN}Sucesso: Segredo principal não encontrado nos arquivos.${NC}"
fi

# Voltar para o repositório original
cd "$REPO_DIR"

echo -e "\n${BLUE}[5/5] Conclusão da limpeza do histórico${NC}"
echo -e "${YELLOW}O repositório de backup limpo foi criado em: $TEMP_CLONE_DIR${NC}"
echo -e "Para aplicar essas alterações ao seu repositório ativo e enviá-lo ao GitHub público:"
echo -e "1. Verifique se o clone em $TEMP_CLONE_DIR está correto."
echo -e "2. Substitua o repositório original por este backup limpo."
echo -e "3. Adicione o remote do GitHub público: git remote add origin <url-repo-publico>"
echo -e "4. Faça o push forçado dos ramos limpos: git push origin --force --all"
echo -e "${RED}IMPORTANTE: NUNCA faça push direto no repositório de produção atual sem revisar o backup!${NC}"
