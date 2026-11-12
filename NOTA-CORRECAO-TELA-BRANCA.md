# Nota: correção da tela em branco

## Sintoma

Na rota `/equipment`, a barra superior e o menu lateral apareciam, mas o conteúdo da página ficava em branco.

## Causa identificada

As rotas das páginas estavam aninhadas dentro de um componente `Layout` passado como filho. Porém, o `Layout` usa o `<Outlet />` do React Router para renderizar as rotas filhas. Como elas não estavam configuradas como rotas filhas do Router, o conteúdo da página não era exibido.

## O que foi corrigido

- Reorganizei as rotas em `frontend/src/App.tsx`: `Layout` agora é o elemento pai das rotas do dashboard, equipamentos, chamados e manutenção.
- Criei `frontend/src/vite-env.d.ts` com as definições do Vite, corrigindo os erros de TypeScript em `import.meta.env`.

## Verificação

- `npm run build` passou após as alterações.
- A aplicação foi aberta em `http://localhost:5173/`; a rota `/dashboard` redirecionou corretamente e renderizou o conteúdo.

## Se o problema continuar

1. Confira a porta mostrada no terminal do Vite. A captura estava em `localhost:5174`, enquanto a verificação foi feita em `localhost:5173`. Abra a porta da instância que está usando o código atualizado; mais de uma instância pode estar rodando.
2. Reinicie o Vite e atualize a página. Se necessário, faça uma atualização forçada do navegador.
3. Abra o Console e a aba Network das ferramentas do navegador para identificar erros JavaScript ou falhas de carregamento.
4. O dashboard exibiu a mensagem “Data fetching desativado temporariamente”. Isso indica que a busca de dados do painel está desativada e é um assunto separado da tela em branco; os indicadores podem não refletir dados reais mesmo com a página renderizada.

## Erro ao criar setor (`422 Unprocessable Entity`)

### Causa identificada

O formulário chama `mutate(sectorFormData)`, passando um único objeto com `name` e `description`. Porém, `equipmentService.createSector` recebia dois argumentos posicionais (`name` e `description`). Assim, o objeto inteiro era enviado como o campo `name` e a API rejeitava o corpo por não ser uma string, retornando `422`.

### Correção feita

- `createSector` agora recebe o objeto do formulário e o envia diretamente no corpo da requisição, com tipo baseado nos campos de `Sector`.
- O diálogo mostra a mensagem da falha retornada pelo cliente HTTP, em vez de deixar o erro invisível.

### Validação

O build foi executado, mas não concluiu: o TypeScript reportou erros em vários pontos do frontend, incluindo imports não utilizados, tipos incompatíveis em formulários e consultas React Query. Nenhum desses erros apontou para a nova assinatura de `createSector` ou para a exibição da mensagem de erro; portanto, o build completo continua pendente até corrigir esses problemas de tipagem.
