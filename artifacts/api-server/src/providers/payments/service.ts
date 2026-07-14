import { isPaymentsConfigured } from "./config";
import { ProviderNotConfiguredError } from "../types";
import type { CreateSubscriptionOrderInput, CreateSubscriptionOrderResult, PaymentProvider, PaymentWebhookEvent } from "./types";
import { logActivity } from "../../modules/activity/activity.service";

class UnconfiguredPaymentProvider implements PaymentProvider {
  readonly name = "unconfigured";
  async createSubscriptionOrder(): Promise<CreateSubscriptionOrderResult> {
    throw new ProviderNotConfiguredError("payments");
  }
  verifyAndParseWebhook(): PaymentWebhookEvent {
    throw new ProviderNotConfiguredError("payments");
  }
}

function resolveProvider(): PaymentProvider {
  if (!isPaymentsConfigured()) return new UnconfiguredPaymentProvider();
  // When credentials are added, return the concrete implementation, e.g.:
  //   if (paymentsConfig.provider === "razorpay") return new RazorpayProvider(paymentsConfig);
  return new UnconfiguredPaymentProvider();
}

export async function createSubscriptionOrder(input: CreateSubscriptionOrderInput) {
  const provider = resolveProvider();
  const result = await provider.createSubscriptionOrder(input);
  await logActivity({ companyId: input.companyId, action: "billing.order_created", metadata: { ...result } });
  return result;
}

export async function handlePaymentsWebhook(rawBody: Buffer | string, signature: string | undefined) {
  const provider = resolveProvider();
  return provider.verifyAndParseWebhook(rawBody, signature);
}

export function paymentsStatus() {
  return { configured: isPaymentsConfigured(), provider: resolveProvider().name };
}
