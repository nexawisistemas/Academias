import "server-only";
import type { GatewayCheckoutInput, GatewayCheckoutResult, GatewayEnvironment } from "./types";

const cycleMap = { monthly: "MONTHLY", quarterly: "QUARTERLY", semiannual: "SEMIANNUALLY", annual: "YEARLY" } as const;

export function buildAsaasCheckoutPayload(input: GatewayCheckoutInput) {
  const document = input.customer.document?.replace(/\D/g, "");
  const customerData = document && [11, 14].includes(document.length) ? {
    name: input.customer.name,
    cpfCnpj: document,
    ...(input.customer.email ? { email: input.customer.email } : {}),
    ...(input.customer.phone ? { phone: input.customer.phone.replace(/\D/g, "") } : {}),
  } : undefined;
  return {
    billingTypes: input.recurring ? ["CREDIT_CARD"] : ["PIX", "CREDIT_CARD"],
    chargeTypes: [input.recurring ? "RECURRENT" : "DETACHED"],
    minutesToExpire: 1440,
    externalReference: input.reference,
    callback: { successUrl: input.successUrl, cancelUrl: input.cancelUrl, expiredUrl: input.expiredUrl },
    items: [{ name: input.description.slice(0, 80), description: input.description.slice(0, 250), quantity: 1, value: input.amountCents / 100 }],
    ...(customerData ? { customerData } : {}),
    ...(input.recurring ? { subscription: { cycle: cycleMap[input.recurring.cycle], nextDueDate: `${input.recurring.nextDueDate} 12:00:00`, ...(input.recurring.endDate ? { endDate: `${input.recurring.endDate} 23:59:59` } : {}) } } : {}),
  };
}

export class AsaasGateway {
  private baseUrl: string;
  constructor(private apiKey: string, private environment: GatewayEnvironment) {
    this.baseUrl = environment === "production" ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
  }
  private async request(path: string, init?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", "User-Agent": "NexaWi-Academias/1.0", access_token: this.apiKey, ...init?.headers }, signal: AbortSignal.timeout(15000), cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      const errors = Array.isArray(payload.errors) ? payload.errors.map((item) => (item as { description?: string }).description).filter(Boolean).join(" ") : "";
      throw new Error(errors || String(payload.message || `Asaas respondeu ${response.status}.`));
    }
    return payload;
  }
  async testConnection() { await this.request("/customers?limit=1"); }
  async createCheckout(input: GatewayCheckoutInput): Promise<GatewayCheckoutResult> {
    const payload = await this.request("/checkouts", { method: "POST", body: JSON.stringify(buildAsaasCheckoutPayload(input)) });
    const checkoutId = String(payload.id || "");
    if (!checkoutId) throw new Error("O Asaas não retornou o identificador do checkout.");
    const fallbackHost = this.environment === "production" ? "https://asaas.com" : "https://sandbox.asaas.com";
    return { checkoutId, url: String(payload.url || `${fallbackHost}/checkoutSession/show?id=${checkoutId}`), expiresAt: null, raw: payload };
  }
  async createWebhook(input: { name: string; url: string; email: string; authToken: string }) {
    return this.request("/webhooks", { method: "POST", body: JSON.stringify({ name: input.name, url: input.url, email: input.email, enabled: true, interrupted: false, apiVersion: 3, authToken: input.authToken, sendType: "SEQUENTIALLY", events: ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_REFUNDED", "PAYMENT_DELETED"] }) });
  }
}
