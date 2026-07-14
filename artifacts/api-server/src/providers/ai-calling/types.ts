export interface PlaceCallInput {
  leadId: number;
  toPhoneNumber: string;
  script?: string;
  companyId: number | null;
}

export interface PlaceCallResult {
  providerCallId: string;
  status: "queued" | "ringing" | "in_progress" | "failed";
}

export interface CallStatusEvent {
  providerCallId: string;
  status: "completed" | "failed" | "no_answer" | "busy";
  durationSeconds?: number;
  recordingUrl?: string;
  transcript?: string;
}

// Any AI calling vendor (e.g. Twilio, Exotel, Vonage, a dedicated AI-calling
// platform) implements this interface. The rest of the app depends only on
// this interface, so swapping/adding a vendor never requires touching
// controllers, routes, or queue code.
export interface AiCallingProvider {
  readonly name: string;
  placeCall(input: PlaceCallInput): Promise<PlaceCallResult>;
  handleWebhookEvent(payload: unknown): CallStatusEvent;
}
