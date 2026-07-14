import { isImageGenerationConfigured } from "./config";
import { ProviderNotConfiguredError } from "../types";
import type { GeneratePosterInput, GeneratePosterResult, ImageGenerationProvider } from "./types";
import { logActivity } from "../../modules/activity/activity.service";

class UnconfiguredImageGenerationProvider implements ImageGenerationProvider {
  readonly name = "unconfigured";
  async generatePoster(): Promise<GeneratePosterResult> {
    throw new ProviderNotConfiguredError("image_generation");
  }
}

function resolveProvider(): ImageGenerationProvider {
  if (!isImageGenerationConfigured()) return new UnconfiguredImageGenerationProvider();
  // When credentials are added, return the concrete implementation, e.g.:
  //   if (imageGenerationConfig.provider === "stability_ai") return new StabilityAiProvider(imageGenerationConfig);
  return new UnconfiguredImageGenerationProvider();
}

export async function generatePoster(input: GeneratePosterInput) {
  const provider = resolveProvider();
  const result = await provider.generatePoster(input);
  await logActivity({ companyId: input.companyId, action: "poster.generated", metadata: { ...result } });
  return result;
}

export function imageGenerationStatus() {
  return { configured: isImageGenerationConfigured(), provider: resolveProvider().name };
}
