import { createAdminClient } from "@/lib/supabase/admin";
import { createGatewayCheckout } from "@/lib/payments/checkout-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function nextBillingDate(value: string, cycle: string) {
  const date = new Date(`${value}T12:00:00Z`);
  const months = cycle === "quarterly" ? 3 : cycle === "semiannual" ? 6 : cycle === "annual" ? 12 : 1;
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ ok: false, message: "Não autorizado." }, { status: 401 });
  const db = createAdminClient();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://academias.nexawi.com.br").replace(/\/$/, "");
  const { data: connections, error } = await db.from("payment_provider_connections").select("id,organization_id,provider").eq("status", "active");
  if (error) return Response.json({ ok: false, message: error.message }, { status: 500 });

  const organizations = [...new Set((connections || []).map((item) => item.organization_id))];
  let invoicesGenerated = 0; let linksGenerated = 0; const failures: Array<{ organizationId: string; message: string }> = [];
  for (const organizationId of organizations) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: dueSubscriptions, error: generationError } = await db.from("subscriptions").select("id,member_id,next_billing_on,amount_cents,discount_cents,plan:membership_plans(name,billing_cycle)").eq("organization_id", organizationId).in("status", ["active", "overdue"]).lte("next_billing_on", today);
    if (generationError) { failures.push({ organizationId, message: generationError.message }); continue; }
    for (const subscription of dueSubscriptions || []) {
      if (!subscription.next_billing_on) continue;
      const plan = subscription.plan as unknown as { name?: string; billing_cycle?: string } | null;
      const { data: existingInvoice } = await db.from("invoices").select("id").eq("organization_id", organizationId).eq("subscription_id", subscription.id).eq("due_date", subscription.next_billing_on).neq("status", "cancelled").maybeSingle();
      if (!existingInvoice) {
        const { error: invoiceError } = await db.from("invoices").insert({ organization_id: organizationId, member_id: subscription.member_id, subscription_id: subscription.id, description: `Mensalidade · ${plan?.name || "Plano"}`, amount_cents: subscription.amount_cents - subscription.discount_cents, due_date: subscription.next_billing_on, status: "open" });
        if (invoiceError) { failures.push({ organizationId, message: invoiceError.message }); continue; }
        invoicesGenerated += 1;
      }
      await db.from("subscriptions").update({ next_billing_on: nextBillingDate(subscription.next_billing_on, plan?.billing_cycle || "monthly") }).eq("id", subscription.id).eq("organization_id", organizationId);
    }
    const infinitePay = connections?.find((item) => item.organization_id === organizationId && item.provider === "infinitepay");
    if (!infinitePay) continue;
    const { data: bindings } = await db.from("payment_provider_subscriptions").select("subscription_id").eq("connection_id", infinitePay.id).eq("mode", "invoice_link").eq("status", "active");
    const subscriptionIds = (bindings || []).map((item) => item.subscription_id);
    if (!subscriptionIds.length) continue;
    const { data: invoices } = await db.from("invoices").select("id").eq("organization_id", organizationId).in("subscription_id", subscriptionIds).in("status", ["open", "overdue"]).is("payment_url", null).lte("due_date", today);
    for (const invoice of invoices || []) {
      try { await createGatewayCheckout(db, { provider: "infinitepay", organizationId, invoiceId: invoice.id, baseUrl }); linksGenerated += 1; }
      catch (checkoutError) { failures.push({ organizationId, message: checkoutError instanceof Error ? checkoutError.message : "Falha ao gerar checkout InfinitePay." }); }
    }
  }
  return Response.json({ ok: failures.length === 0, organizations: organizations.length, invoicesGenerated, linksGenerated, failures });
}
