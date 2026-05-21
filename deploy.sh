#!/bin/bash
# ============================================================
# DEPLOY MANUAL - Execute no servidor caso o Coolify UI
# ou API não estejam disponíveis
# ============================================================

set -e

echo "=========================================="
echo "  Adega Signage - Deploy Manual"
echo "=========================================="

REPO="https://github.com/marcel16/adega-digital-signage.git"
DIR="/opt/adega-signage"

# 1. Clonar
echo "[1/5] Clonando repositorio..."
if [ -d "$DIR" ]; then
    cd "$DIR" && git pull
else
    git clone "$REPO" "$DIR" && cd "$DIR"
fi

# 2. Env
echo "[2/5] Configurando ambiente..."
[ ! -f .env ] && cp .env.example .env && \
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env && \
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$(openssl rand -hex 32)/" .env

# 3. Docker Compose
echo "[3/5] Iniciando Docker Compose..."
docker compose -p adega-signage pull
docker compose -p adega-signage up -d
echo "  Aguardando healthchecks..."
sleep 15

# 4. Migrations
echo "[4/5] Migrations..."
docker compose -p adega-signage exec -T api npx prisma migrate deploy || \
    (sleep 10 && docker compose -p adega-signage exec -T api npx prisma migrate deploy)

# 5. Seed
echo "[5/5] Seed..."
docker compose -p adega-signage exec -T api npx prisma db seed || true

echo ""
echo "=========================================="
echo "  DEPLOY CONCLUIDO!"
echo "=========================================="
echo ""
echo "  Cliente: http://localhost:3000"
echo "  Admin:   http://localhost:3001"
echo "  API:     http://localhost:4000/api/docs"
echo ""
echo "  Admin: admin@adegasignage.com / Admin@123456"
echo "  Tenant: admin@adegaexemplo.com / Admin@123456"
echo ""
echo "  Para configurar dominios no Coolify:"
echo "  Acesse o Coolify UI e crie um recurso Docker Compose"
echo "  apontando para: marcel16/adega-digital-signage"
echo "  Path: /docker-compose.yml, Branch: master"
echo ""