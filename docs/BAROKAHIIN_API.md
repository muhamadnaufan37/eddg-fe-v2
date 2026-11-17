# Barokahiin Backend API (v1)

Dokumentasi kontrak API Barokahiin untuk dua frontend:
- **Storefront (Publik)**: `/api/v1/barokahiin/public/*` — tanpa login, data tersanitasi (tidak pernah menampilkan data pribadi donatur atau pembeli).
- **digitaldatagenerus (Admin)**: `/api/v1/barokahiin/admin/*` — memerlukan JWT `Authorization: Bearer <token>` dengan `role_id` `1` (Superadmin) atau `3` (Bendahara/Admin).

Semua respons mengikuti pembungkus standar:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

---

## 1. Endpoint Publik (`/api/v1/barokahiin/public`)

### 1.1 Katalog Barang
`GET /api/v1/barokahiin/public/items`

**Query parameter opsional:**
- `kategori`: slug atau UUID kategori
- `status`: `terbit` | `dipesan` | `terjual` (default: menampilkan `terbit` dan `dipesan`)
- `kondisi`: `sangat_baik` | `baik` | `cukup`
- `min_harga`, `max_harga`: integer (Rupiah)
- `q`: kata kunci pencarian pada judul/keterangan
- `sort`: `terbaru` (default) | `termurah` | `termahal`
- `per_page`: integer `1–50` (default `15`)

**Variabel respons (`data.items[]`):**

| Field | Tipe | Keterangan |
|---|---|---|
| `uuid` | string (UUID) | Identitas unik barang |
| `kode_barang` | string | Kode barang terbaca manusia, mis. `BRK-2026-0001` |
| `slug` | string | Slug URL stabil untuk detail barang |
| `judul` | string | Judul barang untuk publik |
| `keterangan` | string | Deskripsi jujur kondisi barang |
| `kekurangan` | string | Kekurangan barang yang dicatat kurator |
| `kondisi_grade` | string | `sangat_baik`, `baik`, atau `cukup` |
| `spesifikasi` | string \| null | Ukuran/spesifikasi singkat |
| `harga_rupiah` | integer | Harga jual dalam Rupiah |
| `stok_tersedia` | integer | Sisa stok tersedia |
| `status` | string | `terbit`, `dipesan`, atau `terjual` |
| `status_label` | string | `Tersedia`, `Dipesan`, atau `Terjual` |
| `donor_label` | string | Label anonim donatur dari pengaturan (default: `"Sahabat Berbagi"`) |
| `kategori` | object \| null | `{ uuid, nama, slug }` |
| `kegiatan` | object \| null | `{ uuid, judul, slug }` kegiatan yang didanai |
| `cover_url` | string \| null | URL foto sampul |
| `diterbitkan_pada` | string (ISO 8601) | Waktu terbit |

`data.pagination`: `{ current_page, last_page, per_page, total }`.

> **Catatan privasi:** Field `donor`, `nama_internal`, dan `catatan_internal` **tidak pernah** dikirim ke endpoint publik.

---

### 1.2 Detail Barang
`GET /api/v1/barokahiin/public/items/{slug}`

Hanya mengembalikan barang berstatus `terbit`, `dipesan`, atau `terjual`.

**Variabel respons (`data`):** sama seperti item pada katalog di atas, ditambah:
- `media[]`: daftar foto/video berstatus siap (`status_proses = ready`), masing-masing berisi:
  - `uuid` (string)
  - `tipe` (`"foto"` | `"video"`)
  - `url` (string)
  - `thumbnail_url` (string \| null)
  - `alt` (string \| null)
  - `urutan` (integer)

---

### 1.3 Kategori Aktif
`GET /api/v1/barokahiin/public/categories`

**Variabel respons (`data[]`):**
`uuid`, `nama`, `slug`, `urutan`.

---

### 1.4 Daftar Kegiatan & Transparansi Dana
`GET /api/v1/barokahiin/public/activities`

Hanya mengembalikan kegiatan berstatus `aktif` atau `selesai`.

**Variabel respons (`data[]`):**

| Field | Tipe | Keterangan |
|---|---|---|
| `uuid` | string (UUID) | Identitas unik kegiatan |
| `judul` | string | Nama kegiatan |
| `slug` | string | Slug URL kegiatan |
| `deskripsi` | string | Penjelasan kegiatan |
| `target_dana` | integer | Target dana dalam Rupiah |
| `dana_terkumpul_rupiah` | integer | Total penjualan barang yang tertaut ke kegiatan ini |
| `total_penggunaan_rupiah` | integer | Total pengeluaran yang telah disetujui publik |
| `periode` | string \| null | Periode pelaksanaan |
| `status` | string | `aktif` atau `selesai` |
| `diterbitkan_pada` | string (ISO 8601) \| null | Waktu publikasi |

