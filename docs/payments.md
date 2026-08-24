# Pagamentos da NexaWi Academias

## Arquitetura

- **Asaas**: assinatura recorrente nativa por checkout hospedado. O cartão é coletado pelo Asaas; a NexaWi não recebe nem persiste o número do cartão.
- **InfinitePay**: Pix/cartão via Checkout Integrado. Como a API pública de links não expõe cobrança automática com cartão armazenado, a NexaWi cria um novo link para cada mensalidade.
- **Webhooks**: todos os eventos são autenticados, registrados com chave idempotente e só depois alteram faturas e pagamentos.
- **Credenciais**: API keys e segredos são criptografados com AES-256-GCM antes de entrar no Supabase.

## Variáveis obrigatórias

```env
PAYMENT_CREDENTIALS_ENCRYPTION_KEY=
CRON_SECRET=
```

`PAYMENT_CREDENTIALS_ENCRYPTION_KEY` deve ser uma chave aleatória de 32 bytes em base64 (ou 64 caracteres hexadecimais). Ela precisa ser igual no ambiente local e na Vercel. Nunca troque a chave sem antes recriptografar as conexões existentes.

`CRON_SECRET` protege a execução diária de `/api/cron/billing`.

## Configuração operacional

1. Acesse `/dashboard/financeiro/integracoes`.
2. No Asaas, comece em Sandbox, informe a API Key, teste a conexão e clique em **Criar webhook**. Só altere para Produção depois do teste completo.
3. Na InfinitePay, informe a InfiniteTag. O segredo do webhook é criado internamente.
4. Em **Planos e matrículas**, use **Ativar automático** para Asaas ou **Gerar mensalidade** para InfinitePay.
5. Em **Financeiro**, cobranças abertas também podem receber um checkout avulso de qualquer gateway ativo.

## URLs públicas

- `POST /api/webhooks/payments/asaas/:connectionId`
- `POST /api/webhooks/payments/infinitepay/:connectionId?token=...`
- `GET /api/cron/billing` com `Authorization: Bearer <CRON_SECRET>`
- `/pagamento/retorno`, `/pagamento/cancelado` e `/pagamento/expirado`

## Segurança e conciliação

- Não colocar API keys em variáveis `NEXT_PUBLIC_*`.
- O valor recebido no webhook deve coincidir exatamente com a sessão de checkout.
- `payment_webhook_events` impede processamento duplicado.
- A baixa manual continua disponível para dinheiro, transferência e maquininha física.
