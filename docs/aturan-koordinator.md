# Peraturan Koordinator Barang Wilayah: Barokahiin

Dokumen pendamping `prd.md` v0.5 dan `model-bisnis.md`. Ini adalah **peraturan kemitraan** yang harus **dibaca dan disetujui** setiap koordinator sebelum aktif, dan menjadi dasar **perilaku sistem** (batas, SLA, sanksi, verifikasi).

| | |
|---|---|
| **Versi** | 0.1 (draf) |
| **Tanggal** | 20 November 2026 |
| **Berlaku untuk** | Semua Koordinator Barang dan toko mereka |

> **Catatan penting.** Ini **draf kebijakan operasional**, **bukan perjanjian hukum yang sudah ditinjau**. Sebelum dipakai sebagai perjanjian kemitraan, **konsultan hukum perlu menelaah** hubungan hukum koordinator (mitra, relawan, atau agen), batas usia cakap hukum, pajak komisi, dan ketentuan sanksi. Angka (batas waktu, ambang) adalah **nilai awal** yang tersimpan sebagai konfigurasi dan dapat disesuaikan.

---

## Pasal 1. Tujuan dan istilah

1. **Tujuan:** menjaga agar barang yang dijual **layak, jujur, aman**, pembeli **nyaman dan terlindungi**, uang **tercatat dan transparan**, dan kebaikan **benar-benar tersalurkan**.
2. **Koordinator** = mitra Barokahiin yang mengumpulkan, mengurasi, dan menjual barang donasi di wilayah penugasannya, serta memiliki **Toko**.
3. **Toko** = halaman dan identitas koordinator di Barokahiin, tempat barang miliknya dijual.
4. **Admin** = pengelola pusat (Super Admin, Reviewer, Keuangan).
5. **SOP** = standar pemeriksaan barang (lihat `prd.md` Bagian 7).
6. **Titik Ambil** = alamat toko terverifikasi tempat pembeli mengambil barang.

---

## Pasal 2. Syarat menjadi koordinator

Calon koordinator **harus**:
1. Berusia **minimal 18 tahun** _(batas final menunggu telaah hukum)_.
2. **Berdomisili di wilayah penugasan** atau memiliki tempat yang sah di sana.
3. Memiliki **identitas yang valid** dan **rekening bank atas nama sendiri** (nama pada rekening **sama** dengan nama pada identitas).
4. Memiliki **ponsel yang dapat memotret dan merekam video**, serta koneksi internet.
5. Memiliki **tempat penyimpanan** yang **bersih, kering, aman**, dan **alamat lengkap yang dapat diverifikasi** (Pasal 5).
6. Sanggup meluangkan waktu untuk **menerima donasi, mengurasi, mengemas, dan melayani pembeli**; menjamin **respons dalam batas SLA**.
7. **Lulus pelatihan SOP dan ujian** (nilai awal: ≥ 80%).
8. **Tidak sedang atau pernah** diberi sanksi berat di Barokahiin.
9. **Menyetujui** peraturan ini, perjanjian kemitraan, kebijakan privasi, dan kode etik (persetujuan digital, versi dan waktunya dicatat).

---

## Pasal 3. Pendaftaran dan verifikasi

| Tahap | Isi | Oleh |
|---|---|---|
| 1. Daftar | Data diri, kontak, wilayah yang diinginkan, ketersediaan waktu, motivasi singkat | Calon |
| 2. Dokumen | Identitas, rekening (atas nama sama), **data dan bukti alamat toko** (Pasal 5), foto lokasi | Calon |
| 3. Verifikasi identitas dan rekening | Kesesuaian nama, dokumen terbaca, rekening valid | Admin |
| 4. **Verifikasi alamat toko** | Lihat Pasal 5 | Admin |
| 5. Pelatihan dan ujian SOP | Materi + ujian | Calon |
| 6. Persetujuan | Perjanjian dan peraturan | Calon |
| 7. Aktivasi | Level 1, toko aktif **setelah alamat terverifikasi** | Admin |

- Status: `diajukan → dalam_verifikasi → perlu_perbaikan → disetujui → aktif`. Penolakan **disertai alasan**.
- Dokumen identitas disimpan **terenkripsi**, hanya dilihat Admin yang berwenang, dengan akses **tercatat**.

---

## Pasal 4. Wilayah penugasan

