# Panduan Integrasi Frontend 2: Konsol `digitaldatagenerus` (Koordinator & Admin)

Dokumen ini khusus untuk tim **Frontend Konsol `digitaldatagenerus`** yang mengonsumsi:
- **API Konsol Koordinator** (terikat wilayah & kepemilikan): `/api/v1/barokahiin/console/*`
- **API Admin** (Super Admin / Reviewer / Keuangan, `role_id` `1` & `3`): `/api/v1/barokahiin/admin/*`

Postman Collection siap impor: [barokahiin-v0.5.postman_collection.json](./postman/barokahiin-v0.5.postman_collection.json) (gunakan folder **3. Console** dan **4. Admin**).

---

## 1. Autentikasi & Konvensi

- **Base URL**: `https://apimain.digitaldatagenerus.com/api/v1` (atau `http://127.0.0.1:8000/api/v1` di lokal)
- **Login**: gunakan endpoint JWT login `POST /api/v1/login` yang sudah ada, lalu kirim `Authorization: Bearer <token>` pada setiap request konsol/admin yang memerlukan autentikasi. Endpoint referensi wilayah publik di bawah tidak memerlukan token.
- **Header `Idempotency-Key`**: wajib/disarankan pada `POST /console/payouts`, `POST /admin/ledger/adjustments`, dan `POST /admin/pool/allocate`.
- **Cakupan Wilayah (Koordinator)**: server menyaring semua data donatur, barang, pesanan, dan program berdasarkan wilayah penugasan koordinator. Akses ke objek luar wilayah mengembalikan **`404 NOT_FOUND` / `OUT_OF_SCOPE`** (bukan `403`).
- **Optimistic Concurrency (Edit Barang)**: kirim field `version` pada `PATCH /console/items/{uuid}`. Bila ada konflik edit bersamaan, server membalas **`409 VERSION_CONFLICT`** — tampilkan notifikasi dan muat ulang data terbaru.

### 1.1 Referensi API Wilayah untuk Form Koordinator

Gunakan endpoint publik berikut untuk mengisi dropdown wilayah atau filter wilayah di konsol. Endpoint ini **tidak memerlukan `Authorization: Bearer` maupun refresh token**. URL kanonisnya memakai prefix `/api/v1/public/wilayah`; prefix lama `/api/v1/data_center/wilayah` juga tersedia, tetapi frontend sebaiknya memakai URL kanonis.

| Method | Endpoint | Kegunaan |
|---|---|---|
| `GET` | `/public/wilayah/filters` | Data administratif dan organisasi dalam satu respons; mendukung filter bertingkat. |
| `GET` | `/public/wilayah/provinces` | Daftar provinsi. |
| `GET` | `/public/wilayah/regencies/{provinceCode}` | Kabupaten/kota berdasarkan kode provinsi. |
| `GET` | `/public/wilayah/districts/{regencyCode}` | Kecamatan berdasarkan kode kabupaten/kota. |
| `GET` | `/public/wilayah/villages/{districtCode}` | Kelurahan/desa administratif berdasarkan kode kecamatan. |
| `GET` | `/public/wilayah/tree` | Hierarki organisasi `daerah → desa → kelompok`. |
| `GET` | `/public/wilayah/detail?type={type}&id={id}` | Detail `daerah`, `desa`, atau `kelompok` berdasarkan ID. |

Semua URL di tabel relatif terhadap base URL API, misalnya `https://apimain.digitaldatagenerus.com/api/v1`.

#### Dropdown wilayah administratif

Untuk dropdown bertingkat, panggil endpoint berikut ketika pilihan sebelumnya berubah:

1. `GET /public/wilayah/provinces`
2. `GET /public/wilayah/regencies/{provinceCode}`
3. `GET /public/wilayah/districts/{regencyCode}`
4. `GET /public/wilayah/villages/{districtCode}`

Atau gunakan endpoint gabungan `GET /public/wilayah/filters` dengan query parameter opsional:

