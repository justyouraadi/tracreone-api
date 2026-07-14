import { describe, it, expect } from "vitest";
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "./permissions";

describe("DEFAULT_ROLE_PERMISSIONS", () => {
  it("gives owner every permission in the catalog", () => {
    expect(new Set(DEFAULT_ROLE_PERMISSIONS.owner)).toEqual(new Set(Object.values(PERMISSIONS)));
  });

  it("excludes company.manage from admin", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.admin).not.toContain(PERMISSIONS.COMPANY_MANAGE);
  });

  it("only grants agents lead view/manage", () => {
    expect(new Set(DEFAULT_ROLE_PERMISSIONS.agent)).toEqual(
      new Set([PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_MANAGE]),
    );
  });

  it("defines a permission set for every known role", () => {
    for (const role of ["owner", "admin", "manager", "agent"]) {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });
});