1. Koordinator ditugaskan pada **satu atau lebih Kabupaten/Kota** (opsional sampai kecamatan).
2. Setiap wilayah memiliki **satu Koordinator Utama**; koordinator lain di wilayah yang sama bekerja sebagai tim.
3. Koordinator **hanya mengelola donatur, barang, dan pesanan di wilayahnya**. Menerima donasi di luar wilayah penugasan **tidak diperbolehkan** tanpa persetujuan Admin.
4. **Pergantian wilayah** atau penambahan wilayah memerlukan persetujuan Admin dan **verifikasi ulang alamat** bila titik ambil berubah.
5. **Satu orang satu akun koordinator dan satu toko.** Akun tidak boleh dibagi atau dipindahtangankan.

---

## Pasal 5. Toko dan alamat terverifikasi

### 5.1 Toko koordinator
Setiap koordinator aktif memiliki **satu Toko** dengan:
- **Nama toko** (unik, pantas, **tidak menyesatkan**; tidak boleh meniru merek lain atau mengesankan sebagai pusat), **logo**, **foto sampul**, **deskripsi** (maks. 500 karakter), **jam operasional**, dan **kebijakan toko tambahan** (maks. 500 karakter; **tidak boleh bertentangan** dengan kebijakan pusat).
- Tampilan publik: nama toko, wilayah (Kab/Kota), **level**, **rating**, katalog, dan program Charity.
- **Moderasi:** nama dan konten toko ditinjau Admin; konten yang menyesatkan, menyinggung, atau melanggar akan diminta diperbaiki atau dihapus.

### 5.2 Alamat toko wajib lengkap
Alamat toko **wajib terstruktur dan lengkap**:

| Bagian | Wajib |
|---|---|
| Nama jalan, nomor/blok/lantai | Ya |
| RT/RW | Ya (atau pernyataan "tidak ada") |
| Kelurahan/Desa, Kecamatan, Kab/Kota, Provinsi | Ya (dari **master wilayah**, bukan teks bebas) |
| **Kode pos** | Ya |
| **Patokan** (penanda dekat) | Ya |
| **Titik peta (pin)** | Ya |
| Jenis tempat: rumah, ruko, gudang | Ya |
| Status tempat: milik, sewa, pinjam | Ya |
| **Foto tampak depan** (≥ 2 sudut) dan **foto ruang penyimpanan** | Ya |
| **Bukti alamat** (salah satu): surat keterangan domisili, tagihan listrik/air atas alamat itu, bukti sewa, atau surat izin pemilik/ketua RT | Ya |
| Nomor kontak toko yang aktif | Ya |

### 5.3 Verifikasi alamat oleh Admin
Admin memeriksa **semua butir** berikut. **Alamat tidak diverifikasi bila ada butir yang gagal.**

| # | Pemeriksaan |
|---|---|
| V1 | Semua kolom alamat **lengkap dan konsisten** (tidak ada bagian yang kosong atau mengada-ada) |
| V2 | Alamat **berada dalam wilayah penugasan** |
| V3 | **Titik peta cocok** dengan alamat dan patokan |
| V4 | **Foto** menunjukkan tempat yang sama dan layak (bersih, kering, aman) |
| V5 | **Bukti alamat** sah, **nama atau alamatnya cocok** (atau ada izin pemilik) |
| V6 | **Kontak aktif** (dihubungi dan menjawab) |
| V7 | **Tur video langsung** ke ruang penyimpanan (daring) |
| V8 | **Kunjungan lapangan** oleh Admin/Koordinator Utama wilayah, **wajib untuk Level 1** _(dapat dilonggarkan oleh kebijakan)_ |

**Hasil:** `terverifikasi` / `perlu_perbaikan` (dengan catatan per butir) / `ditolak` (dengan alasan).

### 5.4 Aturan sesudah verifikasi
1. **Toko tidak dapat menerbitkan barang** sebelum alamat berstatus **terverifikasi**.
2. **Alamat publik hanya berupa area** (kecamatan/kota). **Alamat lengkap hanya dibuka ke pembeli yang pesanannya sudah dibayar** dan memilih **ambil di tempat**.
3. **Perubahan alamat** (pindah atau menambah tempat) **wajib verifikasi ulang**. **Tidak boleh diubah saat ada pesanan aktif.** Selama proses, alamat lama tetap berlaku.
4. **Verifikasi ulang berkala tiap 12 bulan** atau bila ada laporan/ketidaksesuaian.
5. Alamat yang **terbukti palsu atau menyesatkan** = **pelanggaran berat** (Pasal 14).
6. **Titik Ambil tambahan** hanya diperbolehkan setelah diverifikasi dengan cara yang sama.

