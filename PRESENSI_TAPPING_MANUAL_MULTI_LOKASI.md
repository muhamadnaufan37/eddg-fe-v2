# Update Presensi: Metode Tapping/Manual & Multi-Lokasi Kegiatan

Dokumen ini merangkum perubahan yang dibuat untuk mengakomodasi hasil rapat:

1. Mekanisme presensi tapping (RFID) vs manual (cari data).
2. Kegiatan presensi bisa menyasar gabungan beberapa daerah/desa/kelompok sekaligus.
3. Penyesuaian agar perubahan tetap ringan untuk dijalankan di web hosting (tanpa Docker).

## 1. Pemisahan Metode Presensi: Tapping vs Manual

### Skema Data

| Tabel          | Kolom Baru                                                      | Keterangan                                                                                     |
| -------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `data_peserta` | `id_card` (string 100, unique, nullable)                        | Kode unik kartu RFID untuk peserta sensus, sejajar dengan `data_cai.id_card` yang sudah ada.   |
| `presensi`     | `metode_presensi` (enum: `tapping`, `manual`, default `manual`) | Mencatat metode yang dipakai saat presensi dibuat. Ada index `(id_kegiatan, metode_presensi)`. |

Migration:

- `database/migrations/2026_08_16_000000_add_id_card_to_data_peserta_table.php`
- `database/migrations/2026_08_16_000001_add_metode_presensi_to_presensi_table.php`

### Aturan Pencarian Peserta

`PresensiController::resolvePeserta()` memisahkan dua jalur secara ketat (tidak ada fallback silang):

- **Tapping** (`metode_presensi=tapping`): peserta dicari **hanya** lewat kolom `id_card` (di `data_peserta` atau `data_cai`, tergantung `category`).
- **Manual** (`metode_presensi=manual`): peserta dicari **hanya** lewat `kode_cari_data` (atau id numerik jika peserta dipilih langsung dari daftar/list).

Endpoint yang terpengaruh (semuanya kini mewajibkan field `metode_presensi`):

- `POST /api/v1/presensi/check`
- `POST /api/v1/presensi/store` (apiResource `presensi`)
- `POST /api/v1/presensi/store-by-coordinate`
- `POST /api/v1/data_center/presensi/create` (public, by coordinate)

Parameter request terkait:

| Field             | Wajib jika                | Keterangan                               |
| ----------------- | ------------------------- | ---------------------------------------- |
| `metode_presensi` | selalu                    | `tapping` atau `manual`                  |
| `id_card`         | `metode_presensi=tapping` | Kode RFID                                |
| `id_peserta`      | `metode_presensi=manual`  | `kode_cari_data` atau id numerik peserta |

### Pembatasan Metode per Kegiatan

`presensi_kegiatan` sekarang punya kolom `metode_presensi` (enum: `tapping`, `manual`, `both`, default `both`) yang menentukan metode presensi apa saja yang diterima kegiatan tersebut:

- `both` (default): menerima tapping maupun manual.
- `tapping`: hanya menerima presensi via RFID (`id_card`).
- `manual`: hanya menerima presensi via pencarian `kode_cari_data`.

Setiap request `check`, `store`, dan `store-by-coordinate` sekarang divalidasi lewat `PresensiKegiatan::allowsMetodePresensi()` sebelum peserta dicari. Jika `metode_presensi` pada request tidak sesuai dengan pengaturan kegiatan, request ditolak dengan 400 sebelum melakukan query pencarian peserta apa pun (hemat query untuk request yang jelas tidak valid).

Migration: `database/migrations/2026_08_16_000004_add_metode_presensi_to_presensi_kegiatan_table.php`. Field ini juga bisa diisi lewat `store`/`update` di `PresensiKegiatanController` dan ditampilkan di `PresensiKegiatanResource`.

### Endpoint Pendukung RFID untuk Data Peserta (Sensus)

Sebelumnya hanya `data_cai` yang punya endpoint pencarian by id_card. Sekarang ditambahkan endpoint yang sama untuk `data_peserta`:

- `GET /api/v1/data_center/sensus/search-by-id-card?id_card=...` → `DataPesertaController::searchByIdCard()`

Field `id_card` juga sudah bisa diisi lewat:

- `POST /api/v1/data_peserta` (create)
- `PUT/PATCH /api/v1/data_peserta/{kode_cari_data}` (update)

dan ditampilkan di `DataPesertaResource`.

## 2. Kegiatan Presensi Gabungan (Multi Daerah/Desa/Kelompok)