---

### 1.5 Detail Kegiatan
`GET /api/v1/barokahiin/public/activities/{slug}`

**Variabel respons (`data`):** semua field kegiatan di atas, ditambah:
- `media[]`: `{ uuid, tipe, url, keterangan, alt }`
- `laporan_penggunaan[]` (hanya pos dengan `disetujui_publik = true`):
  - `uuid`, `pos`, `nominal_rupiah`, `tanggal` (`YYYY-MM-DD`), `keterangan`

---

### 1.6 Ringkasan Dampak
`GET /api/v1/barokahiin/public/impact`

**Variabel respons (`data`):**

| Field | Tipe | Keterangan |
|---|---|---|
| `total_dana_terkumpul_rupiah` | integer | Total seluruh catatan penjualan (`SaleRecord`) |
| `total_barang_terjual` | integer | Jumlah barang berstatus `terjual` |
| `total_barang_tersedia` | integer | Jumlah barang berstatus `terbit` |
| `total_kegiatan_terdanai` | integer | Jumlah kegiatan berstatus `aktif` atau `selesai` |

---

### 1.7 Halaman Statis & Pengaturan Publik
- `GET /api/v1/barokahiin/public/pages/{key}` (`tentang`, `cara-kerja`, `faq`, `kebijakan`, `kontak`)
  - **Variabel respons (`data`):** `kunci`, `judul`, `isi`, `updated_at`.
- `GET /api/v1/barokahiin/public/settings`
  - **Variabel respons (`data`):** `rekening_resmi_bank`, `rekening_resmi_nomor`, `rekening_resmi_atas_nama`, `whatsapp_resmi`, `label_anonim`, `batas_bayar_jam`, `lokasi_pengambilan`.

---

### 1.8 Form Permintaan Beli
`POST /api/v1/barokahiin/public/purchase-requests`

Mendukung header `Idempotency-Key` (atau field body `idempotency_key`) agar pengiriman ganda tidak membuat pesanan duplikat.

**Body request:**
- `item_slug` (required, string)
- `nama_pembeli` (required, string)
- `kontak_pembeli` (required, string — disimpan terenkripsi)
- `jumlah` (opsional, integer `1–50`, default `1`)
- `catatan` (opsional, string)

**Variabel respons (`data`):** `uuid`, `status` (`"diajukan"`), `jumlah`, `created_at`.

---

### 1.9 Form Pengajuan Donasi Barang
`POST /api/v1/barokahiin/public/donation-requests`

**Body request:**
- `nama_donatur`, `kontak_donatur` (required)
- `wilayah`, `preferensi_anonim` (opsional, boolean default `true`)
- `nama_barang` (required), `kategori_uuid` (opsional), `kondisi_grade` (`sangat_baik` | `baik` | `cukup`), `jumlah` (default `1`), `cara_terima` (`diantar` | `dijemput`), `catatan` (opsional)
- `persetujuan_jual` (required, accepted/true), `persetujuan_media` (required, accepted/true)

**Variabel respons (`data`):** `kode_barang` (`BRK-YYYY-XXXX`), `status` (`"diajukan"`).

---

## 2. Endpoint Admin (`/api/v1/barokahiin/admin`)

Semua endpoint di bawah ini wajib mengirim header `Authorization: Bearer <token>` (role `1` atau `3`).

### 2.1 Dasbor & Audit Log
- `GET /dashboard`
  - **Variabel respons (`data`):**
    - `barang_per_status`: object jumlah per status, mis. `{ "diajukan": 1, "dikurasi": 1, "terbit": 4, "dipesan": 1, "terjual": 1 }`
    - `antrean_permintaan_baru`: integer (jumlah permintaan `diajukan`)
    - `menunggu_pembayaran`: integer (jumlah permintaan `dikonfirmasi`)
    - `dana_bulan_ini_rupiah`: integer (total penjualan bulan berjalan)
- `GET /audit-logs?per_page=20`
  - **Variabel respons (`data.items[]`):** `id`, `aktor_id`, `aksi`, `target_type`, `target_id`, `sebelum` (object \| null), `sesudah` (object \| null), `waktu`, `actor` (`{ id, nama_lengkap, username }`).

---

