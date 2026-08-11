# Arquitetura inicial — NexaWi Academias

## Decisões confirmadas

- Aplicação: Next.js App Router com TypeScript strict.
- Banco, Auth e Storage: projeto Supabase exclusivo.
- Deploy: projeto Vercel exclusivo.
- Código: repositório `nexawisistemas/Academias`.
- Domínio principal: `academias.nexawi.com.br`.
- Tenancy: organização → unidades → funcionários/alunos.

## Organização do código

```txt
src/
  app/           rotas, layouts e composição de páginas
  components/    componentes visuais reutilizáveis
  lib/
    auth/        sessão, RBAC e autorização
    domain/      regras de negócio sem dependência de UI
    services/    casos de uso da aplicação
    supabase/    clientes e acesso a dados
    integrations/adapters para serviços externos
supabase/
  migrations/    toda alteração estrutural versionada
  seed.sql       somente dados fictícios
```

## Regra de isolamento

Toda entidade pertencente à academia terá `organization_id`. Entidades operacionais por unidade também terão `branch_id`. O tenant será derivado da sessão ou hostname validado; nunca será confiado diretamente ao frontend.

O isolamento deverá ser aplicado em três camadas:

1. autorização no servidor;
2. RLS no PostgreSQL;
3. testes automatizados de acesso cruzado.

## Domínios

- Plataforma: `academias.nexawi.com.br`.
- Cliente: `slug.academias.nexawi.com.br`.
- Personalizado: domínio cadastrado e verificado na tabela `domains`.
- DNS futuro: wildcard `*.academias.nexawi.com.br`.

## Direção visual

Interface futurista, premium e tecnológica, com movimento funcional, profundidade, dados vivos e microinterações. Animações devem ser performáticas, responsivas e respeitar `prefers-reduced-motion`.
