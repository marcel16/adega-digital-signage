# 🍷 Adega Signage IPTV SaaS

**SaaS completo de Digital Signage/IPTV corporativo** para adegas, mercados, bares, restaurantes e pequenos comércios.

## 🎯 Visão Geral

Plataforma multi-tenant onde cada cliente pode contratar planos, cadastrar estabelecimentos, gerenciar TVs, criar campanhas promocionais com overlays, agendar conteúdos e gerar saídas IPTV individuais em formato M3U.

## 🏗️ Arquitetura

```
adega.queroservico.store        → Frontend Cliente (Next.js 14)
admin.adega.queroservico.store  → Painel Administrativo (Next.js 14)  
api.adega.queroservico.store    → API REST (NestJS + Prisma)
tv.adega.queroservico.store     → Serviço IPTV/M3U (Express)
```

## 🚀 Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 10 + TypeScript |
| Frontend Cliente | Next.js 14 + TailwindCSS + Shadcn/ui |
| Painel Admin | Next.js 14 + TailwindCSS + Shadcn/ui |
| IPTV Service | Express + JWT + Redis |
| ORM | Prisma |
| Banco | PostgreSQL 16 |
| Cache/Fila | Redis 7 |
| Storage | Local (abstração para S3/MinIO) |
| Auth | Argon2 + JWT + Refresh Token |
| Pagamento | Asaas |
| Deploy | Docker Compose + Coolify |

## 📦 Funcionalidades

### 👤 Área do Cliente (`adega.queroservico.store`)
- Cadastro e login
- Contratação de planos
- Gestão de lojas/estabelecimentos
- Gestão de TVs (pareamento, status)
- Upload e gestão de mídias (imagem, vídeo, áudio, YouTube, URL)
- Editor avançado de campanhas com overlays
- Agendamento por dia/horário
- Playlists IPTV
- Visualização de status das TVs
- Acesso ao link M3U individual
- Gestão de assinatura e faturas

### 🔧 Painel Administrativo (`admin.adega.queroservico.store`)
- Dashboard global com métricas
- Gestão de clientes (bloquear/desbloquear)
- Gestão de planos e preços
- Gestão de pagamentos e inadimplência
- Cupons de desconto
- Tokens de API com escopo
- Logs do sistema
- Auditoria completa
- Webhooks (Asaas)
- Configuração do Asaas (API key mascarada)
- Configurações globais do sistema
- Usuários administradores

### 📺 IPTV (`tv.adega.queroservico.store`)
- Saída M3U individual por cliente/TV
- Tokens temporários assinados
- Cache com Redis
- Logs de acesso
- URLs sensíveis com assinatura

### 🔒 Segurança
- Autenticação JWT + Refresh Token
- Argon2 para hash de senhas
- RBAC com permissões granulares
- Isolamento multi-tenant por tenant_id
- Rate limiting por IP e usuário
- Proteção contra brute force
- Headers de segurança (Helmet)
- CORS configurável
- Validação de entrada (class-validator)
- Sanitização de uploads
- Auditoria de ações críticas
- API Keys com escopo
- Proteção contra IDOR, XSS, SQL Injection
- IAM abstraction layer (preparado para Keycloak/Clerk/Casdoor)

## 🏁 Quick Start

```bash
# 1. Clone
git clone https://github.com/seu-repo/adega-digital-signage.git
cd adega-digital-signage

# 2. Configure
cp .env.example .env
# Edite .env com suas configurações

# 3. Inicie os serviços
docker compose up -d

# 4. Execute migrations e seed
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed

# 5. Acesse
# Cliente: http://localhost:3000
# Admin:   http://localhost:3001
# API:     http://localhost:4000/api
# Swagger: http://localhost:4000/api/docs
# IPTV:    http://localhost:4001
```

## 🌐 Domínios (Produção)

| Serviço | Domínio | Porta Interna |
|---|---|---|
| Frontend Cliente | `adega.queroservico.store` | 3000 |
| Painel Admin | `admin.adega.queroservico.store` | 3001 |
| API | `api.adega.queroservico.store` | 4000 |
| IPTV | `tv.adega.queroservico.store` | 4001 |

## 🔐 Credenciais Padrão (Seed)

| Papel | Email | Senha |
|---|---|---|
| Super Admin | `admin@adegasignage.com` | `Admin@123456` |
| Admin Tenant | `admin@adegaexemplo.com` | `Admin@123456` |

Configurável via variáveis `ADMIN_EMAIL` e `ADMIN_PASSWORD`.

## 🐳 Serviços Docker

```yaml
Serviços:
  postgres:   PostgreSQL 16 (porta 5432)
  redis:      Redis 7 (porta 6379)
  api:        NestJS API (porta 4000)
  worker:     Background worker
  web:        Cliente Next.js (porta 3000)
  admin:      Admin Next.js (porta 3001)
  iptv:       IPTV Service (porta 4001)
```

## 📚 Documentação da API

Disponível via Swagger em:
- Desenvolvimento: `http://localhost:4000/api/docs`
- Produção: `https://api.adega.queroservico.store/api/docs`

### Endpoints Principais

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/auth/profile

GET    /api/stores
POST   /api/stores
GET    /api/stores/:id
PATCH  /api/stores/:id

GET    /api/tvs
POST   /api/tvs
POST   /api/tvs/ping
GET    /api/tvs/:id/m3u