Sebelumnya satu kegiatan (`presensi_kegiatan`) hanya bisa menyasar **satu** daerah, **satu** desa, dan **satu** kelompok (kolom `tmpt_daerah`/`tmpt_desa`/`tmpt_kelompok`, masing-masing FK tunggal).

Sekarang kegiatan bisa menyasar **kombinasi beberapa** daerah/desa/kelompok sekaligus, tanpa menghapus kolom lama (perubahan additive-only agar aman dijalankan di database hosting yang sedang aktif):

| Kolom Baru     | Tipe          | Keterangan                                                        |
| -------------- | ------------- | ----------------------------------------------------------------- |
| `daerah_ids`   | JSON nullable | Daftar id daerah tambahan yang digabung dengan `tmpt_daerah`.     |
| `desa_ids`     | JSON nullable | Daftar id desa tambahan yang digabung dengan `tmpt_desa`.         |
| `kelompok_ids` | JSON nullable | Daftar id kelompok tambahan yang digabung dengan `tmpt_kelompok`. |

Migration: `database/migrations/2026_08_16_000002_add_multi_location_to_presensi_kegiatan_table.php`

### Helper di Model `PresensiKegiatan`

```php
$kegiatan->allDaerahIds();   // gabungan tmpt_daerah + daerah_ids (unik, int)
$kegiatan->allDesaIds();     // gabungan tmpt_desa + desa_ids
$kegiatan->allKelompokIds(); // gabungan tmpt_kelompok + kelompok_ids
```

### Dampak ke Validasi & Laporan

- `PresensiController::validateLocation()` — peserta valid jika lokasinya ada di **salah satu** id pada level yang diisi (daerah/desa/kelompok), bukan hanya cocok satu id seperti sebelumnya.
- `buildPesertaReportBaseQuery()` / `buildPesertaReportStatisticsQuery()` (laporan & PDF) — filter lokasi memakai `whereIn` atas gabungan id, bukan `where` tunggal. Query ini juga sekarang menampilkan `metode_presensi` (tapping/manual) di setiap baris data presensi peserta, baik di `report()` (JSON) maupun `reportPdf()` (kolom "Metode" pada PDF).

### Perbaikan: Venue Acara vs Lokasi Eligibilitas Gabungan

**Penting**, `daerah_ids`/`desa_ids`/`kelompok_ids` HANYA memperluas siapa saja yang **boleh hadir** (eligibilitas), bukan menentukan lokasi fisik acara. Lokasi fisik acara (venue, dipakai untuk validasi radius koordinat pada `storeByCoordinate`) tetap **satu titik saja**, yaitu `tmpt_daerah`/`tmpt_desa`/`tmpt_kelompok` (prioritas kelompok > desa > daerah), sama seperti sebelumnya.

Contoh kasus: kegiatan menyasar peserta gabungan dari desa Purwakarta 1, Purwakarta 2, dan kelompok Jatiluhur (`desa_ids`/`kelompok_ids`), tapi acaranya benar-benar diadakan di kelompok Ciseureuh 1 (`tmpt_kelompok`). Maka:

- Peserta dari Purwakarta 1/2 dan Jatiluhur **boleh presensi** (lolos `validateLocation()`/muncul di laporan).
- Validasi radius koordinat GPS tetap mengacu ke koordinat kelompok Ciseureuh 1 (`tmpt_kelompok`), bukan ke lokasi gabungan tadi.

`resolveReferenceLocationCoordinate()` sudah diperbaiki agar hanya membaca `tmpt_daerah`/`tmpt_desa`/`tmpt_kelompok` (venue tunggal), terpisah total dari `allDaerahIds()`/`allDesaIds()`/`allKelompokIds()` yang dipakai di `validateLocation()` dan query laporan.

### Payload Baru di `PresensiKegiatanController`

`store` dan `update` menerima field opsional tambahan:

```json
{
    "tmpt_daerah": 1,
    "daerah_ids": [2, 3],
    "tmpt_desa": 10,
    "desa_ids": [11, 12],
    "tmpt_kelompok": 50,
    "kelompok_ids": [51, 52]
}
```

`PresensiKegiatanResource` menampilkan field tambahan: `daerah_ids`, `desa_ids`, `kelompok_ids` (berisi array id mentah, resolusi nama dilakukan di sisi klien lewat endpoint referensi `list-daerah`/`list-desa`/`list-kelompok` yang sudah ada, agar tidak menambah query N+1 saat listing kegiatan).

