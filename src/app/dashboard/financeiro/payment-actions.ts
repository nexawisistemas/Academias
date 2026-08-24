"use server";

import { revalidatePath } from "next/cache";
import { requireOrganization } from "@/lib/auth/session";
import { createOperationalClient } from "@/lib/supabase/operational";
import { AsaasGateway } from "@/lib/payments/asaas";
import { createGatewayCheckout } from "@/lib/payments/checkout-service";
import { decryptPaymentCredentials, encryptPaymentCredentials, generateWebhookSecret, secretHint } from "@/lib/payments/crypto";
import { InfinitePayGateway } from "@/lib/payments/infinitepay";
import type { GatewayEnvironment, PaymentProvider, PaymentProviderConnection } from "@/lib/payments/types";
import type { ActionResult } from "../action-types";

const ok = (message: string, redirectTo?: string): ActionResult => ({ ok: true, message, ...(redirectTo ? { redirectTo } : {}) });
const fail = (message: string): ActionResult => ({ ok: false, message });
const text = (data: FormData, key: string) => String(data.get(key) || "").trim();
const providerValue = (data: FormData): PaymentProvider | null => { const value = text(data, "provider"); return value === "asaas" || value === "infinitepay" ? value : null; };
const appUrl = () => (process.env.NEXT_PUBLIC_APP_URL || "https://academias.nexawi.com.br").replace(/\/$/, "");

async function scope() {
  const context = await requireOrganization();
  return { context, db: await createOperationalClient(), organizationId: (context.activeOrganization as unknown as { id: string }).id };
}

export async function savePaymentProviderConnectionAction(data: FormData): Promise<ActionResult> {
  const provider = providerValue(data); if (!provider) return fail("Gateway inválido.");
  const environment = (text(data, "environment") === "production" ? "production" : "sandbox") as GatewayEnvironment;
  const { context, db, organizationId } = await scope();
  const { data: rawExisting } = await db.from("payment_provider_connections").select("id,organization_id,provider,environment,status,config,credentials_ciphertext").eq("organization_id", organizationId).eq("provider", provider).maybeSingle();
  const existing = rawExisting as PaymentProviderConnection | null;
  try {
    const currentCredentials = existing?.credentials_ciphertext ? decryptPaymentCredentials(existing.credentials_ciphertext) : {};
    let credentials: Record<string, string>; let config: Record<string, unknown>; let hint: string; let status = "draft";
    if (provider === "asaas") {
      const apiKey = text(data, "api_key") || currentCredentials.apiKey;
      if (!apiKey) return fail("Informe a API Key do Asaas.");
      const webhookToken = text(data, "webhook_token") || currentCredentials.webhookToken || generateWebhookSecret();
      credentials = { apiKey, webhookToken };
      const preservedConfig = existing?.environment === environment ? (existing?.config || {}) : {};
      config = { ...preservedConfig, billing_types: ["PIX", "CREDIT_CARD"], recurrence_mode: "native" };
      hint = secretHint(apiKey);
    } else {
      const handle = text(data, "handle").replace(/^\$/, "");
      try { new InfinitePayGateway(handle); } catch { return fail("Informe uma InfiniteTag válida."); }
      credentials = { webhookSecret: currentCredentials.webhookSecret || generateWebhookSecret() };
      config = { ...(existing?.config || {}), handle, recurrence_mode: "invoice_link" };
      hint = `$${handle}`; status = "active";
    }
    const encrypted = encryptPaymentCredentials(credentials);
    const payload = { organization_id: organizationId, provider, environment, status, display_name: provider === "asaas" ? "Asaas" : "InfinitePay", config, credentials_ciphertext: encrypted, credentials_hint: hint, last_error: null, created_by: context.user.id };
    const { data: connection, error } = await db.from("payment_provider_connections").upsert(payload, { onConflict: "organization_id,provider" }).select("id").single();
    if (error || !connection) return fail("Você não possui permissão ou não foi possível salvar a integração.");
    await db.rpc("record_audit_event", { p_organization_id: organizationId, p_action: "billing.gateway_saved", p_entity_type: "payment_provider_connection", p_entity_id: connection.id, p_metadata: { provider, environment }, p_branch_id: null });
    revalidatePath("/dashboard/financeiro"); revalidatePath("/dashboard/financeiro/integracoes");
    return ok(provider === "asaas" ? "Asaas salvo. Teste a conexão antes de cobrar." : "InfinitePay pronta para gerar links por mensalidade.");
  } catch (error) { return fail(error instanceof Error ? error.message : "Não foi possível proteger as credenciais."); }
}

