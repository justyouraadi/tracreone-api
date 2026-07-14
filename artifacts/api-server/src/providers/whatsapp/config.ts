// WhatsApp Business API credentials are not yet supplied. The legacy
// `whatsapp_providers` table already models per-company provider settings
// (apikey, authtoken, phonenumber, etc.) — once credentials exist there or
// in env vars, implement a provider class satisfying `WhatsAppProvider`
// (e.g. `metaCloudApi.provider.ts`) and wire it up in `service.ts`.

export const whatsAppConfig = {
  provider: process.env.WHATSAPP_PROVIDER ?? null, // e.g. "meta_cloud_api", "twilio", "gupshup"
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? null,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? null,
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? null,
};

export function isWhatsAppConfigured(): boolean {
  return Boolean(whatsAppConfig.provider && whatsAppConfig.accessToken && whatsAppConfig.phoneNumberId);
}