## 3. Pertimbangan Performa & Keamanan Deploy (Web Hosting, Tanpa Docker)

- Semua migration bersifat **additive-only** (tambah kolom), tidak ada `rename`/`drop`/`change` kolom yang butuh `doctrine/dbal` atau lock tabel besar — aman untuk shared hosting.
- Pencarian peserta (`resolvePeserta`) sekarang maksimal 1–2 query per request (sebelumnya bisa sampai 4 query fallback berantai), mengurangi beban DB.
- Pencarian lokasi referensi koordinat memakai satu query `whereIn` per level (bukan beberapa `find()` terpisah), dan jarak (Haversine) dihitung sekali lalu dipakai ulang untuk pengecekan radius maupun laporan jarak — tidak dihitung dua kali seperti sebelumnya.
- Query builder laporan (`report`, `report/pdf`) tetap memakai kolom skalar `tmpt_daerah/tmpt_desa/tmpt_kelompok` milik peserta untuk `whereIn` (bisa memanfaatkan index kolom biasa), bukan fungsi JSON pada tabel besar `data_peserta`/`data_cai` — beban JSON parsing hanya terjadi di tabel kecil `presensi_kegiatan`.

### Catatan Deploy

1. Jalankan migration baru di server: `php artisan migrate` (disarankan cek dulu dengan `php artisan migrate --pretend`).
2. Jika config sempat di-cache (`php artisan config:cache`), jalankan `php artisan config:clear` lalu cache ulang setelah update `.env` bila perlu, supaya perubahan tervalidasi dengan benar.
3. Field lama (`tmpt_daerah`, `tmpt_desa`, `tmpt_kelompok`, pencarian tanpa `metode_presensi`) tidak dihapus, tapi klien/frontend perlu mulai mengirim `metode_presensi` karena field ini sekarang **wajib** di endpoint presensi.

## 4. Status Online User Realtime & Force Logout (Superadmin)

### Skema Data

| Tabel   | Kolom Baru                          | Keterangan                                                                  |
| ------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `users` | `last_seen_at` (timestamp)          | Diupdate otomatis tiap ada request terautentikasi (throttle 1 menit).       |
| `users` | `tokens_invalidated_at` (timestamp) | Jika diisi, semua token JWT yang terbit sebelum waktu ini langsung ditolak. |
| `users` | `logout_reason` (string)            | Keterangan/alasan logout (baik logout mandiri maupun force logout).         |

Migration: `database/migrations/2026_08_16_000003_add_online_tracking_to_users_table.php`

### Deteksi Online Realtime

- Middleware baru `App\Http\Middleware\TrackUserActivity` (alias `track.activity`) dipasang di grup route terautentikasi (`jwt.auth`, `throttle:authenticated`). Middleware ini meng-update `last_seen_at` user pada setiap request, dengan throttle 1 menit supaya tidak menulis ke DB di setiap request.
- `User::isOnline` (accessor `is_online`) bernilai `true` jika `last_seen_at` masih dalam `User::ONLINE_THRESHOLD_MINUTES` (default 5 menit).
- `is_online` dan `last_seen_at` sudah tampil di `UserResource`, jadi otomatis muncul di listing `GET /api/v1/users` dan `GET /api/v1/users/{uuid}` yang sudah ada — tidak perlu endpoint baru.

### Force Logout oleh Superadmin (role_id = 1)

- Endpoint baru: `POST /api/v1/users/{uuid}/force-logout` → `AuthController::forceLogout()`.
- Hanya bisa dipanggil oleh user dengan `role_id === 1` (superadmin); selain itu ditolak 403. Superadmin juga tidak bisa force-logout akun dirinya sendiri yang sedang login.
- Body wajib: `keterangan` (string, alasan force logout).
- Efek: `tokens_invalidated_at` di-set ke waktu sekarang dan `logout_reason` diisi dari `keterangan`. Semua token JWT milik user tersebut yang terbit sebelum waktu ini langsung ditolak oleh `TrackUserActivity` pada request berikutnya, dengan pesan error menyertakan alasan logout.
- Aktivitas dicatat lewat `logActivity('user_force_logout', ...)` (siapa yang melakukan, ke user mana, dan alasannya).

### Logout Mandiri dengan Keterangan

`POST /api/v1/logout` sekarang menerima field opsional `keterangan` — jika diisi, disimpan ke `logout_reason` milik user yang logout, untuk keperluan audit/riwayat.
