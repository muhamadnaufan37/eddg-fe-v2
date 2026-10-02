import { getLocalStorage } from "@/services/localStorageService";

const ROLE_IDS = {
  ADMIN: "219bc0dd-ec72-4618-b22d-5d5ff612dcaf",
  PTGS_SENSUS: "aba1b06f-846a-414b-b223-b002a50c5722",
  ADMIN_DATA_CENTER: "7352e0d6-f5d0-45f2-8eb4-4880cc72bad6",
  PENGURUS: "e405d388-541b-487b-87d4-cb0b294cfc11",
  BENDAHARA: "b7721c02-96f7-4238-bc7e-1bcf2e0ebd56",
  ADMIN_KBM: "e2896d58-4831-458c-9fb7-c4f988c0550c",
  PTGS_ABSEN: "b511748b-ef40-4999-b4e9-b8ab575ec958",
} as const;

/**
 * Returns permission flags for the currently logged-in user.
 *
 * - `isAdmin`          : Superadmin / full access
 * - `isPtgsSensus`     : Operator Sensus (can create/edit sensus in their area)
 * - `isAdminDataCenter`: Operator Admin Data Center (same menus as pengurus, full CRUD)
 * - `isPengurus`       : Pengurus (same menus as admin-data-center, VIEW ONLY)
 * - `isViewOnly`       : true when the user can only view data (pengurus)
 * - `canEdit`          : true when the user is allowed to create/edit/delete
 */
export const usePermission = () => {
  const roleId = getLocalStorage("userData")?.user?.role_id as string | undefined;

  const isAdmin = roleId === ROLE_IDS.ADMIN;
  const isPtgsSensus = roleId === ROLE_IDS.PTGS_SENSUS;
  const isAdminDataCenter = roleId === ROLE_IDS.ADMIN_DATA_CENTER;
  const isPengurus = roleId === ROLE_IDS.PENGURUS;
  const isBendahara = roleId === ROLE_IDS.BENDAHARA;
  const isAdminKbm = roleId === ROLE_IDS.ADMIN_KBM;
  const isPtgsAbsen = roleId === ROLE_IDS.PTGS_ABSEN;

  /** User can only view, cannot create / edit / delete */
  const isViewOnly = isPengurus;

  /** User is allowed to mutate data */
  const canEdit = isAdmin || isPtgsSensus || isAdminDataCenter;

  return {
    roleId,
    isAdmin,
    isPtgsSensus,
    isAdminDataCenter,
    isPengurus,
    isBendahara,
    isAdminKbm,
    isPtgsAbsen,
    isViewOnly,
    canEdit,
    ROLE_IDS,
  };
};

export default usePermission;