### 2.2 Donatur & Kategori
- `GET /donors` (`?q=&wilayah=&per_page=15`), `POST /donors`, `GET /donors/{uuid}`, `PATCH /donors/{uuid}`
  - **Variabel respons (`data` / `data.items[]`):**
    - `uuid`, `nama`, `kontak` (sudah didekripsi untuk admin), `wilayah`, `preferensi_anonim`, `catatan`, `dianonimkan_pada`
    - `has_jual_consent` (boolean), `has_media_consent` (boolean), `created_at`
    - `duplicate_warning` (string, muncul saat `POST /donors` bila kontak sudah terdaftar)
    - `items[]` (khusus `GET /donors/{uuid}`): `{ uuid, kode_barang, nama_internal, status, harga_rupiah, created_at }`
- `POST /donors/{uuid}/consents`
  - Body: `jenis` (`jual` | `publikasi_media`), `bentuk_bukti` (`tertulis` | `digital` | `lisan_terekam`), `diberikan_pada` (opsional), `catatan` (opsional).
- `POST /donors/{uuid}/anonymize`
  - Menghapus data pribadi donatur (`nama` menjadi `"Donatur Anonim"`, `kontak`/`wilayah`/`catatan` dikosongkan, `dianonimkan_pada` diisi) tanpa menghapus barang/penjualan.
- `GET /categories`, `POST /categories`, `PATCH /categories/{uuid}`
  - **Variabel respons:** `id`, `uuid`, `nama`, `slug`, `urutan`, `aktif`.

---

### 2.3 Barang, Kurasi, & Media
- `GET /items` (`?status=&kategori_uuid=&donor_uuid=&q=&per_page=15`), `POST /items`, `GET /items/{uuid}`, `PATCH /items/{uuid}`
  - **Variabel respons (`data` / `data.items[]`):**

| Field | Tipe | Keterangan |
|---|---|---|
| `uuid` | string | Identitas unik barang |
| `kode_barang` | string | Kode unik otomatis `BRK-YYYY-XXXX` |
| `slug` | string \| null | Slug publik (terisi saat terbit) |
| `nama_internal` | string | Nama internal untuk admin |
| `judul_publik` | string \| null | Judul untuk storefront |
| `keterangan_publik` | string \| null | Deskripsi untuk storefront |
| `kekurangan` | string \| null | Catatan kekurangan barang (wajib sebelum terbit) |
| `catatan_internal` | string \| null | Catatan internal admin |
| `kondisi_grade` | string \| null | `sangat_baik`, `baik`, atau `cukup` |
| `spesifikasi` | string \| null | Spesifikasi/ukuran |
| `harga_rupiah` | integer \| null | Harga jual |
| `jumlah`, `stok_tersedia` | integer | Stok awal dan sisa stok |
| `cara_terima` | string | `diantar` atau `dijemput` |
| `lokasi_penyimpanan` | string \| null | Lokasi rak/gudang |
| `checklist_kurasi` | object \| null | `{ kebersihan, fungsi, kelengkapan, foto_memadai }` (boolean) |
| `status` | string | `diajukan`, `diterima`, `dikurasi`, `siap_terbit`, `terbit`, `dipesan`, `terjual`, `ditarik`, `ditolak` |
| `alasan_tolak` | string \| null | Alasan bila ditolak |
| `cover_media_id`, `cover_url` | integer \| null, string \| null | Media sampul |
| `diterbitkan_pada` | string \| null | Waktu terbit |
| `donor` | object \| null | `{ uuid, nama }` |
| `kategori` | object \| null | `{ uuid, nama }` |
| `kegiatan` | object \| null | `{ uuid, judul }` |
| `created_at` | string | Waktu dibuat |

  - Khusus `GET /items/{uuid}` juga mengembalikan:
    - `media[]`: daftar lengkap media barang (`uuid`, `tipe`, `url`, `urutan`, `alt`, `status_proses`, `ukuran`, `exif_stripped`)
    - `status_histories[]`: riwayat perpindahan status (`dari`, `ke`, `oleh`, `alasan`, `waktu`)
    - `publish_readiness_errors[]`: daftar syarat terbit yang belum terpenuhi (kosong `[]` bila siap terbit)
- `POST /items/{uuid}/transition` — Body: `{ status, alasan? }`
- `POST /items/{uuid}/publish` — Terbitkan barang ke storefront
- `POST /items/{uuid}/unpublish` — Body: `{ alasan? }` — Tarik barang dari storefront
- `POST /items/{uuid}/media` (`multipart/form-data`) — Field: `tipe` (`foto` | `video`), `file`, `alt?`, `urutan?`, `is_cover?`. Foto otomatis dihapus metadata EXIF/GPS-nya di server (`exif_stripped: true`).
- `PATCH /media/{mediaUuid}` (`urutan`, `alt`, `is_cover`), `DELETE /media/{mediaUuid}`

