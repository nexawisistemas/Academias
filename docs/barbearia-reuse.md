# Reaproveitamento controlado do NexaWi Barbearias

## Reaproveitar como padrão

- configuração de clientes Supabase;
- fluxo de autenticação e recuperação de senha;
- proteção de rotas e helpers de sessão;
- estrutura de dashboard e navegação responsiva;
- componentes básicos de formulários, tabelas, modais e estados vazios;
- estratégia de Storage;
- resolução de domínios por hostname;
- abstrações de pagamentos, e-mail e analytics;
- padrões de webhook, cron e migrations;
- painel Super Admin e planos SaaS como referência.

## Adaptar antes de usar

- membership multiempresa para suportar organização e várias unidades;
- RBAC para papéis de academia e escopo por unidade;
- agenda para aulas, capacidade, recorrência, reservas e lista de espera;
- CRM para pipeline configurável, atividades e follow-up;
- financeiro para separar cobrança SaaS de cobrança do aluno;
- site público para CMS de seções e domínio/subdomínio automático.

## Não copiar

- tabelas e campos com prefixo ou semântica de barbearia;
- barbeiros, serviços, comandas, pacotes e loja como domínio principal;
- server actions que usem service role sem autorização explícita;
- migrations de reparo ou legado de clínica;
- regras baseadas na existência de uma única unidade.

Cada reutilização futura deverá preservar a implementação original no projeto Barbearias e ser portada de forma rastreável para TypeScript.