| Parameter | Fungsi |
|---|---|
| `province_code` | Memilih provinsi dan memuat kabupaten/kota yang cocok. |
| `regency_code` | Memuat kecamatan yang cocok. |
| `district_code` | Memuat kelurahan/desa administratif yang cocok. |
| `village_code` | Memfilter kelompok organisasi yang memiliki kode kelurahan/desa tersebut. |
| `daerah_id` | Memilih daerah organisasi untuk membatasi daftar desa. |
| `desa_id` | Memilih desa organisasi untuk membatasi daftar kelompok. |

Contoh: `GET /public/wilayah/filters?province_code={provinceCode}&regency_code={regencyCode}&daerah_id={daerahId}`. Respons mengelompokkan daftar kode administratif dan wilayah organisasi:

```json
{
  "success": true,
  "data": {
    "administratif": {
      "provinces": [],
      "regencies": [],
      "districts": [],
      "villages": []
    },
    "organisasi": {
      "daerah": [],
      "desa": [],
      "kelompok": []
    }
  }
}
```

`tree` berguna jika frontend membutuhkan hierarki organisasi sekaligus atau ingin menyimpannya sebagai cache. Endpoint referensi ini mengembalikan data aktif secara umum; **bukan** daftar penugasan khusus koordinator dan bukan pengganti pemeriksaan cakupan akses. Pengiriman atau perubahan data tetap harus mengikuti endpoint konsol yang melakukan validasi wilayah di server.

---

## 2. Alur & Endpoint Koordinator (`/api/v1/barokahiin/console`)

### 2.1 Dasbor, Toko, & Alamat Terverifikasi
- `GET /console/dashboard` — Ringkasan `coordinator` (`status`, `level`), `store` (`status`, `store_score`), `items_by_status`, `orders_to_fulfill`, dan `wallet` (`pending_idr`, `available_idr`, `payout_hold_idr`, `charity_share_pct`).
- `GET /console/store`, `PATCH /console/store` — Kelola profil toko (`nama`, `deskripsi`, `kebijakan_tambahan`, `jam_operasional`).
- `POST /console/store/address/submit` — Ajukan alamat toko lengkap untuk verifikasi `V1–V8` oleh Admin (`jalan_nomor`, `rt_rw`, `region_id`, `kode_pos`, `patokan`, `lat`, `lng`, `jenis_tempat`, `status_penguasaan`, `foto_media_ids`, `bukti_ref`, `kontak_toko`).
  - *Catatan*: Ubah alamat akan ditolak (`409 ACTIVE_ORDERS_EXIST`) selama masih ada pesanan aktif (`dibayar`, `disiapkan`, `siap_diambil`, `dikirim`).
- `POST /console/store/pause` (`{ "days": 1..30 }`) & `POST /console/store/resume` — Jeda/aktifkan toko (pesanan yang sudah dibayar tetap wajib diselesaikan).
- `GET /console/store/score` — Hitung & tampilkan Skor Toko beserta komponennya (`sla`, `komplain`, `rating`, `audit`, `kelengkapan`).

### 2.2 Donatur & Persetujuan
- `GET /console/donors`, `GET /console/donors/{uuid}`
- `POST /console/donors` (`region_id`, `nama`, `kontak`, `anonim`, `catatan`) — periksa `data.duplicate_warning` bila kontak sudah pernah terdaftar.
- `POST /console/donors/{uuid}/consents` (`jenis`: `"jual"` | `"publikasi_media"`, `bukti_ref`) — **wajib keduanya aktif** sebelum barang bisa diajukan review.
- `POST /console/donors/{uuid}/anonymize` — Anonimkan data pribadi donatur atas permintaan.

