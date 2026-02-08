import { getLocalStorage } from "@/services/localStorageService";

const RolesGuard = ({ role }: { role: string | string[] }) => {
  const roleLogin = getLocalStorage("userData")?.user?.role_id;

  const isRoleHasAccess = (role: any) => {
    switch (role) {
      case "admin":
        if (roleLogin === "219bc0dd-ec72-4618-b22d-5d5ff612dcaf") {
          return true;
        } else {
          return false;
        }
      case "ptgs-sensus":
        if (roleLogin === "aba1b06f-846a-414b-b223-b002a50c5722") {
          return true;
        } else {
          return false;
        }
      case "bendahara":
        if (roleLogin === "b7721c02-96f7-4238-bc7e-1bcf2e0ebd56") {
          return true;
        } else {
          return false;
        }
      case "admin-kbm":
        if (roleLogin === "e2896d58-4831-458c-9fb7-c4f988c0550c") {
          return true;
        } else {
          return false;
        }
      case "admin-data-center":
        if (roleLogin === "7352e0d6-f5d0-45f2-8eb4-4880cc72bad6") {
          return true;
        } else {
          return false;
        }
      case "pengurus":
        if (roleLogin === "e405d388-541b-487b-87d4-cb0b294cfc11") {
          return true;
        } else {
          return false;
        }
      case "ptgs-absen":
        if (roleLogin === "b511748b-ef40-4999-b4e9-b8ab575ec958") {
          return true;
        } else {
          return false;
        }
      case "all":
        return true;
      default:
        return false;
    }
  };

  // handle role yang berupa array
  if (Array.isArray(role)) {
    return role.some(isRoleHasAccess);
  }

  // handle role yang berupa string
  return isRoleHasAccess(role);
};

export default RolesGuard;
