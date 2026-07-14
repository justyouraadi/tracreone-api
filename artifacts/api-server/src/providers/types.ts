export class ProviderNotConfiguredError extends Error {
  constructor(providerType: string) {
    super(
      `The "${providerType}" provider is not configured yet. Add the required credentials (see src/providers/${providerType}/config.ts) to enable it — no code changes are needed once credentials are supplied.`,
    );
    this.name = "ProviderNotConfiguredError";
  }
}
