# TechTrack

Sistema web multi-tenant para gestão de equipamentos, chamados técnicos e manutenção, voltado para pequenas empresas e órgãos públicos.

## Stack Tecnológica

- **Backend**: Python FastAPI
- **Frontend**: React + TypeScript + Vite
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT Tokens
- **Arquitetura**: Multi-tenant (isolamento de dados por organização)

## Funcionalidades

1. **Inventário de Equipamentos**
   - Cadastro de computadores, notebooks, impressoras e servidores
   - Número de patrimônio e número de série
   - Especificações técnicas (marca, modelo, processador, memória, armazenamento)
   - Localização física
   - Histórico de alterações

2. **Central de Chamados**
   - Abertura de chamados técnicos por usuários
   - Atribuição a técnico responsável
   - Prioridade: baixa, média, alta, crítica
   - Status: aberto, em andamento, aguardando, concluído
   - Histórico de atendimento e solução

3. **Controle de Manutenção**
   - Registro de manutenções preventivas e corretivas
   - Histórico de problemas por equipamento
   - Registro de peças substituídas
   - Alertas de manutenção pendente

4. **Dashboard Administrativo**
   - Total de equipamentos cadastrados
   - Chamados abertos e concluídos
   - Equipamentos com problemas
   - Tempo médio de atendimento
   - Gráficos de chamados por período

## Estrutura do Projeto

```
TechTrack/
├── backend/          # FastAPI application
├── frontend/         # React + TypeScript + Vite
├── docker/           # Docker Compose para desenvolvimento
└── README.md
```

## Pré-requisitos

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Docker e Docker Compose (opcional)

## Como Rodar Localmente

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Com Docker Compose

```bash
docker-compose -f docker/docker-compose.yml up --build
```

## Variáveis de Ambiente

### Backend (.env)

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/techtrack
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## Documentação da API

Após iniciar o backend, acesse:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Status do Desenvolvimento

- [x] Etapa 1: Fundação (Banco, Modelos e Autenticação)
- [ ] Etapa 2: Backend (API de Equipamentos e Chamados)
- [ ] Etapa 3: Frontend (Dashboard e Telas de Gerenciamento)
- [ ] Etapa 4: Finalização (Testes, Docker, Deploy e Documentação)