---

### 2.4 Permintaan Beli & Keuangan
- `GET /purchase-requests` (`?status=&item_uuid=&per_page=15`), `GET /purchase-requests/{uuid}`
  - **Variabel respons:**
    - `new_requests_count` (integer, pada endpoint list)
    - `items[]` / `data`: `uuid`, `status` (`diajukan`, `dikonfirmasi`, `dibayar`, `selesai`, `ditolak`, `batal`, `kedaluwarsa`), `nama_pembeli`, `kontak_pembeli` (terdekripsi untuk admin), `jumlah`, `harga_terkunci_rupiah`, `catatan`, `catatan_internal`, `alasan_tolak_batal`, `batas_bayar_pada`, `dikonfirmasi_pada`, `dibayar_pada`, `selesai_pada`, `item` (`{ uuid, kode_barang, judul_publik, status }`), `created_at`
- `PATCH /purchase-requests/{uuid}/notes` — Body: `{ catatan_internal }`
- `POST /purchase-requests/{uuid}/confirm` — Mengunci harga & mengurangi stok secara atomik
- `POST /purchase-requests/{uuid}/payment` — Body: `{ metode: "transfer"|"qris_manual"|"tunai", nominal_rupiah, bukti_ref?, alasan_selisih? }`
- `POST /purchase-requests/{uuid}/fulfill` — Menyelesaikan pesanan & mengubah status barang ke `terjual`
- `POST /purchase-requests/{uuid}/cancel`, `POST /purchase-requests/{uuid}/reject` — Body: `{ alasan }`
- `GET /sales` (`?start_date=&end_date=&per_page=15`) — Daftar `SaleRecord` permanen (`uuid`, `request_id`, `item_id`, `nominal_rupiah`, `metode`, `dibayar_pada`, `bukti_ref`, `jenis` [`penjualan`|`koreksi`], `alasan_koreksi`)
- `POST /sales/corrections` — Body: `{ item_uuid, request_uuid?, nominal_rupiah, alasan_koreksi, bukti_ref? }`
- `GET /reports/sales` (`?start_date=&end_date=`)
  - **Variabel respons (`data`):** `total_nominal_rupiah`, `total_transaksi_penjualan`, `total_catatan_koreksi`, `per_kategori[]` (`{ kategori, jumlah_catatan, total_nominal }`)

---

### 2.5 Kegiatan, Halaman Statis, & Pengaturan
- `GET /activities`, `POST /activities`, `PATCH /activities/{uuid}`
  - **Variabel respons:** `id`, `uuid`, `judul`, `slug`, `deskripsi`, `target_dana`, `periode`, `status` (`draft`, `aktif`, `selesai`, `ditarik`), `diterbitkan_pada`
- `POST /activities/{uuid}/media` (`multipart/form-data`) — Field wajib: `tipe` (`foto` | `video`), `file` (maks. 50 MB); opsional: `keterangan`, `alt`, `urutan`, `has_person_consent` (boolean), `is_child_safe` (boolean, default `true`).
- `DELETE /activity-media/{mediaUuid}` — Menghapus media dokumentasi kegiatan.
- `POST /activities/{uuid}/expenses` — Body: `{ pos, nominal_rupiah, tanggal, keterangan?, bukti_ref?, disetujui_publik? }`
- `GET /pages`, `PUT /pages` — Body: `{ kunci, judul, isi, diterbitkan? }`
- `GET /settings`, `PATCH /settings` — `{ rekening_resmi_bank, rekening_resmi_nomor, rekening_resmi_atas_nama, whatsapp_resmi, label_anonim, batas_bayar_jam, lokasi_pengambilan }`

---

## 3. Command Terjadwal & Data Sample
- `php artisan barokahiin:expire-orders` — Menandai pesanan `dikonfirmasi` yang melewati `batas_bayar_pada` sebagai `kedaluwarsa` dan mengembalikan stok/status barang ke `terbit`.
- `php artisan barokahiin:sample` — Mengisi data sample lengkap (pengaturan, halaman statis, kategori, donatur, kegiatan + laporan dana, 8 barang berbagai status, pesanan, dan penjualan).
- `php artisan barokahiin:sample --clear` — Menghapus seluruh data sample Barokahiin secara aman tanpa menyentuh data asli.
- `php artisan barokahiin:sample --fresh` — Menghapus data sample lama lalu membuat ulang.
