# Dokumentasi API: Analisis Presensi Kegiatan

API ini berfungsi untuk mengambil data ringkasan analitik sebuah kegiatan. Endpoint ini otomatis mengkalkulasi statistik peserta, menganalisis kualitas presensi (memberikan `rating`), serta menampilkan log kendala teknis/kegagalan (error logs) yang dialami peserta saat melakukan absensi (seperti: titik koordinat di luar radius, dll).

**Endpoint:** `GET /api/v1/presensi/analysis`
**Header Wajib:** 
- `Authorization: Bearer <token>`
- `Accept: application/json`

---

## Query Parameters

| Parameter | Tipe | Wajib | Deskripsi |
| :--- | :--- | :---: | :--- |
| `id_kegiatan` | integer | Ya | ID dari kegiatan yang ingin dianalisis. |

---

## Contoh Request
```http
GET /api/v1/presensi/analysis?id_kegiatan=44
```

## Contoh Respon Sukses (200 OK)

Respon di bawah ini merupakan ilustrasi apabila sistem mendeteksi banyak kendala/keterlambatan.

```json
{
    "success": true,
    "message": "Analisis presensi berhasil digenerate",
    "data": {
        "rating": "buruk",
        "kegiatan": {
            "nama_kegiatan": "Pengajian Gabungan",
            "tgl_kegiatan": "2026-09-28"
        },
        "statistics": {
            "total_recorded": 100,
            "hadir": 30,
            "terlambat": 40,
            "izin": 15,
            "sakit": 15
        },
        "logs": {
            "total_failed_attempts": 12,
            "recent_errors": [
                {
                    "type": "presensi_coordinate_failed",
                    "description": "Presensi koordinat ditolak karena di luar radius",
                    "time": "2026-09-28 10:15:20"
                }
            ]
        },
        "analysis": [
            "Tingkat kehadiran tepat waktu rendah (hanya 30%).",
            "Terjadi tingkat keterlambatan yang tinggi (40%). Evaluasi apakah waktu pelaksanaan atau jarak lokasi menjadi kendala bagi peserta.",
            "Cukup banyak peserta yang tidak hadir karena sakit (15%). Pertimbangkan faktor cuaca atau kesehatan lingkungan sekitar.",
            "Cukup banyak peserta yang izin (15%).",
            "Ditemukan 12 catatan kegagalan (error logs) selama proses presensi.",
            "Terdapat 12 kegagalan terkait validasi koordinat (kemungkinan peserta berada di luar radius lokasi yang diizinkan, batas waktu terlewat, atau penggunaan lokasi palsu/mock)."
        ]
    }
}
```

---

## Penjelasan Struktur Data (`data`) untuk Frontend

1. **`rating`**
   Nilai kualitatif otomatis (`sangat bagus`, `cukup`, atau `buruk`). Frontend bisa menggunakan ini untuk menampilkan Badge/Icon dengan warna yang berbeda (Misal: Buruk = Merah, Sangat Bagus = Hijau).

2. **`kegiatan`**
   Info singkat dari kegiatan. Berguna untuk header pada UI.

3. **`statistics`**
   Berisi kumpulan integer jumlah peserta per statusnya. Cocok digunakan langsung untuk dirender menjadi **Pie Chart / Donut Chart**.

4. **`logs`**
   - `total_failed_attempts`: Jumlah total kegagalan absensi (misalnya app ditolak karena GPS rusak).
   - `recent_errors`: List array maksimal 5 laporan error terakhir. Bisa dibuatkan tabel mini / timeline di UI.

5. **`analysis`**
   Kumpulan *array of string*. Berisi kalimat-kalimat kesimpulan dan diagnosa AI-like dari backend. Frontend cukup melooping (map) `analysis` ini dan mencetaknya sebagai _bullet points_ atau paragraf (*Insights / Saran Evaluasi*).

---

## Penanganan Error

**422 Unprocessable Entity (Jika id_kegiatan tidak valid)**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "id_kegiatan": [
      "The selected id_kegiatan is invalid."
    ]
  }
}
```
