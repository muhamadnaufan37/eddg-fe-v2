/**
 * User role constants
 */
export const ROLES = {
  ADMIN: "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
  PETUGAS_SENSUS: "aba1b06f-846a-414b-b223-b002a50c5722",
  PETUGAS_KBM: "e2896d58-4831-458c-9fb7-c4f988c0550c",
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];