### 2.3 Barang, Media, & Checklist SOP Dinamis
1. **Buat Draf Barang**: `POST /console/items` (`donor_uuid`, `category_id`, `jalur`: `jual|charity|salurkan`, `charity_program_id?`, `grade`: `A|B|C`, `judul`, `keterangan`, `kekurangan`, `weight_g`, `dim_l_cm`, `dim_w_cm`, `dim_h_cm`, `ref_new_price_idr`, `price_idr`, `lokasi_penyimpanan`, `serial_imei?`).
   - Kategori makanan/terlarang (`MK`) otomatis ditolak `422 FORBIDDEN_CATEGORY`.
2. **Unggah Media**: `POST /console/media/uploads` (`multipart/form-data`)
   - Field: `owner_type` (`item|store|store_address|program|fulfillment`), `owner_uuid`, `tipe` (`foto|video`), `file`, `alt?`, `urutan?`, `check_id?`, `durasi_dtk?`, `is_cover?`.
   - Metadata EXIF/GPS foto otomatis dihapus server (`exif_dihapus: true`). Foto minimum 4 (maks 10), video maks 2 (≤ 60 detik, ≤ 100 MB).
3. **Checklist SOP**:
   - `GET /console/items/{uuid}/sop` — Render daftar checklist dinamis (`U01–U13` + kategori) dan tampilkan `data.gate_errors[]` sebagai daftar syarat yang belum terpenuhi.
   - `PUT /console/items/{uuid}/sop/{checkCode}` (`{ "nilai": true, "media_id": null, "teks_keterbukaan": null }`).
4. **Ajukan Review / Tarik / Terbitkan Ulang**:
   - `POST /console/items/{uuid}/submit` — Mengajukan barang `draft`/`perlu_revisi` → `menunggu_review` (server menegakkan seluruh syarat SOP, toko aktif, alamat terverifikasi, batas level, dan batas 20% Barang Charity).
   - `POST /console/items/{uuid}/withdraw`, `POST /console/items/{uuid}/republish`.
   - `POST /console/items/{uuid}/price-suggestions/{suggestionUuid}/accept` — Terapkan saran turun harga umur stok.

### 2.4 Pemenuhan Pesanan & Komplain
- `GET /console/orders`
- `POST /console/orders/{uuid}/prepare` (`dibayar` → `disiapkan`)
- **Ambil di tempat**:
  - `POST /console/orders/{uuid}/ready-for-pickup` (`disiapkan` → `siap_diambil`, mengembalikan `pickup_code`)
  - `POST /console/orders/{uuid}/verify-pickup` (`{ "kode_ambil": "..." }` → `diterima`)
- **Kirim kurir**:
  - Unggah foto kemasan via `POST /console/media/uploads` (`owner_type=fulfillment`)
  - `POST /console/orders/{uuid}/ship` (`kurir`, `resi`, `bukti_kemas_media_id`) → otomatis mengkredit penggantian ongkir + biaya kemas ke dompet `AVAILABLE`.
- **Tanggapi Komplain**: `POST /console/disputes/{uuid}/messages` (`{ "pesan": "..." }`).

### 2.5 Dompet, Penarikan, & Program Charity
- `GET /console/wallet` (`pending_idr`, `available_idr`, `payout_hold_idr`, `charity_share_pct`)
- `GET /console/wallet/entries` — Riwayat entri ledger dompet koordinator.
- `PATCH /console/wallet/charity-share` (`{ "charity_share_pct": 0..100, "charity_program_id": 1 }`)
- `POST /console/payouts` (`Idempotency-Key`, `{ "jumlah_idr": 100000 }`) — Saldo langsung ditahan ke `PAYOUT_HOLD`.
- `POST /console/programs`, `POST /console/programs/{uuid}/disbursements`, `POST /console/programs/{uuid}/reports`.

---

## 3. Alur & Endpoint Admin (`/api/v1/barokahiin/admin`)

