# Relatório de revisão do TechTrack

**Data:** 12/11/2026
**Escopo:** revisão estática do backend, frontend, configuração e testes. Esta revisão não alterou o código funcional do sistema.

## Resumo executivo

O projeto já tem uma estrutura definida e implementa partes importantes de autenticação, equipamentos, chamados e manutenção. Porém, as verificações atuais apontam que o frontend não está pronto para build de produção, os testes automatizados não estão cobrindo os fluxos e há pontos de validação e configuração que precisam de atenção antes de um deploy.

## Problemas identificados

### Alta prioridade

#### 1. Build do frontend falha por erros de TypeScript

**Arquivos:** `frontend/src/pages/EquipmentPage.tsx`, `frontend/src/pages/MaintenancePage.tsx`, `frontend/src/pages/TicketsPage.tsx` e `frontend/src/pages/DashboardPage.tsx`

O comando `npm run build` falhou. Entre os problemas reportados estão:

- Funções de serviço que recebem parâmetros opcionais estão ligadas diretamente como `queryFn` do React Query, cuja função recebe outro tipo de argumento.
- Campos de formulário mantêm IDs numéricos como strings, incompatíveis com os tipos esperados pelos serviços.
- Os handlers associados aos componentes `Select` do Material UI têm tipos de evento incompatíveis.
- Há imports e parâmetros não utilizados.

**Impacto provável:** não é possível gerar o bundle de produção até corrigir os erros de tipos.

#### 2. Atualização de equipamento pode falhar após gravar a alteração

**Arquivo:** `backend/app/api/v1/endpoints/equipment.py`

A rota de atualização usa `selectinload(Equipment.type)`, mas esse símbolo não consta nos imports observados no arquivo. A falha pode ocorrer na etapa de recarregar o equipamento, depois do `commit`.

**Impacto provável:** o cliente recebe erro ao atualizar, mesmo que a mudança já tenha sido persistida no banco. Isso também pode levar o usuário a repetir a operação.

#### 3. Rotas sem autenticação podem renderizar uma página vazia

**Arquivo:** `frontend/src/components/Layout.tsx`

Quando não há autenticação, o layout retorna `null` em vez de redirecionar para `/login`.

**Impacto provável:** acessar diretamente uma rota protegida, ou perder a sessão, pode deixar o conteúdo em branco sem explicar que é necessário autenticar.

#### 4. Teste assíncrono existente é ignorado

**Arquivo:** `backend/test_api.py`

O comando `pytest` encontrou um teste assíncrono, mas o marcou como ignorado porque não está configurado/assinalado para execução pelo plugin assíncrono.

**Impacto provável:** a execução verde do pytest não confirma os fluxos de registro, login e API; atualmente não há evidência de que esse teste esteja sendo executado.

### Prioridade média

#### 5. Formulários podem enviar IDs inválidos

**Arquivos:** `frontend/src/pages/EquipmentPage.tsx`, `frontend/src/pages/TicketsPage.tsx` e `frontend/src/pages/MaintenancePage.tsx`

Os formulários representam alguns IDs como strings, embora o backend espere inteiros ou valores nulos. Por exemplo, o formulário de chamado começa com `equipment_id: ''`, enquanto a API espera um número ou `null`.

**Impacto provável:** criação de equipamentos, chamados ou manutenções pode ser rejeitada com `422 Unprocessable Entity`.

#### 6. Relacionamentos não validam a organização dos IDs recebidos

**Arquivo:** `backend/app/api/v1/endpoints/maintenance.py` e também operações de chamados

Algumas operações recebem identificadores de equipamento, usuário responsável ou técnico sem confirmar explicitamente que esses registros pertencem à organização autenticada. A chave estrangeira confirma que o registro existe, mas não garante que pertença ao mesmo tenant.

**Impacto provável:** podem ser criados relacionamentos inconsistentes entre organizações. É importante validar a organização antes de gravar, sobretudo em manutenção, alertas, atribuição de chamados e associação de equipamentos.

#### 7. Migrações não são executadas automaticamente na inicialização

**Arquivos:** `backend/app/main.py` e configuração do Alembic

A inicialização da API não executa migrações. Isso não é necessariamente um defeito — migrações podem ser executadas como etapa separada de deploy —, mas requer que esse procedimento seja documentado e feito antes de iniciar a aplicação com um banco novo ou atualizado.

**Impacto provável:** erros de tabela/coluna inexistente se a API iniciar antes das migrações.

#### 8. Consulta do dashboard usa função específica do SQLite

**Arquivo:** `backend/app/api/v1/endpoints/dashboard.py`

O cálculo do tempo médio de resolução usa `julianday`, função do SQLite. O README prevê PostgreSQL para produção.

**Impacto provável:** o endpoint de estatísticas pode falhar ao usar PostgreSQL, mesmo que funcione no banco SQLite de desenvolvimento.

### Configuração e qualidade

#### 9. Valores e origens locais não bastam para produção

**Arquivos:** `backend/app/core/config.py`, `backend/app/main.py` e `docker/docker-compose.yml`

- A configuração contém uma chave JWT padrão de desenvolvimento.
- O CORS permite apenas origens locais específicas.
- O Compose contém credenciais e chave de desenvolvimento fixas.

**Impacto provável:** implantação com esses valores pode permitir configuração insegura ou bloquear chamadas do frontend hospedado em outro domínio. Os valores precisam ser substituídos por segredos e origens configurados no ambiente de deploy.

