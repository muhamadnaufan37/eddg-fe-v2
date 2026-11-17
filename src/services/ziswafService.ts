import { axiosServices } from "@/services/axios";

export type DonationType = "zakat" | "infaq" | "sedekah" | "wakaf";
export type DonationStatus =
  | "processing"
  | "pending"
  | "success"
  | "expired"
  | "failed";

export interface ZiswafDonation {
  uuid: string;
  donation_type: DonationType;
  description?: string | null;
  amount: number;
  total_amount?: number | null;
  amount_uniq?: number | null;
  admin_fee?: number | null;
  admin_fee_pct?: number | null;
  credit_amount?: number | null;
  qris_method?: string | null;
  qr_url?: string | null;
  qris_image?: string | null;
  payment_url?: string | null;
  status: DonationStatus;
  is_test?: boolean;
  expired_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  user?: { nama_lengkap?: string | null; name?: string | null } | null;
}

export interface ZiswafWithdrawal {
  uuid: string;
  status: string;
  amount: number;
  fee?: number | null;
  net_amount?: number | null;
  transaction_id?: string | null;
  created_at?: string | null;
}

export interface ZiswafPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface PaginatedResult<T> {
  items: T[];
  pagination: ZiswafPagination;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

const donationPath = "/api/v1/ziswaf/donations";
const withdrawalPath = "/api/v1/ziswaf/admin/withdrawals";

export async function getMyDonations(page = 1, perPage = 10) {
  const response = await axiosServices().get<ApiEnvelope<PaginatedResult<ZiswafDonation>>>(
    donationPath,
    { params: { page, per_page: perPage } },
  );
  return response.data.data;
}

export async function createDonation(payload: {
  request_id: string;
  donation_type: DonationType;
  amount: number;
}) {
  const response = await axiosServices().post<ApiEnvelope<ZiswafDonation>>(
    donationPath,
    payload,
  );
  return response.data.data;
}

export async function getDonation(uuid: string) {
  const response = await axiosServices().get<ApiEnvelope<ZiswafDonation>>(
    `${donationPath}/${encodeURIComponent(uuid)}`,
  );
  return response.data.data;
}

export async function getAdminDonations(
  page = 1,
  perPage = 10,
  filters: { status?: string; donation_type?: string } = {},
) {
  const response = await axiosServices().get<ApiEnvelope<PaginatedResult<ZiswafDonation>>>(
    "/api/v1/ziswaf/admin/donations",
    { params: { page, per_page: perPage, ...filters } },
  );
  return response.data.data;
}

export async function getWithdrawals(page = 1, perPage = 10) {
  const response = await axiosServices().get<ApiEnvelope<PaginatedResult<ZiswafWithdrawal>>>(
    withdrawalPath,
    { params: { page, per_page: perPage } },
  );
  return response.data.data;
}

export async function createWithdrawal(amount: number) {
  const response = await axiosServices().post<ApiEnvelope<ZiswafWithdrawal>>(
    withdrawalPath,
    { amount },
  );
  return response.data.data;
}

export async function getWithdrawal(uuid: string) {
  const response = await axiosServices().get<ApiEnvelope<ZiswafWithdrawal>>(
    `${withdrawalPath}/${encodeURIComponent(uuid)}`,
  );
  return response.data.data;
}
