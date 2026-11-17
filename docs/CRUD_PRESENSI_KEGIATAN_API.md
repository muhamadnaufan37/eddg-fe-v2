# Dokumentasi API: CRUD Presensi Kegiatan

Dokumentasi ini menjelaskan secara detail mengenai endpoint untuk membuat, membaca, memperbarui, dan menghapus (CRUD) data master **Presensi Kegiatan**. Semua endpoint ini membutuhkan autentikasi (Bearer Token).

**Base URL:** `/api/v1/presensi-kegiatan`
**Header Wajib:** 
- `Authorization: Bearer <token>`
- `Accept: application/json`

---

## 1. List Data Kegiatan (GET)
Mengambil daftar kegiatan presensi dengan dukungan filter, search, sort, dan pagination.

**Endpoint:** `GET /api/v1/presensi-kegiatan`

**Query Parameters (Opsional):**
- `page`: Nomor halaman (contoh: 1).
- `per_page`: Jumlah data per halaman (contoh: 15).
- `filter[search]`: Pencarian berdasarkan kode_kegiatan, nama_kegiatan, tipe, kategori, tanggal, atau nama tempat.
- `sort`: Pengurutan data (contoh: `nama_kegiatan`, `-tgl_kegiatan`, `jam_kegiatan`, `created_at`). Prefix `-` untuk *descending*.

---

## 2. Buat Kegiatan Baru (POST)
Membuat data kegiatan presensi baru beserta lokasi acara dan rules kepesertaan.

**Endpoint:** `POST /api/v1/presensi-kegiatan`

**Body (JSON / Form Data):**
| Field | Tipe | Wajib? | Keterangan |
| :--- | :--- | :---: | :--- |
| `nama_kegiatan` | string | Ya | Nama kegiatan. |
| `tmpt_kegiatan` | string | Ya | Nama tempat kegiatan (misal: "Masjid Baitul Makmur"). |
| `type_kegiatan` | string | Ya | Tipe cakupan kegiatan (contoh: "DAERAH", "DESA", "KELOMPOK"). |
| `tgl_kegiatan` | date | Ya | Tanggal kegiatan (Format: YYYY-MM-DD). |
| `jam_kegiatan` | time | Ya | Waktu dimulainya kegiatan (Format: HH:MM). |
| `expired_date_time` | datetime | Ya | Batas waktu presensi tidak bisa dilakukan lagi (Format: YYYY-MM-DD HH:MM:SS). |
| `category` | string | Ya | Kategori target (`sensus`, `cai`, `mumi`, `remaja`, `praremaja`, `caberawit`). |
| `usia_mode` | string | Ya | Aturan filter usia (`single` atau `range`). |
| `usia_operator` | string | Ya (Jika single) | Operator perbandingan usia (`>=`, `<=`, `>`, `<`, `=`). |
| `usia_min` | integer | Ya | Umur minimum. |
| `usia_max` | integer | Ya (Jika range) | Umur maksimum. |
| `metode_presensi` | string | Tidak | Metode presensi yang diizinkan (`tapping`, `manual`, atau `both`). Default `both`. |
| `tmpt_daerah` | integer | Ya | ID daerah referensi **LOKASI ACARA (Venue)**. |
| `tmpt_desa` | integer | Tidak | ID desa referensi **LOKASI ACARA**. |
| `tmpt_kelompok` | integer | Tidak | ID kelompok referensi **LOKASI ACARA**. |
| `daerah_ids` | array | Tidak | Kumpulan ID daerah target peserta gabungan (contoh: `[1, 2]`). |
| `desa_ids` | array | Tidak | Kumpulan ID desa target peserta gabungan. |
| `kelompok_ids` | array | Tidak | Kumpulan ID kelompok target peserta gabungan. |
| `add_by_petugas` | integer | Ya | ID user pembuat kegiatan. |

---

## 3. Detail Kegiatan (GET)
Mengambil rincian data dari satu kegiatan spesifik beserta relasi tempat dan daftar pesertanya. 
*(Hanya Superadmin atau Petugas pembuat kegiatan yang berhak melihat data ini)*.

**Endpoint:** `GET /api/v1/presensi-kegiatan/{id}`

---

## 4. Update Kegiatan (PUT / PATCH)
Mengubah data kegiatan yang sudah dibuat. 
*(Hanya Superadmin atau Petugas pembuat kegiatan yang berhak mengubah data ini)*.

**Endpoint:** `PUT /api/v1/presensi-kegiatan/{id}`

**Body:** 
- Sama persis dengan *Buat Kegiatan Baru (POST)*. Seluruh field pada dasarnya opsional (karena menggunakan `sometimes`), ubah hanya field yang diperlukan.
- **Catatan Penting:** Jika Anda menggunakan `usia_mode` = `single`, Anda tetap wajib mengirimkan ulang (atau memastikan ada) `usia_operator`. Jika merubah ke `range`, Anda wajib mengirimkan `usia_max`.

---

## 5. Hapus Kegiatan (DELETE)
Menghapus data kegiatan.
*(Hanya Superadmin atau Petugas pembuat kegiatan yang berhak menghapus data ini)*.

**Endpoint:** `DELETE /api/v1/presensi-kegiatan/{id}`

---

## Ketentuan Validasi Koordinat (Venue vs Target)
Pada proses CRUD ini terdapat perbedaan penting antara `tmpt_*` dan `*_ids`:
1. `tmpt_daerah`, `tmpt_desa`, `tmpt_kelompok` digunakan murni sebagai **Titik Koordinat Pusat (Venue)** yang mana lokasi ini akan diradius saat peserta melakukan presensi koordinat.
2. `daerah_ids`, `desa_ids`, `kelompok_ids` digunakan untuk mengatur **Target Siapa Saja yang Boleh Hadir**. Contohnya pengajian gabungan 3 desa, maka `desa_ids` diisi `[1, 2, 3]`, sedangkan tempat acaranya (venue) mungkin hanya berada di salah satu kelompok, jadi `tmpt_kelompok` diisi `16`.