GET    /api/media
POST   /api/media/upload
POST   /api/media/youtube
GET    /api/media/:id

GET    /api/campaigns
POST   /api/campaigns
PATCH  /api/campaigns/:id/status
POST   /api/campaigns/:id/duplicate

GET    /api/overlays
POST   /api/overlays
PATCH  /api/overlays/:id

GET    /api/playlists
POST   /api/playlists
GET    /api/playlists/:id/m3u

GET    /api/schedules
POST   /api/schedules
GET    /api/schedules/tv/:tvId/now

GET    /api/iptv/:storeCode.m3u
GET    /api/iptv/:storeCode/:tvCode.m3u

GET    /api/billing/plans
POST   /api/billing/checkout
POST   /api/billing/webhook/asaas

GET    /api/admin/dashboard
GET    /api/admin/clients
GET    /api/admin/plans
POST   /api/admin/plans

GET    /api/audit
GET    /api/audit/export

GET    /api/api-tokens
POST   /api/api-tokens

GET    /api/settings
PATCH  /api/settings

GET    /api/webhook-logs

GET    /api/dashboard/stats

GET    /api/health
```

## 🌍 Deploy no Coolify

### Pré-requisitos
1. Coolify instalado e acessível
2. Repositório GitHub conectado
3. Domínios configurados no DNS apontando para o servidor

### Configuração

1. **No Coolify:**
   - Adicione novo recurso "Docker Compose"
   - Selecione o repositório
   - O Coolify detecta automaticamente o `docker-compose.yml`

2. **Variáveis de Ambiente:**
   Configure no painel do Coolify:
   ```
   JWT_SECRET= (64 caracteres aleatórios)
   JWT_REFRESH_SECRET= (64 caracteres aleatórios)
   ASAAS_API_KEY= (sua chave Asaas)
   ```

3. **Domínios:**
   - `adega.queroservico.store` → web:3000
   - `admin.adega.queroservico.store` → admin:3000
   - `api.adega.queroservico.store` → api:4000
   - `tv.adega.queroservico.store` → iptv:4001

4. **Banco de Dados:**
   ```bash
   # Após o deploy, execute migrations
   docker compose exec api npx prisma migrate deploy
   docker compose exec api npx prisma db seed
   ```

5. **SSL:**
   - Coolify gerencia SSL automaticamente via Traefik
   - HTTPS habilitado para todos os domínios

## 📁 Estrutura do Projeto

```
adega-digital-signage/
├── docker-compose.yml          # Orquestração principal
├── .env.example                # Template de variáveis
├── .gitignore
├── README.md
├── apps/
│   ├── api/                    # NestJS API (porta 4000)
│   │   ├── prisma/             # Schema + migrations + seed
│   │   ├── src/
│   │   │   ├── main.ts         # Bootstrap
│   │   │   ├── app.module.ts   # 23 módulos
│   │   │   ├── common/         # Guards, interceptors, decorators
│   │   │   └── modules/        # 20 feature modules
│   │   └── Dockerfile
│   │
│   ├── web/                    # Cliente Next.js (porta 3000)
│   │   ├── src/
│   │   │   ├── app/            # Pages + layouts
│   │   │   ├── components/     # UI + forms + layout
│   │   │   ├── lib/            # API client + utils
│   │   │   └── types/          # TypeScript interfaces
│   │   └── Dockerfile
│   │
│   ├── admin/                  # Admin Next.js (porta 3001)
│   │   ├── src/
│   │   │   ├── app/            # Pages + layouts
│   │   │   ├── components/     # UI + layout
│   │   │   ├── lib/            # API client + utils
│   │   │   └── types/          # TypeScript interfaces
│   │   └── Dockerfile
│   │
│   └── iptv/                   # IPTV Service (porta 4001)
│       ├── src/
│       │   ├── server.ts       # Express server
│       │   ├── routes/         # M3U + stream routes
│       │   ├── services/       # Playlist service
│       │   ├── middleware/     # Auth + rate limit
│       │   └── utils/          # M3U generator + token
│       └── Dockerfile
│
├── storage/                    # Uploads (volume compartilhado)
│   └── uploads/
│
└── .docker/                    # Config Coolify
    └── docker-compose.coolify.yml
```

## 📊 Modelo de Dados (26 tabelas)

- `tenants` - Clientes (multi-tenant)
- `users` - Usuários
- `stores` - Lojas/Estabelecimentos
- `tv_devices` - TVs pareadas
- `media_assets` - Mídias (imagem, vídeo, áudio, YouTube)
- `campaigns` - Campanhas
- `campaign_media` - Mídias da campanha
- `overlays` - Overlays (texto, preço, QR Code, badge)
- `playlists` - Playlists
- `playlist_items` - Itens da playlist
- `schedules` - Agendamentos
- `plans` - Planos
- `subscriptions` - Assinaturas
- `invoices` - Faturas
- `payments` - Pagamentos
- `coupons` - Cupons
- `api_tokens` - Tokens de API
- `system_settings` - Configurações do sistema
- `asaas_config` - Configuração Asaas
- `audit_logs` - Logs de auditoria
- `webhook_logs` - Logs de webhook
- `iptv_logs` - Logs de acesso IPTV
- `health_checks` - Health checks
- `user_stores` - Relação usuário-loja
- `subscription_invoices` - Relação assinatura-fatura

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.