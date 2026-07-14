import { isAiCallingConfigured } from "./config";
import { ProviderNotConfiguredError } from "../types";
import type { AiCallingProvider, CallStatusEvent, PlaceCallInput, PlaceCallResult } from "./types";
import { prisma } from "../../config/prisma";
import { logActivity } from "../../modules/activity/activity.service";
import { logger } from "../../lib/logger";

// Placeholder provider used until real credentials are configured. Throws
// rather than silently succeeding, so callers get a clear, actionable error
// instead of fake/mocked call data.
class UnconfiguredAiCallingProvider implements AiCallingProvider {
  readonly name = "unconfigured";
  async placeCall(): Promise<PlaceCallResult> {
    throw new ProviderNotConfiguredError("ai_calling");
  }
  handleWebhookEvent(): CallStatusEvent {
    throw new ProviderNotConfiguredError("ai_calling");
  }
}

function resolveProvider(): AiCallingProvider {
  if (!isAiCallingConfigured()) return new UnconfiguredAiCallingProvider();
  // When credentials are added, resolve and return the concrete provider
  // implementation here, e.g.:
  //   if (aiCallingConfig.provider === "twilio") return new TwilioAiCallingProvider(aiCallingConfig);
  return new UnconfiguredAiCallingProvider();
}

export async function placeAiCall(input: PlaceCallInput) {
  const provider = resolveProvider();
  const result = await provider.placeCall(input);
  await logActivity({
    companyId: input.companyId,
    leadId: input.leadId,
    action: "ai_call.placed",
    metadata: { providerCallId: result.providerCallId, provider: provider.name },
  });
  return result;
}

export async function handleAiCallingWebhook(payload: unknown) {
  const provider = resolveProvider();
  const event = provider.handleWebhookEvent(payload);
  logger.info({ event }, "AI calling webhook processed");
  await prisma.activityLog.create({
    data: { action: "ai_call.status_update", metadata: event as unknown as never },
  });
  return event;
}

export function aiCallingStatus() {
  return { configured: isAiCallingConfigured(), provider: resolveProvider().name };
}
