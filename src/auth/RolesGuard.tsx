import { getLocalStorage } from "@/services/localStorageService";
import { hasRoleAccess } from "@/constants/roles";

const RolesGuard = ({ role }: { role: string | string[] }) => {
  const roleLogin = getLocalStorage("userData")?.user?.role_id;

  return hasRoleAccess(roleLogin, role);
};

export default RolesGuard;
