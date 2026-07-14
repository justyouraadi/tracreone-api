export interface CreateSubscriptionOrderInput {
  companyId: number;
  planId: string;
  amount: number;
  currency: string;
}

export interface CreateSubscriptionOrderResult {
  providerOrderId: string;
  checkoutUrl: string;
  status: "created";
}

export interface PaymentWebhookEvent {
  providerOrderId: string;
  status: "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
}

// Implemented by Razorpay/Cashfree/Stripe once credentials are supplied.
export interface PaymentProvider {
  readonly name: string;
  createSubscriptionOrder(input: CreateSubscriptionOrderInput): Promise<CreateSubscriptionOrderResult>;
  verifyAndParseWebhook(rawBody: Buffer | string, signature: string | undefined): PaymentWebhookEvent;
}