### 5.5 Jeda toko (cuti)
- Koordinator boleh **menjeda toko** (maks. **30 hari per kali**, nilai awal) dengan pemberitahuan. Selama jeda, **pesanan baru tidak dapat dibuat**.
- **Pesanan yang sudah dibayar tetap wajib diselesaikan** sesuai SLA.
- Jeda tanpa pemberitahuan atau melewati batas dapat dikenai pembatasan.

---

## Pasal 6. Hak koordinator

1. Menerima **komisi** sesuai skema yang berlaku (`model-bisnis.md` Bagian 4) dan **penggantian ongkir serta biaya kemas**.
2. **Transparansi:** melihat rincian komisi **per pesanan**, status Tertunda/Tersedia, dan skema yang berlaku saat pesanan dibayar.
3. **Penarikan** saldo Tersedia sesuai jadwal dan batas minimum.
4. **Pelatihan, panduan SOP, dan dukungan** Admin.
5. **Naik level** dan mendapat kepercayaan lebih besar sesuai kinerja (Pasal 11).
6. **Menjalankan program Charity** sesuai Pasal 10.
7. **Pemberitahuan perubahan peraturan atau skema ≥ 30 hari** sebelum berlaku; **mundur tanpa penalti dalam 14 hari** setelah pengumuman bila tidak setuju.
8. **Perlindungan data pribadi** dan penanganan sesuai kebijakan privasi.
9. **Menanggapi dan membantah** sebelum sanksi ditetapkan, serta **mengajukan banding** (Pasal 15).
10. **Menjeda toko** (Pasal 5.5) dan **mengundurkan diri** dengan pemberitahuan 14 hari.

---

## Pasal 7. Kewajiban koordinator

### 7.1 Menerima donasi
1. **Mencatat donatur dan memperoleh persetujuan** (jual dan publikasi media) **sebelum** barang diajukan. Tanpa persetujuan, barang **tidak boleh** diajukan.
2. Menerima **hanya barang yang diizinkan**. Barang terlarang atau berasal dari sumber **tidak jelas** **wajib ditolak**.
3. Memberi **kode barang** dan label fisik; menyimpan barang donatur **terpisah** dari barang pribadi.

### 7.2 Kurasi dan listing
1. Memeriksa setiap barang **sesuai SOP kategori** dan **mengisi hasil jujur**.
2. Mengunggah **foto dan video bukti** yang **asli dan terbaru**, tanpa rekayasa yang menyesatkan.
3. Menulis **kekurangan secara jujur dan lengkap**. Menyembunyikan cacat adalah pelanggaran.
4. Mengusulkan **harga sesuai pedoman**; tidak membuat klaim yang tidak dapat dibuktikan (mis. "100% original").
5. **Tidak ada data pribadi** di foto/video (wajah, alamat, dokumen, layar akun).
6. Menjaga **kapasitas**: jumlah barang aktif **tidak melebihi batas level**; menindaklanjuti **saran turun harga** untuk barang lama.

### 7.3 Penjualan dan pelayanan
1. **Seluruh transaksi hanya melalui Barokahiin.** **Dilarang** menerima atau meminta pembayaran di luar sistem (tunai, transfer langsung, dompet digital pribadi) atau memindahkan pembeli ke kanal lain untuk bertransaksi.
2. **Menyiapkan pesanan dalam 48 jam** setelah dibayar (nilai awal). Pesanan yang lewat **96 jam** dibatalkan otomatis dan dana dikembalikan.
3. **Mengemas dengan layak**; barang rapuh/tajam dengan pengaman; **mengunggah foto kemasan dan resi**.
4. **Ambil di tempat:** memverifikasi **kode ambil**, memeriksa barang bersama pembeli bila diminta, dan melayani pada **jam operasional**.
5. **Menjawab pertanyaan pembeli dalam 24 jam** dan **menanggapi komplain dalam 24 jam**.
6. **Bersikap sopan dan adil**; **tidak diskriminatif** (suku, agama, ras, golongan, gender, disabilitas, atau lainnya).
7. **Satu harga untuk semua pembeli**; tidak memberi harga khusus di luar sistem.

