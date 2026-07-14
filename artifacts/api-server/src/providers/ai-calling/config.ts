// AI calling vendor credentials are not yet supplied. Once you pick a vendor
// (e.g. Twilio, Exotel, a dedicated AI-calling platform), set the matching
// env vars below and implement a provider class satisfying `AiCallingProvider`
// in a new file (e.g. `twilio.provider.ts`), then wire it up in `service.ts`.

export const aiCallingConfig = {
  provider: process.env.AI_CALLING_PROVIDER ?? null, // e.g. "twilio"
  apiKey: process.env.AI_CALLING_API_KEY ?? null,
  apiSecret: process.env.AI_CALLING_API_SECRET ?? null,
  fromNumber: process.env.AI_CALLING_FROM_NUMBER ?? null,
};

export function isAiCallingConfigured(): boolean {
  return Boolean(aiCallingConfig.provider && aiCallingConfig.apiKey);
}
