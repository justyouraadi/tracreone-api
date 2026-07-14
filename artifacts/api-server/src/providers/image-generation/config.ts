// AI poster generation credentials are not yet supplied. Once an image
// generation vendor is chosen, set the matching env vars and implement a
// provider class satisfying `ImageGenerationProvider`, then wire it up in
// `service.ts`.

export const imageGenerationConfig = {
  provider: process.env.IMAGE_GENERATION_PROVIDER ?? null, // e.g. "stability_ai", "openai"
  apiKey: process.env.IMAGE_GENERATION_API_KEY ?? null,
};

export function isImageGenerationConfigured(): boolean {
  return Boolean(imageGenerationConfig.provider && imageGenerationConfig.apiKey);
}