### 7.4 Data dan keamanan
1. **Merahasiakan data donatur dan pembeli**; menggunakannya **hanya** untuk keperluan pesanan/donasi. Dilarang menyimpan, menyalin, atau memakai untuk promosi.
2. **Menjaga akun**: kata sandi kuat, **2FA aktif**, tidak berbagi akun, mengunci perangkat.
3. **Melaporkan insiden** (kehilangan perangkat, akun diretas, kebocoran data) **dalam 24 jam**.
4. Mengikuti **kebijakan retensi**: tidak menyimpan data pembeli di luar sistem.

### 7.5 Keuangan
1. Komisi dihitung **otomatis oleh sistem**; koordinator **tidak mengubah** angka.
2. **Menerima penarikan hanya ke rekening terverifikasi atas nama sendiri.**
3. **Pajak:** koordinator bertanggung jawab atas **kewajiban pajak pribadi** atas komisi sesuai hukum yang berlaku _(ketentuan dan pemotongan menunggu telaah akuntan/hukum)_. Barokahiin menyediakan **rekap penghasilan**.
4. **Koreksi:** saldo dapat dikurangi lewat **entri koreksi** bila ada refund atau pembatalan komisi; saldo negatif **dilunasi dari komisi berikutnya**.
5. **Biaya retur karena kelalaian** (barang tidak sesuai deskripsi) dipotong dari **bagian koordinator barang itu** (maks. sebesar komisi barang itu).

---

## Pasal 8. Larangan

Koordinator **dilarang**:
1. **Membeli, atau menyuruh orang lain membeli, barang yang ia kelola**, atau merekayasa pesanan/ulasan.
2. **Memanipulasi harga**, memalsukan harga referensi, atau menaikkan harga di luar pedoman tanpa persetujuan.
3. Menerbitkan **barang terlarang**, barang **hasil kejahatan/asal tidak jelas**, barang **berbahaya** atau **tidak layak**.
4. **Menjual atau memindahkan transaksi di luar platform**; menerima uang tunai dari pembeli.
5. **Membocorkan atau menyalahgunakan data** donatur atau pembeli.
6. Menampilkan **wajah anak** atau data yang mengidentifikasi mereka tanpa persetujuan wali dan kebijakan yang jelas.
7. **Menyalahgunakan dana** (komisi, Dompet Program, dana donasi) atau memakai Dana Kegiatan untuk keperluan pribadi.
8. **Memalsukan** dokumen, foto, video, ulasan, bukti penggunaan dana, atau data alamat.
9. **Mengubah alamat toko** tanpa verifikasi; **membuka toko ganda** atau memakai akun orang lain.
10. **Melecehkan, mengancam, atau mendiskriminasi** pembeli, donatur, sesama koordinator, atau Admin.
11. **Spam**, promosi menyesatkan, atau memakai nama Barokahiin untuk kegiatan di luar kemitraan.
12. **Menolak atau menghambat audit**, verifikasi, atau permintaan klarifikasi Admin.
13. Mengklaim **hubungan atau wewenang** yang tidak dimiliki.

---

## Pasal 9. Standar layanan (SLA) dan kinerja

| Hal | Standar (nilai awal) |
|---|---|
| Menyiapkan/mengirim pesanan | **≤ 48 jam** setelah dibayar; batal otomatis dan refund bila **> 96 jam** |
| Jendela ambil di tempat | 7 hari (lewat → batal dan refund) |
| Balas pertanyaan pembeli | ≤ 24 jam |
| Tanggapi komplain | ≤ 24 jam |
| Ajukan perbaikan setelah revisi review | ≤ 3 hari kerja |
| Jam operasional toko | Minimal **3 hari per pekan** dan **tercantum di toko** |
| Laporan program Charity | ≤ **14 hari** setelah program selesai |
| Lapor insiden data/akun | ≤ 24 jam |

Kinerja diukur oleh **Skor Toko** (`model-bisnis.md` 7.5): SLA, komplain valid, rating, hasil audit, dan kelengkapan listing.

---

## Pasal 10. Charity oleh koordinator

