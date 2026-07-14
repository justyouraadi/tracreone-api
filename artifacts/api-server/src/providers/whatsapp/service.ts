import { isWhatsAppConfigured } from "./config";
import { ProviderNotConfiguredError } from "../types";
import type { SendWhatsAppMessageInput, SendWhatsAppMessageResult, WhatsAppInboundEvent, WhatsAppProvider } from "./types";
import { prisma } from "../../config/prisma";

class UnconfiguredWhatsAppProvider implements WhatsAppProvider {
  readonly name = "unconfigured";
  async sendMessage(): Promise<SendWhatsAppMessageResult> {
    throw new ProviderNotConfiguredError("whatsapp");
  }
  parseInboundWebhook(): WhatsAppInboundEvent {
    throw new ProviderNotConfiguredError("whatsapp");
  }
}

function resolveProvider(): WhatsAppProvider {
  if (!isWhatsAppConfigured()) return new UnconfiguredWhatsAppProvider();
  // When credentials are added, return the concrete implementation, e.g.:
  //   if (whatsAppConfig.provider === "meta_cloud_api") return new MetaCloudApiProvider(whatsAppConfig);
  return new UnconfiguredWhatsAppProvider();
}

export async function sendWhatsAppMessage(input: SendWhatsAppMessageInput) {
  const provider = resolveProvider();
  const result = await provider.sendMessage(input);

  // Persist onto the existing legacy chat/message tables so the Android
  // app's WhatsApp views keep working unchanged.
  if (input.leadId) {
    const chat = await prisma.whatsapp_chats.findFirst({ where: { leadid: input.leadId } });
    if (chat) {
      await prisma.whatsapp_messages.create({
        data: {
          chatid: chat.id,
          sender: "agent",
          text: input.body,
          timestamp: BigInt(Date.now()),
          status: result.status,
        },
      });
    }
  }

  return result;
}

export async function receiveWhatsAppWebhook(payload: unknown) {
  const provider = resolveProvider();
  const event = provider.parseInboundWebhook(payload);

  const chat = await prisma.whatsapp_chats.findFirst({ where: { contactphone: event.fromPhoneNumber } });
  if (chat) {
    await prisma.whatsapp_messages.create({
      data: {
        chatid: chat.id,
        sender: "contact",
        text: event.body,
        timestamp: BigInt(event.receivedAt.getTime()),
        status: "received",
      },
    });
    await prisma.whatsapp_chats.update({
      where: { id: chat.id },
      data: {
        lastmessage: event.body,
        lastmessagetime: BigInt(event.receivedAt.getTime()),
        unreadcount: (chat.unreadcount ?? 0) + 1,
      },
    });
  }

  return event;
}

export function whatsAppStatus() {
  return { configured: isWhatsAppConfigured(), provider: resolveProvider().name };
}
