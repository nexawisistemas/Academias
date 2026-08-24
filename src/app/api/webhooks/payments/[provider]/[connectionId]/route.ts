import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptPaymentCredentials, safeSecretEqual } from "@/lib/payments/crypto";
import type { PaymentProvider, PaymentProviderConnection } from "@/lib/payments/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = Record<string, unknown>;
type CheckoutSession = { id: string; organization_id: string; invoice_id: string | null; subscription_id: string | null; amount_cents: number; status: string };
const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Payload : {};
const string = (value: unknown) => typeof value === "string" ? value : value == null ? "" : String(value);
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function eventIdentity(provider: PaymentProvider, payload: Payload, raw: string) {
  if (provider === "asaas") return string(payload.id) || createHash("sha256").update(raw).digest("hex");
  return string(payload.transaction_nsu) || createHash("sha256").update(raw).digest("hex");
}
function method(provider: PaymentProvider, payment: Payload) {
  const value = provider === "asaas" ? string(payment.billingType) : string(payment.capture_method);
  if (value === "PIX" || value === "pix") return "pix";
  if (value === "CREDIT_CARD" || value === "credit_card") return "credit_card";
  if (value === "BOLETO") return "bank_slip";
  return "other";
}

export async function POST(request: Request, context: { params: Promise<{ provider: string; connectionId: string }> }) {
  const { provider: providerParam, connectionId } = await context.params;
  if (providerParam !== "asaas" && providerParam !== "infinitepay") return Response.json({ success: false, message: "Gateway inválido." }, { status: 404 });
  const provider: PaymentProvider = providerParam;
  const db = createAdminClient();
  const { data: rawConnection } = await db.from("payment_provider_connections").select("id,organization_id,provider,environment,status,config,credentials_ciphertext").eq("id", connectionId).eq("provider", provider).maybeSingle();
  const connection = rawConnection as PaymentProviderConnection | null;
  if (!connection || connection.status === "disabled") return Response.json({ success: false, message: "Integração indisponível." }, { status: 404 });
  let credentials: Record<string, string>;
  try { credentials = decryptPaymentCredentials(connection.credentials_ciphertext); } catch { return Response.json({ success: false, message: "Integração não configurada." }, { status: 503 }); }
  const url = new URL(request.url);
  const authenticated = provider === "asaas"
    ? safeSecretEqual(request.headers.get("asaas-access-token"), credentials.webhookToken)
    : safeSecretEqual(url.searchParams.get("token"), credentials.webhookSecret);
  if (!authenticated) return Response.json({ success: false, message: "Webhook não autenticado." }, { status: 401 });

  const raw = await request.text();
  let payload: Payload;
  try { payload = JSON.parse(raw) as Payload; } catch { return Response.json({ success: false, message: "JSON inválido." }, { status: 400 }); }
  const providerEventId = eventIdentity(provider, payload, raw);
  const eventType = provider === "asaas" ? string(payload.event) || "UNKNOWN" : "PAYMENT_RECEIVED";
  const { data: event, error: eventError } = await db.from("payment_webhook_events").insert({ organization_id: connection.organization_id, connection_id: connection.id, provider, provider_event_id: providerEventId, event_type: eventType, payload, status: "received" }).select("id").single();
  if (eventError?.code === "23505") return Response.json({ success: true, message: "Evento já processado." });
  if (eventError || !event) return Response.json({ success: false, message: "Não foi possível registrar o evento." }, { status: 500 });

  try {
    const payment = provider === "asaas" ? object(payload.payment) : payload;
    const sessionId = provider === "asaas" ? string(payment.externalReference) : string(payload.order_nsu);
    let session: CheckoutSession | null = null;
    if (isUuid(sessionId)) {
      const { data } = await db.from("payment_checkout_sessions").select("id,organization_id,invoice_id,subscription_id,amount_cents,status").eq("id", sessionId).eq("connection_id", connection.id).maybeSingle();
      session = data as CheckoutSession | null;
    }
    if (!session && provider === "asaas" && payment.subscription) {
      const { data: binding } = await db.from("payment_provider_subscriptions").select("subscription_id").eq("connection_id", connection.id).eq("provider_subscription_id", string(payment.subscription)).maybeSingle();
      if (binding) {
        const { data } = await db.from("payment_checkout_sessions").select("id,organization_id,invoice_id,subscription_id,amount_cents,status").eq("connection_id", connection.id).eq("subscription_id", binding.subscription_id).eq("kind", "recurring_setup").order("created_at", { ascending: false }).limit(1).maybeSingle();
        session = data as CheckoutSession | null;
      }
    }
    if (!session) throw new Error("Sessão de pagamento não encontrada.");
    const amountCents = provider === "asaas" ? Math.round(Number(payment.value || 0) * 100) : Number(payload.amount || 0);
    if (!Number.isInteger(amountCents) || amountCents !== session.amount_cents) throw new Error("Valor recebido não corresponde à cobrança.");
    const providerPaymentId = provider === "asaas" ? string(payment.id) : string(payload.transaction_nsu);
    if (!providerPaymentId) throw new Error("Identificador da transação ausente.");

    let invoiceId = session.invoice_id as string | null;
    if (!invoiceId && session.subscription_id) {
      const dueDate = string(payment.dueDate) || new Date().toISOString().slice(0, 10);
      const { data: existingInvoice } = await db.from("invoices").select("id").eq("organization_id", connection.organization_id).eq("subscription_id", session.subscription_id).eq("due_date", dueDate).neq("status", "cancelled").maybeSingle();
      if (existingInvoice) invoiceId = existingInvoice.id;
      else {
        const { data: subscription } = await db.from("subscriptions").select("member_id,plan:membership_plans(name)").eq("id", session.subscription_id).eq("organization_id", connection.organization_id).single();
        const plan = subscription?.plan as unknown as { name?: string } | null;
        const { data: createdInvoice, error } = await db.from("invoices").insert({ organization_id: connection.organization_id, member_id: subscription?.member_id, subscription_id: session.subscription_id, description: `Mensalidade · ${plan?.name || "Plano"}`, amount_cents: session.amount_cents, due_date: dueDate, status: "open", payment_provider: provider, provider_payment_id: providerPaymentId, provider_status: string(payment.status) || "PENDING", gateway_updated_at: new Date().toISOString() }).select("id").single();
        if (error || !createdInvoice) throw new Error("Não foi possível criar a mensalidade local.");
        invoiceId = createdInvoice.id;
      }
    }
    if (!invoiceId) throw new Error("Cobrança local não encontrada.");

    const now = new Date().toISOString();
    await db.from("invoices").update({ payment_provider: provider, provider_payment_id: providerPaymentId, provider_status: string(payment.status) || eventType, gateway_updated_at: now }).eq("id", invoiceId).eq("organization_id", connection.organization_id);
    if (session.subscription_id && provider === "asaas" && payment.subscription) await db.from("payment_provider_subscriptions").update({ provider_subscription_id: string(payment.subscription), status: "active" }).eq("connection_id", connection.id).eq("subscription_id", session.subscription_id);

    const paid = provider === "infinitepay" || ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(eventType);
    if (paid) {
      const { data: existingPayment } = await db.from("payments").select("id").eq("organization_id", connection.organization_id).eq("provider", provider).eq("provider_payment_id", providerPaymentId).maybeSingle();
      if (!existingPayment) {
        const paidAmount = provider === "infinitepay" ? Number(payload.paid_amount || amountCents) : amountCents;
        await db.from("payments").insert({ organization_id: connection.organization_id, invoice_id: invoiceId, amount_cents: amountCents, method: method(provider, payment), status: "confirmed", transaction_reference: providerPaymentId, provider, provider_payment_id: providerPaymentId, provider_fee_cents: Math.max(0, paidAmount - amountCents), receipt_url: string(payload.receipt_url) || null, paid_at: now });
      }
      await db.from("invoices").update({ status: "paid", paid_at: now, provider_status: "paid", gateway_updated_at: now }).eq("id", invoiceId).eq("organization_id", connection.organization_id);
      await db.from("payment_checkout_sessions").update({ status: "paid", provider_payment_id: providerPaymentId }).eq("id", session.id);
      if (session.subscription_id) {
        await db.from("subscriptions").update({ status: "active" }).eq("id", session.subscription_id).eq("organization_id", connection.organization_id);
        await db.from("payment_provider_subscriptions").update({ status: "active" }).eq("connection_id", connection.id).eq("subscription_id", session.subscription_id);
      }
    } else if (eventType === "PAYMENT_OVERDUE") {
      await db.from("invoices").update({ status: "overdue", provider_status: "overdue", gateway_updated_at: now }).eq("id", invoiceId);
      if (session.subscription_id) {
        await db.from("subscriptions").update({ status: "overdue" }).eq("id", session.subscription_id);
        await db.from("payment_provider_subscriptions").update({ status: "overdue" }).eq("connection_id", connection.id).eq("subscription_id", session.subscription_id);
      }
    } else if (eventType === "PAYMENT_REFUNDED") {
      await db.from("invoices").update({ status: "refunded", provider_status: "refunded", gateway_updated_at: now }).eq("id", invoiceId);
      await db.from("payments").update({ status: "refunded" }).eq("organization_id", connection.organization_id).eq("provider", provider).eq("provider_payment_id", providerPaymentId);
    } else if (eventType === "PAYMENT_DELETED") {
      await db.from("invoices").update({ status: "cancelled", provider_status: "deleted", gateway_updated_at: now }).eq("id", invoiceId);
      if (session.subscription_id) await db.from("payment_provider_subscriptions").update({ status: "cancelled" }).eq("connection_id", connection.id).eq("subscription_id", session.subscription_id);
    }
    await db.from("payment_webhook_events").update({ status: "processed", processed_at: now }).eq("id", event.id);
    return Response.json({ success: true, message: null });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Falha ao processar evento.";
    await db.from("payment_webhook_events").update({ status: "failed", error_message: message, processed_at: new Date().toISOString() }).eq("id", event.id);
    return Response.json({ success: false, message }, { status: 400 });
  }
}