1. **Program** (dana) dan **penyaluran barang** (in-kind) dilakukan **sesuai persetujuan** Admin.
2. **Program harus disetujui Admin sebelum menerima dana.** Batas nilai program mengikuti level.
3. Dana masuk ke **Dompet Program** yang **terpisah dari dompet pribadi**. **Pencairan** memerlukan persetujuan dan **bukti penggunaan (nota/foto)**.
4. **Laporan penggunaan dana wajib** dalam **14 hari** setelah program; laporan terlambat **menahan pencairan** program berikutnya. **Sisa dana** dikembalikan ke Dana Kegiatan.
5. **Penerima manfaat** dideskripsikan **tanpa data pribadi**; foto/video **dengan persetujuan**; **wajah anak** tidak ditampilkan tanpa persetujuan wali.
6. **Barang Charity** maksimal **20%** dari barang aktif toko; label dan program tujuan harus **jelas dan benar**.
7. **Mengalihkan sebagian komisi** ke Charity bersifat **sukarela** dan berlaku untuk pesanan berikutnya.
8. **Dilarang** memakai program Charity untuk keuntungan pribadi atau menyamarkan penggunaan yang tidak sesuai.

---

## Pasal 11. Level dan kenaikan

| Level | Syarat naik (nilai awal) | Hak |
|---|---|---|
| **1 Baru** | Lolos verifikasi dan ujian | **Semua barang wajib review Admin**; batas barang aktif rendah; program Charity kecil |
| **2 Terpercaya** | ≥ 20 pesanan selesai, Skor ≥ 80, komplain valid ≤ 5% | Batas lebih tinggi; program lebih besar |
| **3 Utama** | ≥ 100 pesanan selesai, Skor ≥ 88, komplain valid ≤ 3%, **tanpa sanksi berat 6 bulan** | **Auto-publish** kategori berisiko rendah (Fase 2); dapat menjadi Koordinator Utama |

**Penurunan:** Skor < 70 → peringatan; Skor < 65 selama 2 bulan berturut → pembatasan; Skor < 50 atau sanksi berat → tinjauan penangguhan.

---

## Pasal 12. Audit dan pengawasan

1. **Audit sampling** pada barang terbit (nilai awal 10%) dan pemeriksaan acak foto/video/alamat.
2. **Koordinator wajib bekerja sama** dan menyediakan bukti bila diminta (maks. **3×24 jam**).
3. **Kunjungan atau tur video** dapat diminta sewaktu-waktu terkait laporan/ketidaksesuaian.
4. Semua tindakan Admin atas akun dan toko **tercatat** (audit log).

---

## Pasal 13. Barang bermasalah

1. Barang **tidak sesuai SOP** yang terbukti: **komisi barang itu dibatalkan**, barang ditarik, dan biaya retur terkait dipotong dari bagian koordinator.
2. Barang yang **membahayakan** (listrik rusak, bahan berbahaya) **ditarik segera**; pembeli yang terdampak diberi tahu dan dikembalikan dananya.
3. **Barang hilang/rusak di tempat koordinator** setelah diterima dari donatur atau setelah dibayar pembeli adalah **tanggung jawab koordinator** sampai diserahkan. Kelalaian yang terbukti dapat dikenai pembatalan komisi.

---

## Pasal 14. Sanksi

Sanksi bersifat **bertingkat** dan **proporsional**. Setiap sanksi **tercatat** dan terlihat di dasbor koordinator.

| Tingkat | Contoh pelanggaran | Tindakan |
|---|---|---|
| **Ringan** | Terlambat SLA berulang (> 3 kali / 30 hari); listing kurang lengkap; balasan lambat; laporan program terlambat < 7 hari | **Peringatan tertulis**, Skor turun, **pelatihan ulang** |
| **Sedang** | Barang tidak sesuai SOP terbukti (≥ 2 kali / 60 hari); membatalkan pesanan berbayar tanpa alasan sah (≥ 2 kali); komplain valid > 10% (60 hari); laporan program terlambat > 14 hari; data alamat tidak diperbarui; jeda toko melewati batas | **Pembatasan**: turun level atau **semua barang wajib review**, **batas barang aktif diturunkan**, **komisi barang terkait dibatalkan**, **penarikan ditahan** sampai diselesaikan (maks. 30 hari) |
| **Berat** | **Alamat toko palsu**; pemalsuan dokumen/bukti; transaksi di luar platform; **menyalahgunakan dana**; membeli/merekayasa pesanan sendiri; barang terlarang atau hasil kejahatan; membocorkan data; menampilkan wajah anak tanpa persetujuan; pelecehan/ancaman; menghambat audit | **Penangguhan segera**, saldo **ditahan untuk pemeriksaan**, pengembalian dana yang disalahgunakan, **pemutusan kemitraan**, dan **pelaporan kepada pihak berwenang bila perlu** |

