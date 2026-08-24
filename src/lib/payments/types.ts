export type PaymentProvider = "asaas" | "infinitepay";
export type GatewayEnvironment = "sandbox" | "production";
export type BillingCycle = "monthly" | "quarterly" | "semiannual" | "annual";

export type CheckoutCustomer = { name: string; email?: string | null; phone?: string | null; document?: string | null };
export type GatewayCheckoutInput = {
  reference: string;
  description: string;
  amountCents: number;
  customer: CheckoutCustomer;
  successUrl: string;
  cancelUrl: string;
  expiredUrl: string;
  webhookUrl: string;
  recurring?: { cycle: BillingCycle; nextDueDate: string; endDate?: string | null };
};
export type GatewayCheckoutResult = { checkoutId: string; url: string; expiresAt?: string | null; raw: Record<string, unknown> };

export type PaymentProviderConnection = {
  id: string;
  organization_id: string;
  provider: PaymentProvider;
  environment: GatewayEnvironment;
  status: string;
  config: Record<string, unknown>;
  credentials_ciphertext: string | null;
};

export const gatewayCapabilities = {
  asaas: { nativeRecurring: true, invoiceCheckout: true, pix: true, creditCard: true, webhookAuthentication: "header" },
  infinitepay: { nativeRecurring: false, invoiceCheckout: true, pix: true, creditCard: true, webhookAuthentication: "secret-url" },
} as const;
