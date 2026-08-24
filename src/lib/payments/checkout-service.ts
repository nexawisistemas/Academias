import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AsaasGateway } from "./asaas";
import { decryptPaymentCredentials } from "./crypto";
import { InfinitePayGateway } from "./infinitepay";
import type { BillingCycle, PaymentProvider, PaymentProviderConnection } from "./types";

type CheckoutTarget = { provider: PaymentProvider; organizationId: string; invoiceId?: string | null; subscriptionId?: string | null; baseUrl: string };
type Member = { id: string; full_name: string; email?: string | null; phone?: string | null; cpf?: string | null };

export async function createGatewayCheckout(db: SupabaseClient, target: CheckoutTarget) {
  const { data: rawConnection } = await db.from("payment_provider_connections").select("id,organization_id,provider,environment,status,config,credentials_ciphertext").eq("organization_id", target.organizationId).eq("provider", target.provider).eq("status", "active").maybeSingle();
  const connection = rawConnection as PaymentProviderConnection | null;
  if (!connection) throw new Error("Gateway não está ativo para esta academia.");
  if (target.subscriptionId && target.provider === "asaas") {
    const { data: existingBinding } = await db.from("payment_provider_subscriptions").select("status").eq("connection_id", connection.id).eq("subscription_id", target.subscriptionId).in("status", ["pending", "active"]).maybeSingle();
    if (existingBinding) throw new Error("Esta matrícula já possui recorrência Asaas configurada ou aguardando conclusão.");
  }

  let invoiceId = target.invoiceId || null;
  let subscriptionId = target.subscriptionId || null;
  let amountCents = 0;
  let description = "Mensalidade da academia";
  let member: Member | null = null;
  let cycle: BillingCycle = "monthly";
  let nextDueDate = new Date().toISOString().slice(0, 10);
  let endDate: string | null = null;

  if (subscriptionId) {
    const { data } = await db.from("subscriptions").select("id,status,amount_cents,discount_cents,next_billing_on,ends_on,member:members(id,full_name,email,phone,cpf),plan:membership_plans(name,billing_cycle)").eq("id", subscriptionId).eq("organization_id", target.organizationId).single();
    if (!data || !["active", "overdue", "pending"].includes(data.status)) throw new Error("Matrícula não está apta para recorrência.");
    member = data.member as unknown as Member;
    const plan = data.plan as unknown as { name?: string; billing_cycle?: BillingCycle };
    amountCents = data.amount_cents - data.discount_cents;
    description = `Mensalidade · ${plan?.name || "Plano"}`;
    cycle = plan?.billing_cycle || "monthly";
    nextDueDate = data.next_billing_on || nextDueDate;
    endDate = data.ends_on;
    if (target.provider === "infinitepay") {
      const { data: existingInvoice } = await db.from("invoices").select("id").eq("organization_id", target.organizationId).eq("subscription_id", subscriptionId).in("status", ["open", "overdue"]).order("due_date").limit(1).maybeSingle();
      if (existingInvoice) invoiceId = existingInvoice.id;
      else {
        const { data: createdInvoice, error } = await db.from("invoices").insert({ organization_id: target.organizationId, subscription_id: subscriptionId, member_id: member.id, description, amount_cents: amountCents, due_date: nextDueDate, status: "open" }).select("id").single();
        if (error || !createdInvoice) throw new Error("Não foi possível preparar a mensalidade atual.");
        invoiceId = createdInvoice.id;
      }
    }
  }

  if (invoiceId) {
    const { data } = await db.from("invoices").select("id,status,description,amount_cents,due_date,subscription_id,member:members(id,full_name,email,phone,cpf)").eq("id", invoiceId).eq("organization_id", target.organizationId).single();
    if (!data || !["open", "overdue", "draft"].includes(data.status)) throw new Error("Cobrança não está disponível para pagamento.");
    member = data.member as unknown as Member;
    amountCents = data.amount_cents;
    description = data.description;
    nextDueDate = data.due_date;
    subscriptionId ||= data.subscription_id;
  }
  if (!member || amountCents <= 0) throw new Error("Dados insuficientes para gerar o checkout.");

  const kind = target.provider === "asaas" && target.subscriptionId ? "recurring_setup" : "invoice";
  const { data: session, error: sessionError } = await db.from("payment_checkout_sessions").insert({ organization_id: target.organizationId, connection_id: connection.id, invoice_id: invoiceId, subscription_id: subscriptionId, kind, status: "creating", amount_cents: amountCents }).select("id").single();
  if (sessionError || !session) throw new Error("Não foi possível iniciar a sessão de pagamento.");

  try {
    const credentials = decryptPaymentCredentials(connection.credentials_ciphertext);
    const webhookBase = `${target.baseUrl}/api/webhooks/payments/${target.provider}/${connection.id}`;
    const checkoutInput = {
      reference: session.id,
      description,
      amountCents,
      customer: { name: member.full_name, email: member.email, phone: member.phone, document: member.cpf },
      successUrl: `${target.baseUrl}/pagamento/retorno?session=${session.id}`,
      cancelUrl: `${target.baseUrl}/pagamento/cancelado?session=${session.id}`,
      expiredUrl: `${target.baseUrl}/pagamento/expirado?session=${session.id}`,
      webhookUrl: target.provider === "infinitepay" ? `${webhookBase}?token=${encodeURIComponent(credentials.webhookSecret || "")}` : webhookBase,
      ...(kind === "recurring_setup" ? { recurring: { cycle, nextDueDate, endDate } } : {}),
    };
    const result = target.provider === "asaas"
      ? await new AsaasGateway(credentials.apiKey || "", connection.environment).createCheckout(checkoutInput)
      : await new InfinitePayGateway(String(connection.config.handle || "")).createCheckout(checkoutInput);

    await db.from("payment_checkout_sessions").update({ status: "pending", provider_checkout_id: result.checkoutId, checkout_url: result.url, expires_at: result.expiresAt, error_message: null }).eq("id", session.id).eq("organization_id", target.organizationId);
    if (invoiceId) await db.from("invoices").update({ payment_provider: target.provider, payment_url: result.url, provider_status: "pending", gateway_updated_at: new Date().toISOString() }).eq("id", invoiceId).eq("organization_id", target.organizationId);
    if (subscriptionId) await db.from("payment_provider_subscriptions").upsert({ organization_id: target.organizationId, connection_id: connection.id, subscription_id: subscriptionId, provider_checkout_id: result.checkoutId, mode: target.provider === "asaas" ? "native" : "invoice_link", status: target.provider === "asaas" ? "pending" : "active", metadata: { last_checkout_session_id: session.id } }, { onConflict: "connection_id,subscription_id" });
    return { url: result.url, sessionId: session.id, provider: target.provider, mode: target.provider === "asaas" && kind === "recurring_setup" ? "native" : "invoice_link" };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Falha desconhecida no gateway.";
    await db.from("payment_checkout_sessions").update({ status: "failed", error_message: message }).eq("id", session.id).eq("organization_id", target.organizationId);
    throw error;
  }
}