export async function testPaymentProviderConnectionAction(data: FormData): Promise<ActionResult> {
  const provider = providerValue(data); if (!provider) return fail("Gateway inválido.");
  const { db, organizationId } = await scope();
  const { data: rawConnection } = await db.from("payment_provider_connections").select("id,organization_id,provider,environment,status,config,credentials_ciphertext").eq("organization_id", organizationId).eq("provider", provider).single();
  const connection = rawConnection as PaymentProviderConnection | null; if (!connection) return fail("Integração ainda não configurada.");
  await db.from("payment_provider_connections").update({ status: "testing", last_error: null }).eq("id", connection.id).eq("organization_id", organizationId);
  try {
    const credentials = decryptPaymentCredentials(connection.credentials_ciphertext);
    if (provider === "asaas") await new AsaasGateway(credentials.apiKey || "", connection.environment).testConnection();
    else new InfinitePayGateway(String(connection.config.handle || ""));
    await db.from("payment_provider_connections").update({ status: "active", last_tested_at: new Date().toISOString(), last_error: null }).eq("id", connection.id).eq("organization_id", organizationId);
    revalidatePath("/dashboard/financeiro/integracoes"); return ok("Conexão validada e ativada.");
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Falha ao validar o gateway.";
    await db.from("payment_provider_connections").update({ status: "error", last_tested_at: new Date().toISOString(), last_error: message }).eq("id", connection.id).eq("organization_id", organizationId);
    revalidatePath("/dashboard/financeiro/integracoes"); return fail(`Conexão recusada: ${message}`);
  }
}

export async function provisionAsaasWebhookAction(): Promise<ActionResult> {
  const { db, organizationId } = await scope();
  const [{ data: rawConnection }, { data: organization }] = await Promise.all([
    db.from("payment_provider_connections").select("id,organization_id,provider,environment,status,config,credentials_ciphertext").eq("organization_id", organizationId).eq("provider", "asaas").eq("status", "active").single(),
    db.from("organizations").select("name,email").eq("id", organizationId).single(),
  ]);
  const connection = rawConnection as PaymentProviderConnection | null; if (!connection) return fail("Valide o Asaas antes de configurar o webhook.");
  if (connection.config.webhook_id) return ok("O webhook do Asaas já está provisionado.");
  try {
    const credentials = decryptPaymentCredentials(connection.credentials_ciphertext);
    const webhookUrl = `${appUrl()}/api/webhooks/payments/asaas/${connection.id}`;
    const result = await new AsaasGateway(credentials.apiKey || "", connection.environment).createWebhook({ name: `NexaWi · ${organization?.name || "Academia"}`, url: webhookUrl, email: organization?.email || "contato@nexawi.com.br", authToken: credentials.webhookToken || "" });
    await db.from("payment_provider_connections").update({ config: { ...connection.config, webhook_id: result.id, webhook_url: webhookUrl }, last_error: null }).eq("id", connection.id).eq("organization_id", organizationId);
    revalidatePath("/dashboard/financeiro/integracoes"); return ok("Webhook do Asaas criado e autenticado.");
  } catch (error) { return fail(error instanceof Error ? `Não foi possível criar o webhook: ${error.message}` : "Não foi possível criar o webhook."); }
}

export async function updatePaymentProviderStatusAction(data: FormData): Promise<ActionResult> {
  const provider = providerValue(data); const status = text(data, "status");
  if (!provider || !["active", "disabled"].includes(status)) return fail("Situação inválida.");
  const { db, organizationId } = await scope();
  const { error } = await db.from("payment_provider_connections").update({ status }).eq("organization_id", organizationId).eq("provider", provider);
  if (error) return fail("Não foi possível alterar o gateway."); revalidatePath("/dashboard/financeiro"); revalidatePath("/dashboard/financeiro/integracoes"); return ok(status === "active" ? "Gateway ativado." : "Gateway desativado.");
}

export async function createPaymentCheckoutAction(data: FormData): Promise<ActionResult> {
  const provider = providerValue(data); if (!provider) return fail("Selecione um gateway ativo.");
  const targetType = text(data, "target_type"), targetId = text(data, "target_id");
  if (!targetId || !["invoice", "subscription"].includes(targetType)) return fail("Cobrança não identificada.");
  const { db, organizationId } = await scope();
  try {
    const result = await createGatewayCheckout(db, { provider, organizationId, invoiceId: targetType === "invoice" ? targetId : null, subscriptionId: targetType === "subscription" ? targetId : null, baseUrl: appUrl() });
    await db.rpc("record_audit_event", { p_organization_id: organizationId, p_action: "billing.checkout_created", p_entity_type: targetType, p_entity_id: targetId, p_metadata: { provider, mode: result.mode, checkout_session_id: result.sessionId }, p_branch_id: null });
    revalidatePath("/dashboard/financeiro"); revalidatePath("/dashboard/planos-matriculas"); return ok("Checkout criado. Redirecionando para o pagamento…", result.url);
  } catch (error) { return fail(error instanceof Error ? error.message : "Não foi possível gerar o checkout."); }
}
