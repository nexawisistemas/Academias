import "server-only";
import type { GatewayCheckoutInput, GatewayCheckoutResult } from "./types";

export function buildInfinitePayCheckoutPayload(handle: string, input: GatewayCheckoutInput) {
  return {
    handle,
    redirect_url: input.successUrl,
    webhook_url: input.webhookUrl,
    order_nsu: input.reference,
    items: [{ quantity: 1, price: input.amountCents, description: input.description.slice(0, 120) }],
    customer: {
      name: input.customer.name,
      ...(input.customer.email ? { email: input.customer.email } : {}),
      ...(input.customer.phone ? { phone_number: input.customer.phone.replace(/\D/g, "") } : {}),
    },
  };
}

export class InfinitePayGateway {
  constructor(private handle: string) {
    if (!/^[a-zA-Z0-9._-]{2,80}$/.test(handle)) throw new Error("InfiniteTag inválida.");
  }
  async createCheckout(input: GatewayCheckoutInput): Promise<GatewayCheckoutResult> {
    const response = await fetch("https://api.checkout.infinitepay.io/links", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "NexaWi-Academias/1.0" }, body: JSON.stringify(buildInfinitePayCheckoutPayload(this.handle, input)), signal: AbortSignal.timeout(15000), cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(String(payload.message || `InfinitePay respondeu ${response.status}.`));
    const url = String(payload.url || "");
    if (!url) throw new Error("A InfinitePay não retornou o link de pagamento.");
    return { checkoutId: String(payload.invoice_slug || payload.slug || input.reference), url, expiresAt: null, raw: payload };
  }
}
