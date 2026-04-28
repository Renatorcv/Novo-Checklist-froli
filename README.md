# Novo-Checklist-froli
Novo App Checklist
[README.md](https://github.com/user-attachments/files/27181340/README.md)
# ✅ Checklist Pro — Full-Stack App

Aplicação completa de gerenciamento de checklists com **React + Node.js + PostgreSQL**, pronta para cloud com Docker.

---

## 🏗️ Arquitetura

```
checklist-pro/
├── backend/                # Node.js + Express API REST
│   ├── src/
│   │   ├── config/db.js         # Pool PostgreSQL
│   │   ├── controllers/         # authController, checklistController, taskController, workspaceController
│   │   ├── middlewares/auth.js  # JWT middleware
│   │   ├── migrations/          # SQL migrations + seed
│   │   ├── routes/index.js      # Todas as rotas
│   │   └── server.js            # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/          # Layout, Sidebar
│   │   ├── context/AuthContext  # Autenticação
│   │   ├── pages/               # Dashboard, Checklists, Detail, Workspaces, Profile
│   │   ├── services/api.js      # Axios + interceptors
│   │   └── App.jsx              # Rotas
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml      # Orquestração completa
├── .env.example            # Variáveis de ambiente
└── README.md
```

---

## 🚀 Início Rápido (Docker)

```bash
# 1. Clone e configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 2. Suba todos os serviços
docker-compose up -d

# 3. Execute as migrações
docker-compose exec backend npm run migrate

# 4. (Opcional) Carregue dados de exemplo
docker-compose exec backend npm run seed

# 5. Acesse
# Frontend:  http://localhost:3000
# Backend:   http://localhost:4000
# API Docs:  http://localhost:4000/health
```

---

## 💻 Desenvolvimento Local

### Backend
```bash
cd backend
npm install
cp ../.env.example .env    # configure DB local
npm run migrate
npm run seed
npm run dev                # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
# crie .env.local com: VITE_API_URL=http://localhost:4000/api
npm run dev                # http://localhost:3000
```

---

## 🗄️ Banco de Dados

### Entidades principais
| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema |
| `workspaces` | Espaços de trabalho (multi-tenant) |
| `workspace_members` | Membros de cada workspace |
| `checklists` | Checklists com categoria, prioridade, cor |
| `tasks` | Tarefas com sub-tarefas, atribuições |
| `tags` | Tags para organização |
| `comments` | Comentários em tarefas |
| `activity_logs` | Log de auditoria |

### Executar migrations manualmente
```bash
cd backend
node src/migrations/run.js
```

---

## 📡 API Endpoints

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Registrar usuário |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Dados do usuário logado |
| PUT  | `/api/auth/me` | Atualizar perfil |

### Workspaces
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/workspaces` | Listar workspaces |
| POST | `/api/workspaces` | Criar workspace |
| PUT | `/api/workspaces/:id` | Atualizar |
| DELETE | `/api/workspaces/:id` | Excluir |
| GET | `/api/workspaces/:id/members` | Membros |
| POST | `/api/workspaces/:id/invite` | Convidar membro |

### Checklists
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/checklists` | Listar (com filtros) |
| GET | `/api/checklists/stats` | Estatísticas |
| POST | `/api/checklists` | Criar |
| GET | `/api/checklists/:id` | Detalhe |
| PUT | `/api/checklists/:id` | Atualizar |
| DELETE | `/api/checklists/:id` | Excluir |
| POST | `/api/checklists/:id/duplicate` | Duplicar |

### Tasks
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/checklists/:id/tasks` | Listar tarefas |
| POST | `/api/checklists/:id/tasks` | Criar tarefa |
| PUT | `/api/tasks/:id` | Atualizar tarefa |
| DELETE | `/api/tasks/:id` | Excluir tarefa |
| PUT | `/api/checklists/:id/tasks/reorder` | Reordenar |
| PUT | `/api/checklists/:id/tasks/toggle-all` | Marcar/desmarcar todas |

---

## 🌐 Deploy em Cloud

### Render / Railway / Fly.io (Backend)
```bash
# Variáveis necessárias:
DATABASE_URL=postgres://...
JWT_SECRET=...
NODE_ENV=production
PORT=4000
```

### Vercel / Netlify (Frontend)
```bash
# .env de produção:
VITE_API_URL=https://sua-api.render.com/api
npm run build
# faça upload da pasta /dist
```

### AWS / GCP / Azure (Docker)
```bash
docker-compose -f docker-compose.yml up -d
```

---

## 🔒 Segurança implementada
- ✅ JWT com expiração configurável
- ✅ Bcrypt para senhas (rounds: 12)
- ✅ Rate limiting (300 req/15min)
- ✅ Helmet.js (headers HTTP seguros)
- ✅ CORS configurável
- ✅ Validação em rotas

---

## 👤 Contas Demo (após seed)
| Email | Senha | Role |
|-------|-------|------|
| admin@checklistpro.com | Admin@123 | admin |
| jane@checklistpro.com | Member@123 | member |
