#!/bin/bash
# ============================================================
# ADEGA SIGNAGE IPTV SaaS - Deploy Manual
# Execute no servidor onde o Docker estiver disponivel
# ============================================================

set -e

echo "=========================================="
echo "  Adega Signage IPTV SaaS - Deploy"
echo "=========================================="

REPO_URL="https://github.com/marcelmatias/adega-digital-signage.git"
DEPLOY_DIR="/opt/adega-signage"

# 1. Clonar repositorio
echo "[1/6] Clonando repositorio..."
if [ -d "$DEPLOY_DIR" ]; then
    cd "$DEPLOY_DIR"
    git pull origin master
else
    git clone "$REPO_URL" "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# 2. Configurar ambiente
echo "[2/6] Configurando ambiente..."
if [ ! -f .env ]; then
    cp .env.example .env
    JWT_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
    echo "  .env criado com JWT secrets"
fi

# 3. Iniciar servicos
echo "[3/6] Iniciando servicos Docker..."
docker compose -p adega-signage pull
docker compose -p adega-signage up -d

# Aguardar healthchecks
echo "  Aguardando healthchecks (30s)..."
sleep 15

# 4. Executar migrations
echo "[4/6] Executando migrations..."
docker compose -p adega-signage exec -T api npx prisma migrate deploy || {
    echo "  Erro. Tentando novamente em 10s..."
    sleep 10
    docker compose -p adega-signage exec -T api npx prisma migrate deploy
}

# 5. Executar seed
echo "[5/6] Executando seed..."
docker compose -p adega-signage exec -T api npx prisma db seed || true

# 6. Verificar status
echo "[6/6] Verificando servicos..."
docker compose -p adega-signage ps

echo ""
echo "=========================================="
echo "  DEPLOY CONCLUIDO!"
echo "=========================================="
echo ""
echo "  URLs locais:"
echo "  Cliente: http://localhost:3000"
echo "  Admin:   http://localhost:3001"
echo "  API:     http://localhost:4000/api/docs"
echo "  IPTV:    http://localhost:4001"
echo ""
echo "  Credenciais: admin@adegasignage.com / Admin@123456"
echo ""
echo "  Para configurar no Coolify UI:"
echo "  1. Acesse http://192.168.15.3:8000"
echo "  2. Projetos → AdegaTV → Production"
echo "  3. 'New Resource' → 'Docker Compose'"
echo "  4. Repositorio: marcelmatias/adega-digital-signage"
echo "  5. Branch: master, Path: /docker-compose.yml"
echo "  6. Apos criar, configure dominios e env vars"
echo "  7. Clique Deploy"
echo ""