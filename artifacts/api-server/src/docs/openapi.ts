export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Tracre One API",
    version: "1.0.0",
    description: "Backend API for the Tracre One AI-powered real estate CRM.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/healthz": {
      get: { security: [], summary: "Health check", responses: { "200": { description: "OK" } } },
    },
    "/v1/auth/register": {
      post: {
        security: [],
        summary: "Register a new company + owner account",
        responses: { "201": { description: "Created" } },
      },
    },
    "/v1/auth/login": {
      post: { security: [], summary: "Login with email and password", responses: { "200": { description: "OK" } } },
    },
    "/v1/auth/refresh": {
      post: { security: [], summary: "Exchange a refresh token for a new token pair", responses: { "200": { description: "OK" } } },
    },
    "/v1/auth/logout": {
      post: { security: [], summary: "Revoke a refresh token", responses: { "204": { description: "No Content" } } },
    },
    "/v1/auth/otp/request": {
      post: { security: [], summary: "Request an OTP code for phone login", responses: { "200": { description: "OK" } } },
    },
    "/v1/auth/otp/verify": {
      post: { security: [], summary: "Verify OTP and receive tokens", responses: { "200": { description: "OK" } } },
    },
    "/v1/auth/me": {
      get: { summary: "Get the current authenticated user", responses: { "200": { description: "OK" } } },
    },
    "/v1/companies": {
      get: { summary: "Get the current company", responses: { "200": { description: "OK" } } },
      patch: { summary: "Update the current company (owner/admin)", responses: { "200": { description: "OK" } } },
    },
    "/v1/users": {
      get: { summary: "List users in the current company", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a team member (owner/admin)", responses: { "201": { description: "Created" } } },
    },
    "/v1/users/{id}": {
      get: { summary: "Get a user", responses: { "200": { description: "OK" } } },
      patch: { summary: "Update a user", responses: { "200": { description: "OK" } } },
      delete: { summary: "Deactivate a user", responses: { "204": { description: "No Content" } } },
    },
    "/v1/pipeline-stages": {
      get: { summary: "List pipeline stages", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a pipeline stage", responses: { "201": { description: "Created" } } },
    },
    "/v1/tags": {
      get: { summary: "List tags", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a tag", responses: { "201": { description: "Created" } } },
    },
    "/v1/leads": {
      get: { summary: "List leads (filterable, paginated)", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a lead", responses: { "201": { description: "Created" } } },
    },
    "/v1/leads/{id}": {
      get: { summary: "Get a lead with notes, tags, follow-ups", responses: { "200": { description: "OK" } } },
      patch: { summary: "Update a lead", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete a lead", responses: { "204": { description: "No Content" } } },
    },
    "/v1/leads/{id}/assign": {
      post: { summary: "Assign a lead to a team member", responses: { "200": { description: "OK" } } },
    },
    "/v1/leads/{id}/notes": {
      post: { summary: "Add a note to a lead", responses: { "201": { description: "Created" } } },
    },
    "/v1/leads/{id}/tags": {
      post: { summary: "Attach a tag to a lead", responses: { "201": { description: "Created" } } },
    },
    "/v1/follow-ups": {
      get: { summary: "List follow-ups", responses: { "200": { description: "OK" } } },
      post: { summary: "Schedule a follow-up", responses: { "201": { description: "Created" } } },
    },
    "/v1/follow-ups/{id}": {
      patch: { summary: "Update a follow-up", responses: { "200": { description: "OK" } } },
      delete: { summary: "Cancel/delete a follow-up", responses: { "204": { description: "No Content" } } },
    },
    "/v1/activity-logs": {
      get: { summary: "List activity/audit log entries", responses: { "200": { description: "OK" } } },
    },
    "/v1/landing-pages": {
      get: { summary: "List landing pages", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a landing page", responses: { "201": { description: "Created" } } },
    },
    "/v1/landing-pages/{id}": {
      get: { summary: "Get a landing page", responses: { "200": { description: "OK" } } },
      patch: { summary: "Update a landing page", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete a landing page", responses: { "204": { description: "No Content" } } },
    },
    "/v1/landing-pages/public/{slug}": {
      get: {
        security: [],
        summary: "Get a published landing page by slug (public, unauthenticated)",
        responses: { "200": { description: "OK" } },
      },
    },
    "/v1/lead-capture": {
      post: {
        security: [],
        summary: "Public lead capture endpoint (rate-limited)",
        responses: { "201": { description: "Created" } },
      },
    },
    "/v1/campaigns": {
      get: { summary: "List campaigns", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a campaign", responses: { "201": { description: "Created" } } },
    },
    "/v1/campaigns/{id}": {
      get: { summary: "Get a campaign", responses: { "200": { description: "OK" } } },
      patch: { summary: "Update a campaign", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete a campaign", responses: { "204": { description: "No Content" } } },
    },
    "/v1/notifications": {
      get: { summary: "List notifications for the current user", responses: { "200": { description: "OK" } } },
    },
    "/v1/notifications/{id}/read": {
      post: { summary: "Mark a notification as read", responses: { "200": { description: "OK" } } },
    },
    "/v1/notifications/read-all": {
      post: { summary: "Mark all notifications as read", responses: { "200": { description: "OK" } } },
    },
    "/v1/settings": {
      get: { summary: "List company settings as a key/value map", responses: { "200": { description: "OK" } } },
    },
    "/v1/settings/{key}": {
      get: { summary: "Get a single setting", responses: { "200": { description: "OK" } } },
      put: { summary: "Upsert a setting", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete a setting", responses: { "204": { description: "No Content" } } },
    },
    "/v1/custom-fields": {
      get: { summary: "List custom field definitions", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a custom field definition", responses: { "201": { description: "Created" } } },
    },
    "/v1/custom-fields/{id}": {
      patch: { summary: "Update a custom field definition", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete a custom field definition", responses: { "204": { description: "No Content" } } },
    },
    "/v1/leads/{id}/custom-fields": {
      put: { summary: "Set a custom field value on a lead", responses: { "200": { description: "OK" } } },
    },
    "/v1/lead-sources": {
      get: { summary: "List lead sources", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a lead source", responses: { "201": { description: "Created" } } },
    },
    "/v1/lead-sources/{id}": {
      patch: { summary: "Update a lead source", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete a lead source", responses: { "204": { description: "No Content" } } },
    },
    "/v1/lead-statuses": {
      get: { summary: "List lead statuses", responses: { "200": { description: "OK" } } },
      post: { summary: "Create a lead status", responses: { "201": { description: "Created" } } },
    },
    "/v1/lead-statuses/{id}": {
      patch: { summary: "Update a lead status", responses: { "200": { description: "OK" } } },
      delete: { summary: "Delete a lead status", responses: { "204": { description: "No Content" } } },
    },
    "/v1/analytics/dashboard": {
      get: { summary: "Dashboard summary metrics", responses: { "200": { description: "OK" } } },
    },
    "/v1/analytics/pipeline": {
      get: { summary: "Pipeline conversion analytics", responses: { "200": { description: "OK" } } },
    },
    "/v1/analytics/team-performance": {
      get: { summary: "Per-agent team performance metrics", responses: { "200": { description: "OK" } } },
    },
    "/v1/reports/leads": {
      get: { summary: "Leads report (JSON or CSV via ?format=csv)", responses: { "200": { description: "OK" } } },
    },
    "/v1/reports/follow-ups": {
      get: { summary: "Follow-ups report (JSON or CSV)", responses: { "200": { description: "OK" } } },
    },
    "/v1/reports/activity": {
      get: { summary: "Activity log report (JSON or CSV)", responses: { "200": { description: "OK" } } },
    },
    "/v1/search": {
      get: { summary: "Global search across leads/users/campaigns/landing pages", responses: { "200": { description: "OK" } } },
    },
    "/v1/profile": {
      get: { summary: "Get the current user's profile", responses: { "200": { description: "OK" } } },
      patch: { summary: "Update the current user's profile", responses: { "200": { description: "OK" } } },
    },
    "/v1/roles": {
      get: { summary: "Get role -> permission mappings for the company", responses: { "200": { description: "OK" } } },
    },
    "/v1/roles/{role}": {
      put: { summary: "Update permissions for a role (owner/admin)", responses: { "200": { description: "OK" } } },
    },
    "/v1/storage/uploads/request-url": {
      post: { summary: "Request a presigned upload URL", responses: { "200": { description: "OK" } } },
    },
    "/v1/storage/uploads/confirm": {
      post: { summary: "Confirm an upload and register a FileAsset", responses: { "201": { description: "Created" } } },
    },
    "/v1/storage/uploads": {
      get: { summary: "List uploaded files (optionally by leadId)", responses: { "200": { description: "OK" } } },
    },
    "/v1/storage/uploads/{id}": {
      delete: { summary: "Delete an uploaded file", responses: { "204": { description: "No Content" } } },
    },
    "/v1/storage/public-objects/{filePath}": {
      get: { security: [], summary: "Serve a public object asset", responses: { "200": { description: "OK" } } },
    },
    "/v1/storage/objects/{path}": {
      get: { summary: "Serve a private object asset", responses: { "200": { description: "OK" } } },
    },
    "/v1/providers/ai-calling/calls": {
      post: {
        summary: "Initiate an AI call (503 until a provider is configured)",
        responses: { "503": { description: "Provider not configured" } },
      },
    },
    "/v1/providers/whatsapp/messages": {
      post: {
        summary: "Send a WhatsApp message (503 until a provider is configured)",
        responses: { "503": { description: "Provider not configured" } },
      },
    },
    "/v1/providers/payments/orders": {
      post: {
        summary: "Create a payment order (503 until a provider is configured)",
        responses: { "503": { description: "Provider not configured" } },
      },
    },
    "/v1/providers/image-generation/generate": {
      post: {
        summary: "Generate an image (503 until a provider is configured)",
        responses: { "503": { description: "Provider not configured" } },
      },
    },
  },
};
