// Central permission catalog. Roles have a default set of permissions
// (seeded into the `role_permissions` table); companies may customize
// per-role permissions on top of that baseline via the roles module.

export const PERMISSIONS = {
  LEADS_VIEW: "leads.view",
  LEADS_MANAGE: "leads.manage",
  LEADS_DELETE: "leads.delete",
  PIPELINE_MANAGE: "pipeline.manage",
  USERS_MANAGE: "users.manage",
  COMPANY_MANAGE: "company.manage",
  CAMPAIGNS_MANAGE: "campaigns.manage",
  LANDING_PAGES_MANAGE: "landing_pages.manage",
  REPORTS_VIEW: "reports.view",
  SETTINGS_MANAGE: "settings.manage",
  ROLES_MANAGE: "roles.manage",
  CUSTOM_FIELDS_MANAGE: "custom_fields.manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  owner: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS).filter((p) => p !== PERMISSIONS.COMPANY_MANAGE),
  manager: [
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_MANAGE,
    PERMISSIONS.PIPELINE_MANAGE,
    PERMISSIONS.CAMPAIGNS_MANAGE,
    PERMISSIONS.LANDING_PAGES_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.CUSTOM_FIELDS_MANAGE,
  ],
  agent: [PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_MANAGE],
};