### 3.1 Dasbor, Koordinator, & Moderasi Toko + Alamat V1–V8
- `GET /admin/dashboard` — Ringkasan `items_by_status`, `review_queue_count`, `pending_address_verifications`, `open_disputes`, `pending_payouts`, dan status `ledger` (`balanced`).
- `GET /admin/coordinators`
- `POST /admin/coordinators/{uuid}/verify` (`status`, `level`, `region_ids[]`, `alasan?`)
- `POST /admin/coordinators/{uuid}/sanctions` (`tingkat`: `ringan|sedang|berat`, `jenis`, `alasan`, `selesai?`) — sanksi `berat` otomatis menangguhkan koordinator & toko.
- `GET /admin/stores` → `POST /admin/stores/{uuid}/moderate` (`status`: `aktif|dibatasi|ditangguhkan|ditutup`, `note?`)
- **Verifikasi Alamat Toko (`V1–V8`)**:
  - `POST /admin/store-addresses/{addressUuid}/checks` (`kode`: `V1..V8`, `lulus`: `true|false`, `catatan?`)
  - `POST /admin/store-addresses/{addressUuid}/verify` — Hanya berhasil bila `V1–V7` (dan `V8` untuk Level 1) lulus; menukar alamat aktif secara atomik.
  - `POST /admin/store-addresses/{addressUuid}/reject` (`status`: `perlu_perbaikan|ditolak`, `alasan`).

### 3.2 Antrean Review Barang & Audit Sampling
- `GET /admin/review/queue` — Daftar barang `menunggu_review` beserta `media` dan `checkResults`.
- `POST /admin/items/{uuid}/review` (`keputusan`: `setuju|revisi|tolak`, `price_idr?`, `special_price_approval?`, `catatan_per_butir?`, `alasan?`).
- `POST /admin/items/{uuid}/audit` (`hasil`: `lulus|gagal`, `catatan?`) — bila `gagal`, barang otomatis ditarik dari storefront.

### 3.3 Komplain, Penarikan, Ledger, Charity, & Konfigurasi
- `POST /admin/disputes/{uuid}/decide` (`putusan`: `tolak|refund_sebagian|refund_penuh`, `nominal_refund_idr?`, `kelalaian_koordinator?`, `biaya_retur_idr?`, `catatan?`).
- `GET /admin/payouts` → `POST /admin/payouts/{uuid}/transfer` (`bukti_ref`) atau `POST /admin/payouts/{uuid}/reject` (`alasan`).
- `GET /admin/ledger/reconciliation` — Memastikan `balanced === true` & `total_entries_sum === 0`.
- `POST /admin/ledger/adjustments` (`Idempotency-Key`, `debit_account`, `credit_account`, `amount_idr`, `alasan`).
- `POST /admin/programs/{uuid}/approve`, `POST /admin/pool/allocate` (`Idempotency-Key`), `POST /admin/disbursements/{uuid}/approve`.
- `POST /admin/split-schemes` (total 5 persen wajib = 100%) & `POST /admin/split-schemes/{uuid}/announce` (minimal 30 hari sebelum `mulai_berlaku`).
- `GET /admin/config`, `PATCH /admin/config`, `PUT /admin/pages`, `PATCH /admin/settings`, `GET /admin/audit-logs`.

---

## 4. Penanganan Kode Error di Konsol

| HTTP | `error.code` | Tindakan UI |
|---|---|---|
| `403` | Forbidden | Periksa peran akun (Koordinator vs Admin). |
| `404` | `NOT_FOUND` / `OUT_OF_SCOPE` | Data tidak ada atau di luar wilayah penugasan koordinator. |
| `409` | `VERSION_CONFLICT` | Tampilkan peringatan edit bersamaan dan muat ulang data barang. |
| `409` | `ACTIVE_ORDERS_EXIST` | Tahan perubahan alamat toko sampai seluruh pesanan aktif selesai. |
| `409` | `OVERDUE_REPORT` | Pencairan program ditahan sampai laporan program sebelumnya disetujui. |
| `422` | `ITEM_NOT_SUBMITTABLE` / `ADDRESS_CHECKS_INCOMPLETE` / `FORBIDDEN_CATEGORY` | Tampilkan daftar kekurangan dari `error.message` pada form. |
