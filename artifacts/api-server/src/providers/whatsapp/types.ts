export interface SendWhatsAppMessageInput {
  toPhoneNumber: string;
  templateName?: string;
  body: string;
  leadId?: number;
  companyId: number | null;
}

export interface SendWhatsAppMessageResult {
  providerMessageId: string;
  status: "queued" | "sent" | "failed";
}

export interface WhatsAppInboundEvent {
  fromPhoneNumber: string;
  body: string;
  providerMessageId: string;
  receivedAt: Date;
}

// Wraps the existing legacy `whatsapp_*` tables (chats/messages/templates)
// with a provider-agnostic interface for actually sending/receiving
// messages via WhatsApp Business API (e.g. Meta Cloud API, Twilio, Gupshup).
export interface WhatsAppProvider {
  readonly name: string;
  sendMessage(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult>;
  parseInboundWebhook(payload: unknown): WhatsAppInboundEvent;
}
