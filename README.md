# TechTrack

Sistema web multi-tenant para gestão de equipamentos, chamados técnicos e manutenção, voltado para pequenas empresas e órgãos públicos.

## Stack Tecnológica

- **Backend**: Python FastAPI
- **Frontend**: React + TypeScript + Vite
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **Autenticação**: JWT Tokens
- **Arquitetura**: Multi-tenant (isolamento de dados por organização)

## Funcionalidades

1. **Inventário de Equipamentos**
   - Cadastro de computadores, notebooks, impressoras e servidores
   - Número de patrimônio, marca e modelo opcionais; tipo permanece obrigatório
   - Campo de observação no lugar de localização e sem coleta de número de série
   - Edição de equipamentos e status pela tela de inventário
   - Exclusão de setor preservando os equipamentos e removendo apenas o vínculo com o setor
   - Especificações técnicas (processador, memória e armazenamento)
   - Histórico de alterações

2. **Departamentos**
   - Cadastro, edição e exclusão de departamentos
   - Equipamentos agrupados por setor, incluindo equipamentos sem setor
   - Detalhes completos dos equipamentos acessíveis pela listagem
   - Filtros por setor, tipo de máquina e status

3. **Central de Chamados (temporariamente desativada)**
   - Abertura de chamados técnicos por usuários
   - Atribuição a técnico responsável
   - Prioridade: baixa, média, alta, crítica
   - Status: aberto, em andamento, aguardando, concluído
   - Histórico de atendimento e solução

4. **Controle de Manutenção**
   - Registro de manutenções preventivas e corretivas
   - Edição e exclusão dos registros de manutenção
   - Histórico de problemas por equipamento
   - Registro de peças substituídas
   - Alertas de manutenção pendente

5. **Dashboard Administrativo**
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
- Docker e Docker Compose (opcional)

## Como Rodar Localmente

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Com Docker Compose

Defina uma chave secreta e uma senha PostgreSQL URL-safe no ambiente antes de iniciar. No PowerShell, por exemplo:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$env:SECRET_KEY = [BitConverter]::ToString($bytes).Replace("-", "").ToLowerInvariant()
$bytes = New-Object byte[] 24
$rng.GetBytes($bytes)
$env:POSTGRES_PASSWORD = [BitConverter]::ToString($bytes).Replace("-", "").ToLowerInvariant()
$rng.Dispose()
docker compose -f docker/docker-compose.yml up --build
```

O serviço do backend executa `alembic upgrade head` antes de iniciar a API. Em deploys com múltiplas réplicas, execute as migrações como etapa única de implantação, não simultaneamente em cada réplica.

## Variáveis de Ambiente

### Backend (.env)

```env
DATABASE_URL=sqlite+aiosqlite:///./techtrack.db
SECRET_KEY=replace-with-a-random-32-byte-hex-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://localhost:3000"]
```

Em produção, defina `ENVIRONMENT=production`, use uma `SECRET_KEY` aleatória própria e configure `CORS_ORIGINS` com as origens reais do frontend. A chave de desenvolvimento não é aceita nesse modo.

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

## Notas

- Banco de dados configurado como SQLite para desenvolvimento local
- Para produção, alterar `DATABASE_URL` para PostgreSQL
- Autenticação JWT implementada e testada
- Multi-tenancy configurado com isolamento por organization_id
- Rode `alembic upgrade head` no diretório `backend` antes de iniciar a API em um banco local novo ou após uma atualização de schema.
- Rode os testes do backend com `python -m pytest` no diretório `backend`.
- As migrações criam os tipos básicos de equipamento e manutenção usados nos formulários.