**Proses:**
1. **Pemberitahuan tertulis** berisi pelanggaran, bukti, dan tindakan.
2. **Kesempatan menanggapi 3×24 jam** (kecuali pelanggaran berat yang memerlukan **penangguhan sementara** demi keselamatan atau pencegahan kerugian).
3. **Keputusan oleh Admin**; **pemutusan kemitraan memerlukan persetujuan dua Admin**.
4. **Banding** (Pasal 15).

---

## Pasal 15. Banding dan penyelesaian sengketa

1. Banding diajukan **dalam 7 hari** sejak keputusan, disertai alasan dan bukti.
2. Banding ditinjau oleh **dua Admin yang tidak terlibat** dalam keputusan awal; hasil **final** di tingkat operasional dan diberikan **tertulis dalam 7 hari kerja**.
3. Sengketa keuangan diselesaikan berdasarkan **ledger dan bukti sistem** sebagai rujukan utama.
4. Penyelesaian di luar itu mengikuti **ketentuan dalam perjanjian kemitraan** _(menunggu telaah hukum)_.

---

## Pasal 16. Pengunduran diri dan pemutusan

1. **Pemberitahuan 14 hari** untuk pengunduran diri.
2. **Serah terima:** inventaris barang dicatat; barang donatur **dikembalikan atau dialihkan** ke koordinator lain di wilayah; **pesanan aktif diselesaikan** atau di-refund.
3. **Saldo** dibayarkan setelah rekonsiliasi dan **masa komplain** berakhir, dikurangi koreksi yang berlaku.
4. **Dompet Program** diselesaikan: laporan, sisa dana ke Dana Kegiatan atau dialihkan ke koordinator pengganti dengan persetujuan Admin.
5. **Data** koordinator disimpan/dihapus sesuai **kebijakan retensi**; toko dinonaktifkan dan tidak tampil.

---

## Pasal 17. Perubahan peraturan

1. Perubahan **diumumkan ≥ 30 hari** sebelum berlaku (kecuali keadaan darurat yang disetujui Admin dan diumumkan).
2. **Perubahan skema bagi hasil** mengikuti `model-bisnis.md` 4.6 (versi, snapshot per pesanan, batas ±5 poin per triwulan).
3. Penggunaan sistem setelah tanggal berlaku, atau **persetujuan digital**, dianggap menerima. Koordinator yang tidak setuju boleh **mundur tanpa penalti dalam 14 hari**.

---

## Lampiran A. Kode etik singkat (10 butir)

1. Saya **jujur** pada pembeli, donatur, dan Barokahiin.
2. Saya menulis **kekurangan barang apa adanya**.
3. Saya **menjaga data** orang lain seperti data saya sendiri.
4. Saya **tidak bertransaksi di luar** Barokahiin.
5. Saya **memperlakukan semua orang dengan hormat dan adil**.
6. Saya **memakai uang kebaikan hanya untuk kebaikan** dan melaporkannya.
7. Saya **tidak mengambil keuntungan pribadi** di luar komisi yang ditetapkan.
8. Saya **menjaga keselamatan**: tidak menjual barang berbahaya.
9. Saya **melindungi anak-anak** dan penerima manfaat.
10. Saya **bersedia diaudit** dan memperbaiki kesalahan.

## Lampiran B. Checklist aktivasi koordinator

| # | Item | Selesai oleh |
|---|---|---|
| 1 | Identitas terverifikasi | Admin |
| 2 | Rekening atas nama sama terverifikasi | Admin |
| 3 | **Alamat toko lengkap** dan bukti alamat diunggah | Calon |
| 4 | **V1–V8 alamat** lulus (termasuk tur video dan kunjungan) | Admin |
| 5 | Pelatihan SOP selesai, ujian lulus | Calon |
| 6 | Peraturan dan perjanjian disetujui (versi tercatat) | Calon |
| 7 | 2FA aktif | Calon |
| 8 | Profil toko lengkap (nama, logo, sampul, deskripsi, jam operasional) dan **disetujui moderasi** | Calon + Admin |
| 9 | Wilayah ditugaskan; titik ambil aktif | Admin |
| 10 | Toko berstatus **aktif** | Admin |
