// Payment gateway credentials are not yet supplied. Once you pick a gateway
// (Razorpay and Cashfree are the common choices for Indian real estate
// SaaS billing), set the matching env vars and implement a provider class
// satisfying `PaymentProvider` (e.g. `razorpay.provider.ts`), then wire it
// up in `service.ts`.

export const paymentsConfig = {
  provider: process.env.PAYMENTS_PROVIDER ?? null, // "razorpay" | "cashfree"
  keyId: process.env.PAYMENTS_KEY_ID ?? null,
  keySecret: process.env.PAYMENTS_KEY_SECRET ?? null,
  webhookSecret: process.env.PAYMENTS_WEBHOOK_SECRET ?? null,
};

export function isPaymentsConfigured(): boolean {
  return Boolean(paymentsConfig.provider && paymentsConfig.keyId && paymentsConfig.keySecret);
}
