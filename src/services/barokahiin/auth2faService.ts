import { AUTH_2FA_BASE, getApiData, postApiData } from "./apiClient";
import type { TwoFactorSetupResponse, TwoFactorStatus } from "./types";

export const get2faStatus = () =>
  getApiData<TwoFactorStatus>(AUTH_2FA_BASE, "/status");

export const setup2fa = () =>
  postApiData<TwoFactorSetupResponse>(AUTH_2FA_BASE, "/setup");

export const confirm2fa = (code: string) =>
  postApiData<TwoFactorStatus>(AUTH_2FA_BASE, "/confirm", { code });

export const verify2fa = (code: string) =>
  postApiData<{ verified: boolean; recovery_codes_remaining?: number }>(
    AUTH_2FA_BASE,
    "/verify",
    { code },
  );

export const disable2fa = (code: string) =>
  postApiData<TwoFactorStatus>(AUTH_2FA_BASE, "/disable", { code });