#### 10. ESLint não encontra configuração

**Arquivo de configuração esperado:** raiz do frontend

`npm run lint` falhou porque o ESLint 9 não encontrou um arquivo `eslint.config.js`, `.mjs` ou `.cjs`.

**Impacto provável:** a verificação de lint não pode ser usada como parte confiável do desenvolvimento/CI até configurar o ESLint 9 ou ajustar a versão/configuração.

#### 11. Ruff reporta muitos problemas de estilo e manutenção

**Escopo:** `backend/app`

`ruff check app` reportou 90 problemas, incluindo imports fora de ordem, imports não usados, convenções de tipos antigas e outros avisos de lint.

**Impacto provável:** a qualidade e padronização do código ficam difíceis de acompanhar, e uma pipeline que trate essas verificações como erro falhará.

## Verificações executadas

| Comando | Resultado |
|---|---|
| `npm run build` | Falhou por erros de TypeScript em várias páginas. |
| `npm run lint` | Falhou: ESLint 9 sem arquivo de configuração compatível. |
| `backend/venv/Scripts/pytest.exe -q` | 1 teste ignorado; a função assíncrona não foi executada. |
| `backend/venv/Scripts/ruff.exe check app` | Falhou com 90 problemas reportados. |

## Ordem recomendada de correção

1. Corrigir os erros de TypeScript até `npm run build` passar.
2. Corrigir o import de `selectinload` e adicionar um teste que confirme atualização de equipamento.
3. Alterar o comportamento de rotas protegidas para encaminhar usuários não autenticados ao login.
4. Corrigir a tipagem/conversão de IDs nos formulários e cobrir criação de equipamento, chamado e manutenção.
5. Validar que todos os IDs associados pertencem à organização autenticada.
6. Definir e documentar a execução das migrações nos ambientes de desenvolvimento e deploy.
7. Tornar o cálculo do dashboard compatível com SQLite e PostgreSQL.
8. Configurar segredos e CORS por ambiente; remover credenciais fixas de deploy.
9. Habilitar a execução real dos testes assíncronos, configurar o ESLint e tratar os avisos do Ruff.

## Limites da revisão

Este relatório registra achados a partir da leitura do código e dos comandos executados no ambiente disponível. Não substitui testes de integração completos, validação manual de todas as telas ou uma revisão de implantação com os valores reais de produção.

## Atualização: correções aplicadas

As correções abaixo foram implementadas após a revisão:

- **Frontend:** corrigidos os tipos dos payloads e handlers, IDs são convertidos para números, manutenção usa o usuário autenticado, e os formulários agora submetem pelo evento correto e mostram erros de gravação. Chamados e manutenções permitem selecionar equipamentos existentes.
- **Autenticação no frontend:** a aplicação aguarda restaurar a sessão e redireciona usuários não autenticados para o login, em vez de renderizar uma página vazia.
- **Equipamentos e tenant:** corrigido o carregamento de relacionamento em atualização; criação/alteração confere o tipo e o setor e as rotas de chamados/manutenção validam que os registros associados pertencem à organização autenticada.
- **PostgreSQL e migrações:** o cálculo do dashboard não usa mais `julianday`; adicionadas dependências de driver PostgreSQL assíncrono e síncrono, conversão do URL do banco para Alembic e migração da chave estrangeira do setor. O Compose executa as migrações antes da API no modo de desenvolvimento.
- **Dados iniciais:** as migrações inserem tipos padrão de equipamento e manutenção somente quando ainda não existem, para que os formulários possam ser usados em uma instalação nova.
- **Configuração:** CORS passou a ser configurável por ambiente; modo de produção rejeita chaves JWT padrão ou menores que 32 caracteres. Segredos do Compose deixaram de usar valores fixos e são obrigatórios.
- **Qualidade e Docker:** configurado ESLint 9, corrigidos os avisos Ruff e de configuração Pydantic/SQLAlchemy; testes assíncronos reais substituíram o antigo script de teste manual. Docker agora usa `npm ci` e expõe o servidor Vite dentro do container.
- **Build:** páginas carregadas sob demanda para dividir os bundles do frontend.
- **Setores:** cadastro agora aceita endereço e responsável; a listagem permite excluir com confirmação. A exclusão limpa o vínculo nos equipamentos, preservando os registros, e não permite excluir setores de outra organização.

### Verificação após as correções

| Comando/verificação | Resultado |
|---|---|
| `frontend: npm run build` | Passou; bundle de produção gerado sem aviso de chunk grande. |
| `frontend: npm run lint` | Passou sem erros ou avisos. |
| `backend: python -m pytest -q` | 4 testes passaram, cobrindo atualização/histórico de equipamento, vínculos entre organizações e autoria de manutenção. |
| `backend: ruff check app tests` | Passou sem problemas reportados. |
| Alembic em SQLite temporário | Todas as migrações passaram; chave estrangeira de setor confirmada. O banco temporário foi removido. |
| Validação de configuração de produção | Chave com 32 caracteres aceita; chave curta rejeitada. |
| `docker compose config` / execução PostgreSQL | Não validados: o comando `docker` não está instalado/disponível neste ambiente. |

O teste de migração usou SQLite. As migrações pendentes também foram aplicadas ao banco SQLite local. A migração PostgreSQL e o Compose ainda precisam de uma validação real em uma máquina com Docker/PostgreSQL disponível antes do deploy.
