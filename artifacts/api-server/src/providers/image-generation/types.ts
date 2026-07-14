export interface GeneratePosterInput {
  companyId: number | null;
  prompt: string;
  landingPageId?: number;
  templateStyle?: string;
}

export interface GeneratePosterResult {
  providerJobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  imageUrl?: string;
}

// Implemented once an image-generation vendor (e.g. Stability AI, an
// internal Replit image-generation call, DALL-E) is configured.
export interface ImageGenerationProvider {
  readonly name: string;
  generatePoster(input: GeneratePosterInput): Promise<GeneratePosterResult>;
}
