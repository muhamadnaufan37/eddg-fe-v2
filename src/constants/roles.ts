/**
 * User role constants
 */
export const ROLES = {
  ADMIN: "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
  ADMIN_DATA_CENTER: "7352e0d6-f5d0-45f2-8eb4-4880cc72bad6",
  PETUGAS_SENSUS: "aba1b06f-846a-414b-b223-b002a50c5722",
  PETUGAS_KBM: "e2896d58-4831-458c-9fb7-c4f988c0550c",
  PENGURUS: "e405d388-541b-487b-87d4-cb0b294cfc11",
  BENDAHARA: "b7721c02-96f7-4238-bc7e-1bcf2e0ebd56",
  PETUGAS_ABSEN: "b511748b-ef40-4999-b4e9-b8ab575ec958",
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

const ROLE_NAMES_BY_ID: Record<RoleId, string> = {
  [ROLES.ADMIN]: "admin",
  [ROLES.ADMIN_DATA_CENTER]: "admin-data-center",
  [ROLES.PETUGAS_SENSUS]: "ptgs-sensus",
  [ROLES.PETUGAS_KBM]: "admin-kbm",
  [ROLES.PENGURUS]: "pengurus",
  [ROLES.BENDAHARA]: "bendahara",
  [ROLES.PETUGAS_ABSEN]: "ptgs-absen",
};

export const getRoleName = (roleId: unknown): string => {
  if (typeof roleId !== "string") {
    return "all";
  }

  return ROLE_NAMES_BY_ID[roleId as RoleId] ?? "all";
};

export const hasRoleAccess = (
  roleId: unknown,
  allowedRoles: string | string[],
): boolean => {
  const roleName = getRoleName(roleId);
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return roles.includes("all") || roles.includes(roleName);
};
