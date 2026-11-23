# Frontend Spec: Barokahiin

Dokumen pendamping `prd.md` v0.5. Aturan toko dan koordinator: `aturan-koordinator.md`. Angka dan algoritma toko: `model-bisnis.md`. Ini adalah **instruksi kerja untuk Frontend dan UI/UX**: seperti apa tampilannya, bagaimana ia merespons semua ukuran layar, dan bagaimana kualitasnya dibuktikan.

> **Standar yang harus dicapai:** tampilan **kelas atas** (bukan tampilan templat), **responsif sempurna** dari 320 px sampai layar lebar, **cepat di jaringan seluler biasa**, dan **dapat dipakai semua orang**. Ukurannya ada di Bagian 12 dan **menjadi syarat selesai**, bukan saran.
>
> **Yang tidak saya ketahui:** teknologi `digitaldatagenerus` bila sudah ada. Dokumen ini mendefinisikan **perilaku, desain, dan kontrak**. Bila kode yang ada dipakai, ia harus memenuhi spesifikasi ini.

---

## 1. Dua aplikasi, satu sistem desain

| | **Storefront** (Pembeli) | **Konsol** (`digitaldatagenerus`; Koordinator dan Admin) |
|---|---|---|
| **Tujuan** | Membuat orang percaya, menemukan barang, dan membeli | Membuat koordinator dan admin bekerja cepat, akurat, dan tanpa salah |
| **Nada** | Hangat, jujur, hidup | Tenang, jelas, efisien |
| **Perangkat utama** | Ponsel (Android kelas menengah ke bawah) | Ponsel untuk foto/video dan pesanan; desktop untuk review, data, keuangan |
| **Rendering** | **SSR/ISR** (cepat, terindeks, mudah dibagikan) | SPA/aplikasi terautentikasi (tanpa SEO) |
| **Prioritas** | Kecepatan, kepercayaan, SEO, keindahan | Kejelasan status, form tahan kesalahan, unggah tahan koneksi buruk |

Keduanya memakai **satu paket design token dan komponen** (`packages/ui`) dengan varian untuk dua konteks.

### Struktur proyek (usulan: monorepo)
```
apps/
  storefront/        # situs publik pembeli
  console/           # digitaldatagenerus (Admin dan Koordinator)
packages/
  ui/                # design system: token, komponen, ikon, tema
  api-client/        # klien dan tipe dibangkitkan dari OpenAPI (sumber: backend)
  config/            # lint, tsconfig, pengaturan bersama
```
Penerapan (deploy) storefront dan konsol **terpisah**, sehingga storefront publik tidak terganggu saat konsol diperbarui.

### Stack default (boleh diganti bila memenuhi Bagian 12)
| Kebutuhan | Default |
|---|---|
| Kerangka | **Next.js (App Router)** + **TypeScript strict** |
| Gaya | **CSS variables (token)** + Tailwind atau CSS Modules; **bukan** tampilan bawaan pustaka komponen |
| Primitif aksesibel | **Radix UI** (atau setara) untuk dialog, menu, tab, combobox, tooltip; **gaya sepenuhnya milik kita** |
| Data | **TanStack Query**, klien dari OpenAPI |
| Form | **React Hook Form + Zod** |
| Uji | Vitest + Testing Library · **Playwright** (e2e dan tangkapan layar) · **Storybook** · **axe** · **Lighthouse CI** |
| Ikon | Satu keluarga garis (mis. **Lucide**), 24 px, goresan 1,5 px |

---

## 2. Arah desain: dasar pemikiran

**Subjeknya:** lapak barang layak dari warga, yang dikurasi koordinator lokal, dengan uang yang bisa dilacak sampai kebaikan. Audiens: orang Indonesia di ponsel, beragam usia dan literasi digital, termasuk komunitas Muslim dan umum.

**Bahasa visualnya diambil dari dunia itu:**
- **Label barang** (hang-tag) dan **stiker kode barang** di lapak/pasar barang bekas.
- **Struk/kuitansi** toko: kertas sempit, angka rata kanan, garis putus-putus.
- **Indigo batik** dan **kuning kunyit**: warna kain dan bumbu sehari-hari di Indonesia.

### Rencana desain (token ringkas)
- **Warna** (nama dan hex, lihat Bagian 3): `indigo` #1F2C7A, `kunyit` #F5B31A, `daun` #0F7A5C, `kertas` #F4F6FB, `tinta` #171B3D, `putih` #FFFFFF.
- **Tipografi:** **Bricolage Grotesque** untuk judul dan harga (berkarakter, ekspresif), **Plus Jakarta Sans** untuk teks dan antarmuka (dirancang di Indonesia, terbaca di layar kecil).
- **Tata letak:** konten rata kiri, berpusat pada **foto barang**. Kartu barang bersih; kepercayaan ditunjukkan oleh data nyata, bukan dekorasi.
- **Prinsip:** *Barangnya yang jadi bintang. Uangnya tidak disembunyikan. Satu momen khas: Kuitansi Kebaikan.*

### Tinjauan terhadap kebiasaan generik (dan apa yang saya ubah)
Saya memeriksa rencana ini terhadap pola desain yang sering muncul karena kebiasaan, bukan pilihan.

| Pola generik | Keputusan di sini |
|---|---|
| Latar krem hangat + serif tinggi kontras + aksen terakota | **Dihindari.** Latar `kertas` yang sejuk (kebiruan), judul grotesk berkarakter, aksen kunyit dan indigo yang datang dari batik dan bumbu |
| Latar gelap + satu aksen neon | Tidak dipakai |
| Tata letak koran dengan garis tipis dan sudut siku | Tidak dipakai |
| Deretan kartu seragam dengan satu radius dan bayangan abu yang sama | **Radius berjenjang** dan **hampir tanpa bayangan**; hierarki dari foto, ruang, dan batas |
| Label KAPITAL berjarak di atas setiap judul, titik tengah sebagai pemisah, tanda panah di tautan, huruf monospace untuk label kecil | **Dilarang** (Bagian 11). Angka memakai `tabular-nums`, bukan monospace |
| Hero dengan angka besar + statistik + gradien | Hero dimulai dari **barang nyata dan pemilih wilayah**; tidak ada gradien dekoratif |
| Animasi masuk di setiap bagian | **Tidak ada.** Hanya satu momen terorkestrasi (Kuitansi) dan gerak yang menjawab aksi pengguna |

**Menghabiskan keberanian di satu tempat:** semua hal lain tenang dan disiplin; **Kuitansi Kebaikan** yang boleh paling mengesankan.

---

## 3. Sistem desain: token

Semua nilai berupa **CSS custom properties** di `packages/ui`. **Tidak ada hex atau angka acak di komponen.**

### 3.1 Warna
Rasio kontras di bawah **sudah dihitung**; komponen wajib memakai pasangan yang lulus.

| Token | Hex | Pemakaian |
|---|---|---|
| `--kertas` | #F4F6FB | Latar halaman |
| `--putih` | #FFFFFF | Permukaan (kartu, sheet, form) |
| `--tinta` | #171B3D | Teks utama |
| `--muted` | #566083 | Teks sekunder |
| `--indigo` | #1F2C7A | Aksi utama, tautan, fokus |
| `--indigo-tua` | #141C52 | Permukaan gelap (footer, panel) |
| `--indigo-muda` | #E6E9F8 | Latar lembut, chip terpilih |
| `--kunyit` | #F5B31A | Sorotan, penanda, aksi sekunder pada latar gelap |
| `--kunyit-muda` | #FFF1CC | Latar peringatan/pengumuman ringan |
| `--daun` | #0F7A5C | **Charity**, sukses |
| `--daun-tua` | #0A5A44 | Teks pada latar `--daun-muda` |
| `--daun-muda` | #DDF3EA | Latar Charity/sukses |
| `--bahaya` | #BF3328 | Galat, aksi destruktif |
| `--bahaya-muda` | #FBE3E0 | Latar galat |
| `--info` | #1D5FA8 | Informasi |
| `--peringatan-teks` | #8A5A00 | Teks pada `--kunyit-muda` |
| `--garis` | #D9DEEE | Pemisah dekoratif (**bukan** batas komponen) |
| `--garis-kuat` | #7A83A6 | **Batas input dan komponen interaktif** |

**Kontras yang sudah dihitung**
| Pasangan | Rasio | Syarat |
|---|---|---|
| `tinta` di `kertas` | 15,41 | ≥ 4,5 ✔ |
| `tinta` di `putih` | 16,66 | ✔ |
| `muted` di `kertas` | 5,72 | ✔ |
| `muted` di `putih` | 6,18 | ✔ |
| `putih` di `indigo` | 12,36 | ✔ |
| `indigo` di `kertas` | 11,43 | ✔ |
| `indigo` di `indigo-muda` | 10,22 | ✔ |
| `tinta` di `kunyit` | 9,00 | ✔ |
| `kunyit` di `indigo-tua` | 8,61 | ✔ |
| `putih` di `daun` | 5,30 | ✔ |
| `daun` di `kertas` | 4,91 | ✔ |
| `daun-tua` di `daun-muda` | 7,07 | ✔ |
| `putih` di `bahaya` | 5,65 | ✔ |
| `bahaya` di `bahaya-muda` | 4,62 | ✔ |
| `peringatan-teks` di `kunyit-muda` | 5,28 | ✔ |
| `garis-kuat` di `putih` | 3,73 | ≥ 3,0 untuk batas komponen ✔ |
| `garis-kuat` di `kertas` | 3,45 | ✔ |

> `--garis` (kontras ±1,3) **hanya** untuk pemisah dekoratif. **Batas input memakai `--garis-kuat`.**
> **Jangan** menaruh teks `--kunyit` di latar terang (kontras rendah). `--kunyit` hanya sebagai **isian** dengan teks `--tinta`, atau teks di atas `--indigo-tua`.
> **Mode gelap** (Fase 2): token gelap disusun UI/UX dan **wajib lulus rasio yang sama**; jangan membalik warna secara otomatis.

### 3.2 Tipografi
| Peran | Font | Bobot | Catatan |
|---|---|---|---|
| Judul, harga, angka besar | **Bricolage Grotesque** | 600–800 | Sumbu optical size bila tersedia |
| Teks, antarmuka, form | **Plus Jakarta Sans** | 400, 500, 600, 700 | |
| Angka (harga, kode, tabel) | font yang sama | | `font-variant-numeric: tabular-nums` |

- **Muat sendiri (self-host)** berkas WOFF2 yang sudah **disubset Latin**; `font-display: swap`; **preload maksimal 2 berkas**; atur `size-adjust` pada font cadangan agar **tidak ada pergeseran tata letak**.
- Cadangan: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Skala tipe fluida** (`clamp`, basis `rem` agar menghormati ukuran huruf pengguna):

| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--t-sm` | `clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)` | Keterangan, label kecil |
| `--t-base` | `clamp(1rem, 0.96rem + 0.2vw, 1.0625rem)` | Teks isi (**tidak pernah < 16 px di ponsel**) |
| `--t-lg` | `clamp(1.1875rem, 1.1rem + 0.4vw, 1.375rem)` | Subjudul, harga di kartu |
| `--t-xl` | `clamp(1.4rem, 1.2rem + 0.9vw, 1.875rem)` | Judul bagian |
| `--t-2xl` | `clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem)` | Judul halaman |
| `--t-3xl` | `clamp(2.125rem, 1.6rem + 2.6vw, 3.5rem)` | Judul hero |

- Tinggi baris: teks isi **1,55**; judul **1,15**. **Panjang baris ≤ 68 karakter** (`max-width: 68ch`).
- Judul memakai **huruf kecil kalimat (sentence case)**. **Tidak ada label KAPITAL** dan **tidak ada satu kata disorot sendiri** di dalam judul.
- Teks Bahasa Indonesia cenderung **lebih panjang** dari bahasa Inggris: **tidak ada lebar tetap pada tombol/label**, dan informasi penting **tidak dipotong** dengan elipsis.
- Input memakai **≥ 16 px** agar iOS tidak memperbesar halaman saat fokus.

### 3.3 Jarak, radius, elevasi
| Token | Nilai |
|---|---|
| Jarak (`--s-1`…`--s-9`) | 4, 8, 12, 16, 24, 32, 48, 64, 96 px |
| Gutter halaman | 16 px (ponsel), 24 px (tablet), 32 px (desktop) |
| **Radius berjenjang** | `--r-sm` 6 (input, chip) · `--r-md` 12 (kartu, panel) · `--r-lg` 20 (sheet, dialog) · `--r-full` (pil) |
| Elevasi | Bayangan **hanya** untuk elemen yang melayang (sheet, menu, bilah tempel). Kartu dan panel mengandalkan **batas, ruang, dan foto** |
| Bayangan melayang | satu token `--e-float` (lembut, berwarna `tinta` dengan opasitas rendah) |

### 3.4 Gerak
| Token | Nilai | Dipakai untuk |
|---|---|---|
| `--d-fast` | 120 ms | Hover, tekan |
| `--d-base` | 200 ms | Buka/tutup kecil, perubahan status |
| `--d-slow` | 320 ms | Sheet, dialog |
| Easing | `cubic-bezier(0.2, 0, 0, 1)` | Standar |

- Gerak **hanya** untuk: menjawab aksi pengguna (buka sheet, tambah ke keranjang, konfirmasi) dan **satu momen khas** (Kuitansi dicetak).
- **Tidak ada** animasi masuk per bagian, **tidak ada** hover bergerak di semua kartu.
- `prefers-reduced-motion`: semua gerak menjadi **perubahan instan** (kecuali umpan balik yang perlu, tanpa gerak spasial).

### 3.5 Gambar dan media
- **Foto barang:** rasio **4:5** di grid dan galeri; `aspect-ratio` selalu diatur (tidak ada CLS); `object-fit: cover`; **warna dominan** sebagai placeholder (atau blur kecil).
- **Latar foto:** netral. Kartu **tidak** menimpa teks di atas foto.
- **Video:** selalu dengan **poster**; **tidak putar otomatis**; kontrol terlihat; takarir bila ada.
- **Ilustrasi/foto stok generik** (tangan, hati, orang tersenyum) **tidak dipakai**. Visual = **foto barang nyata** dan **dokumentasi kegiatan nyata** (dengan persetujuan).

### 3.6 Ikon
Satu keluarga garis, 24 px, goresan 1,5 px. **Ikon bertemu teks** untuk aksi penting. Ikon tanpa teks wajib punya `aria-label` dan sasaran sentuh ≥ 44 px.

---

## 4. Sistem responsif

### 4.1 Titik henti (mobile-first, `min-width`)
| Nama | Lebar | Perilaku umum |
|---|---|---|
| dasar | 320–479 | Satu kolom; grid barang 2 kolom; navigasi bawah (konsol) |
| `sm` | ≥ 480 | Ruang lebih; kartu sedikit lebih besar |
| `md` | ≥ 768 | Grid barang 3 kolom; panel samping muncul; tablet |
| `lg` | ≥ 1024 | Grid 4 kolom; sidebar filter menetap; tabel menggantikan daftar kartu (konsol) |
| `xl` | ≥ 1280 | Lebar konten maksimum tercapai |
| `2xl` | ≥ 1536 | Grid 5 kolom (katalog); konten tidak melebar lagi |

- **Wadah:** lebar penuh dengan gutter; **maksimum 1240 px** (konten), teks **68ch**.
- **Grid:** 4 kolom (ponsel) / 8 (tablet) / 12 (desktop), jarak 12/16/24 px.
- **Jangan bergantung pada lebar viewport saja:** komponen memakai **Container Queries** (`@container`) agar `ProductCard`, `ReceiptCard`, dan panel menyesuaikan lebar wadahnya.

### 4.2 Aturan wajib
1. **Tidak ada scroll horizontal tak sengaja** pada **320 px** (WCAG reflow) dan pada zoom 400%.
2. **Unit relatif** (`rem`, `%`, `clamp`, `ch`, `fr`). **Tidak ada tinggi tetap** untuk konten; gunakan `min-height`.
3. **`100dvh`/`svh`**, bukan `100vh` (bilah alamat ponsel). **Tidak ada trik tinggi layar** yang rapuh.
4. **Area aman:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` dan padding `env(safe-area-inset-*)` pada bilah tempel, sheet, dan navigasi bawah.
5. **Sasaran sentuh ≥ 44×44 px**, jarak antar-sasaran ≥ 8 px. Aksi utama di **zona jempol** (bagian bawah) pada ponsel.
6. **Hover hanya penambah**: bungkus dengan `@media (hover: hover)`. Tidak ada fungsi yang **hanya** tersedia lewat hover.
7. **Orientasi lanskap** ponsel diuji; bilah tempel tidak boleh menutup lebih dari ±25% tinggi layar.
8. **Menghormati ukuran huruf pengguna** (sampai 200%) tanpa memotong atau menimpa konten.
9. **Gambar** selalu responsif (`srcset`, `sizes`); **video** menyesuaikan rasio.
10. **Layar lebar:** konten **tidak melebar** melewati maksimum; grid menambah kolom, bukan memperbesar kartu.

### 4.3 Pola tata letak per titik henti
| Elemen | Ponsel (< 768) | Tablet (768–1023) | Desktop (≥ 1024) |
|---|---|---|---|
| **Header** storefront | Logo, ikon cari, ikon keranjang, menu; **pemilih wilayah** sebagai chip di bawahnya | Logo, kolom cari, wilayah, keranjang | Logo, kolom cari lebar, wilayah, navigasi, keranjang |
| **Filter katalog** | **Sheet bawah** (tinggi 90%) dengan tombol tempel "Tampilkan N barang" | Sheet samping | **Sidebar 280 px** menetap (tempel) |
| **Detail barang** | Galeri penuh lebar (geser) + info + **bilah aksi tempel di bawah** | Dua kolom ringan | **Dua kolom**: galeri (7/12) + panel info **tempel** (5/12) |
| **Checkout** | Satu kolom bertahap + **total tempel** di bawah | Satu kolom lebar | **Dua kolom**: form (7/12) + ringkasan **tempel** (5/12) |
| **Keranjang** | Halaman penuh | Halaman | **Laci samping** atau halaman |
| **Lengkapi data** (profil dan alamat) | Layar penuh bertahap dengan penanda progres; satu pertanyaan utama per layar | Satu kolom lebar | Dua kolom: form + ringkasan kelengkapan |
| **Halaman Toko** | Sampul + info ringkas + tab (Barang, Tentang, Program, Ulasan) | Sampul lebar + tab | Sampul lebar; **panel info tempel** di kiri (280 px) dan katalog toko di kanan |
| **Konsol: navigasi** | **Tab bawah** (4–5) + tombol aksi utama "Tambah barang" | **Rel ikon** di kiri | **Sidebar** (dapat diciutkan) |
| **Konsol: data** | **Daftar kartu** (bidang kunci + menu aksi) | Daftar kartu rapat | **Tabel** (kolom dapat diurutkan, filter, aksi massal) |
| **Konsol: review admin** | Satu kolom bertahap | Dua kolom | **Berdampingan**: media (kiri) dan butir SOP + aksi (kanan) |

---

## 5. Komponen inti

Setiap komponen dibangun di `packages/ui`, **didokumentasikan di Storybook dengan semua status**, dan lolos axe. Status wajib: **default, hover (hanya perangkat hover), fokus, aktif, nonaktif, memuat, galat**, dan bila relevan **kosong**.

| Komponen | Spesifikasi |
|---|---|
| **Tombol** | Varian: utama (`indigo` + teks putih), sekunder (batas `indigo`), tersier (teks), destruktif (`bahaya`). Tinggi ≥ 44 px. Status **memuat** menjaga lebar dan menonaktifkan klik ganda. Teks = **kata kerja yang jelas** ("Bayar sekarang", bukan "Kirim") |
| **Field** (teks, angka, telepon, Rupiah, tekstarea) | Label **di atas** (bukan placeholder); batas `--garis-kuat`; teks bantu; pesan galat **teks** dengan ikon; `autocomplete`, `inputmode`, `enterkeyhint` yang benar |
| **Combobox wilayah** | Pencarian bertingkat Provinsi → Kel/Desa; dapat diketik; ramah keyboard dan layar sentuh |
| **Chip filter** | Terpilih = `indigo-muda` + ikon centang (tidak hanya warna) |
| **Lencana status** | Tersedia / Ditahan / Terjual: **ikon + teks**, bukan hanya warna |
| **Lencana Grade** | A/B/C dengan **kata** ("Grade B, baik"), bukan hanya huruf berwarna |
| **Segel Kurasi** | Segel kecil di kartu dan detail; di detail dapat dibuka menjadi **daftar butir SOP yang lulus** dengan foto/video bukti |
| **Kartu Barang** | Foto 4:5, judul (maks 2 baris), **harga (Bricolage, tabular)**, lencana grade, wilayah, **Segel Kurasi kecil**; **tag kode barang** di sudut dengan lubang tali kecil (motif label). **Satu radius `--r-md`, tanpa bayangan**. Seluruh kartu dapat disentuh; fokus jelas |
| **Galeri** | Geser (ponsel), tombol sebelumnya/berikutnya, **indikator posisi "3 dari 8"**, **zoom** (cubit/klik), miniatur (desktop), video dengan poster. Alternatif **tombol** untuk semua gestur |
| **Blok Harga** | Harga besar, **ongkir/ambil** langsung di bawahnya, label Charity bila ada |
| **Hitung mundur hold** | Menampilkan sisa menit; **diumumkan pembaca layar hanya pada ambang** (mis. 10, 5, 1 menit), bukan tiap detik; sinkron dengan **jam server** |
| **Stepper checkout** | Langkah **memang berurutan**, jadi penomoran diperbolehkan; langkah selesai dapat dibuka kembali |
| **Sheet bawah** | Fokus terkunci di dalam, tutup dengan tombol/Esc/geser, area aman |
| **Dialog** | Hanya untuk keputusan penting; judul menjelaskan konsekuensi; tombol bernama jelas |
| **Toast** | Singkat, tidak menutup aksi, `aria-live="polite"`; nama aksi **sama** dengan tombolnya ("Ditambahkan ke keranjang") |
| **Keadaan kosong** | Menjelaskan **apa** dan **apa yang bisa dilakukan** (ajakan bertindak), bukan hanya ilustrasi |
| **Skeleton** | Berbentuk sama dengan konten (tidak menggeser tata letak) |
| **Lini masa status pesanan** | Urutan nyata (Dibayar → Disiapkan → Dikirim/Siap diambil → Diterima → Selesai); langkah sekarang ditandai jelas dengan teks |
| **Kuitansi Kebaikan** | Lihat Bagian 6 (komponen khas) |
| **Bilah progres program** | Nilai terkumpul/target sebagai **teks** dan bilah; `role="progressbar"` |
| **Antrean unggah** (konsol) | Per berkas: pratinjau, progres, **jeda/lanjutkan/ulangi**, status; tidak memblokir halaman |
| **Butir checklist SOP** (konsol) | Pertanyaan, kontrol sesuai tipe, **tombol "Ambil foto/video"** yang langsung membuka kamera, status lulus/gagal, **tindakan bila gagal** (perbaiki/tolak/keterbukaan) |
| **Tabel responsif** (konsol) | Menjadi daftar kartu di bawah 1024 px; kolom kunci dipertahankan; aksi di menu |
| **Bilah tempel** | Memakai area aman; tidak menutup konten terakhir (beri `padding-bottom`) |
| **Progres kelengkapan profil** | Penanda langkah + daftar yang kurang; tiap butir dapat dibuka; selesai = "Siap Beli" |
| **Formulir alamat** | Combobox wilayah bertingkat, kode pos otomatis, validasi per field, peringatan alamat belum lengkap, contoh penulisan |
| **Layar Periksa pesananmu** | Ringkasan per blok dengan tombol Ubah; centang "Data sudah benar" mengaktifkan tombol konfirmasi |
| **Kartu Toko** | Logo, nama, wilayah, lencana level, rating (atau "Toko baru"), status buka/tutup |
| **Lencana level toko** | Level 1/2/3 dengan **teks**, bukan hanya warna |
| **Status verifikasi alamat** (konsol) | Diajukan / Dalam verifikasi / Perlu perbaikan / Terverifikasi / Ditolak, dengan catatan per butir V1–V8 |

---

## 6. Komponen khas: Kuitansi Kebaikan

**Tujuan:** menjawab "uang saya ke mana?" dengan cara yang tidak terlupakan. Muncul di **halaman konfirmasi**, **email**, **halaman pesanan**, dan dapat **dibagikan** (gambar/PDF, **tanpa data pribadi**).

**Tampilan:** kertas struk sempit (lebar 320–380 px, di tengah pada layar lebar), tepi atas dan bawah **bergerigi** (CSS mask), garis putus-putus, angka **rata kanan** `tabular-nums`, satu **segel** kecil. Tidak ada gradien dan tidak ada bayangan berlebihan.

**Isi (urutan tetap):**
```
Kuitansi Kebaikan
Pesanan BRK-2026-00123
19 November 2026, 14:32 WIB
- - - - - - - - - - - - - - - - - - - -
Kemeja batik anak, grade B      Rp 100.000
Ongkir                           Rp 12.000
Biaya kemas                       Rp 2.000
Pembulatan Kebaikan               Rp 1.000
- - - - - - - - - - - - - - - - - - - -
Total dibayar                   Rp 115.000

Ke mana uangnya pergi
Harga barang                    Rp 100.000
Biaya transaksi                  - Rp 1.000
Keuntungan bersih                Rp 99.000
  Koordinator wilayah (40%)      Rp 39.600
  Dana kegiatan (30%)            Rp 29.700
  Operasional (25%)              Rp 24.750
  Dana jaminan pembeli (5%)       Rp 4.950
Pembulatan Kebaikan ke program    Rp 1.000
Ongkir dan kemas untuk koordinator Rp 14.000

Dikurasi oleh [Nama toko], Koordinator Bandung Barat
Program yang kamu danai: [nama program]
- - - - - - - - - - - - - - - - - - - -
[Lihat laporan program]   [Bagikan]
```
> Angka di atas **contoh ilustrasi** (bagi hasil sama dengan `prd.md` 8.3: skema 40/30/25/5). Persentase dan nilai **selalu dari data pesanan** (snapshot skema), tidak dihitung ulang di klien.

**Aturan:**
- Tampilkan rincian bagi hasil bila pengaturan `show_split_breakdown` **aktif** (bawaan: aktif). Tidak menampilkan nama pribadi atau dompet.
- **Satu momen gerak:** saat konfirmasi pesanan, kuitansi **"keluar" dari celah** ke bawah (320 ms). Dengan `prefers-reduced-motion`: **muncul langsung**.
- **Versi bagikan:** gambar/PDF berisi ringkasan dampak tanpa nama pembeli, nomor HP, atau alamat.
- Aksesibel: struktur `table`/`dl` yang benar; **bukan gambar**.

---

## 7. Spesifikasi halaman: Storefront

Bahasa: Indonesia sederhana, huruf kecil kalimat, kata kerja jelas.

### 7.1 Beranda
**Tujuan:** menunjukkan barang nyata dan membuat orang memilih wilayah serta mulai menjelajah.

```
Ponsel (320-479)                      Desktop (>=1024)
+--------------------------+          +--------------------------------------------------+
| Logo      cari  keranjang|          | Logo   [ Cari barang...         ]  Wilayah  Keranjang |
| [ Bandung Raya  v ]      |          +--------------------------------------------------+
|                          |          | Barang layak pakai dari       | Kuitansi Kebaikan   |
| Barang layak pakai dari  |          | warga sekitarmu.              | (contoh, bergerigi) |
| warga sekitarmu.         |          | Setiap pembelian mendanai     |                     |
| Setiap pembelian         |          | kebaikan.                     |                     |
| mendanai kebaikan.       |          | [ Wilayah v ] [ Cari ]        |                     |
| [ Lihat barang ]         |          +--------------------------------------------------+
|                          |          | Baru terbit di Bandung Raya      Lihat semua      |
| Baru terbit  (geser >>)  |          | [kartu][kartu][kartu][kartu][kartu]               |
| [kartu][kartu][kartu]    |          +--------------------------------------------------+
|                          |          | Kategori (baris ikon+teks)                        |
| Kategori (2 baris)       |          | Cara kerja (alur nyata 4 langkah)                 |
| Cara kerja               |          | Dampak: angka dari data nyata + tautan transparansi |
| Kuitansi Kebaikan contoh |          | Program Charity berjalan                          |
| Dampak                   |          | Footer                                            |
+--------------------------+          +--------------------------------------------------+
```
- **Pembuka (hero):** judul pendek rata kiri (`--t-3xl`), **pemilih wilayah** sebagai aksi utama, tombol "Lihat barang". **Tidak ada** gradien atau angka statistik besar sebagai pembuka. Di desktop, **contoh Kuitansi Kebaikan** mengisi sisi kanan sebagai pembeda; di ponsel muncul di bagian "Cara kerja".
- **Barang terbaru** (baris geser pada ponsel, grid pada desktop): data nyata, bukan placeholder.
- **Toko di wilayahmu:** baris kartu toko (nama, wilayah, level, rating) yang menuju Halaman Toko.
- **Cara kerja:** empat langkah **memang berurutan** (Donatur menyerahkan → Koordinator mengurasi → Kamu membeli → Hasilnya jadi kebaikan), sehingga penomoran sah.
- **Dampak:** angka dari API `/impact` dengan **tanggal pembaruan**; tautan ke halaman Dampak. Bila belum ada data: keadaan kosong jujur ("Baru dimulai di Bandung Raya").
- **Kondisi:** memuat (skeleton), kosong, galat jaringan (coba lagi), di luar area pilot (ajak jadi yang pertama).

### 7.2 Katalog
- **Ponsel:** kolom cari tempel di atas; baris **chip** (Kategori, Harga, Grade, Serah, Charity) yang membuka **sheet filter**; hasil **2 kolom**; tombol urutan. **Muat lebih** (tombol, bukan gulir tak terbatas yang menghilangkan footer dan posisi) dengan posisi gulir dipulihkan saat kembali dari detail.
- **Desktop:** sidebar filter menetap 280 px; hasil 4 kolom (5 di ≥ 1536).
- **Filter:** kategori, wilayah, rentang harga, grade, **ambil/kirim**, **Charity**, urutan (terbaru, harga). Filter aktif tampil sebagai chip yang dapat dihapus satu per satu; **tombol "Hapus semua"**.
- **Kondisi kosong:** "Belum ada barang yang cocok. Coba hapus satu filter atau ubah wilayah" + aksi.
- **URL** mencerminkan filter (dapat dibagikan dan dipulihkan). **SEO:** halaman kategori/wilayah terindeks.

### 7.3 Detail barang
```
Ponsel                               Desktop
+---------------------------+        +----------------------------------------------+
| < Kembali                 |        | Breadcrumb                                    |
| [ Galeri geser, 4:5 ]     |        | +-------------------------+ +--------------+ |
|   3 dari 8                |        | | Galeri (miniatur kiri)  | | Judul         | |
| Judul                     |        | |                         | | Rp 125.000    | |
| Rp 125.000                |        | |                         | | Grade B       | |
| Grade B  Tersedia         |        | |                         | | Segel Kurasi  | |
| Segel Kurasi (buka)       |        | |                         | | Ambil/Kirim   | |
| Kekurangan (jelas)        |        | +-------------------------+ | [Tambah ke    | |
| Keterangan                |        |  Kekurangan, Keterangan     |  keranjang]   | |
| Ambil / kirim + ongkir    |        |  Hasil kurasi (SOP)         | [Beli sekarang]| |
| Koordinator + wilayah     |        |  Koordinator, Charity       +--------------+ |
| Info Charity (bila ada)   |        |  Barang serupa                                 |
| Barang serupa             |        +----------------------------------------------+
+---------------------------+
| Rp 125.000  [Tambah ke    |  <- bilah tempel (area aman)
|             keranjang]    |
+---------------------------+
```
- **Urutan informasi** (penting untuk kepercayaan): foto → judul → **harga** → **grade + status** → **Segel Kurasi** → **kekurangan** → keterangan → serah dan ongkir → **toko** (nama, level, rating, wilayah; tautan ke Halaman Toko) → Charity → barang serupa.
- **Kekurangan** tampil **setara** dengan keterangan, bukan disembunyikan.
- **Segel Kurasi:** ketuk untuk membuka daftar butir SOP yang lulus + bukti media.
- **Status:** Tersedia / **Ditahan** ("Sedang dibayar orang lain. Coba lagi nanti") / Terjual. Barang Terjual tetap dapat dibuka (tidak 404) dan menampilkan barang serupa.
- **Kelangkaan jujur:** boleh menulis "Satu-satunya" karena barang memang unik. **Dilarang** tekanan palsu ("tinggal 1!", penghitung palsu).
- **Charity:** blok `daun-muda` dengan nama program, progres, dan tautan.
- **Bilah tempel** memuat harga + aksi utama; tidak menutup konten (beri ruang bawah).
- Data tidak menyertakan apa pun tentang donatur.

### 7.3a Halaman Toko
**Tujuan:** membangun kepercayaan pada penjual lokal.
- **Ponsel:** sampul (rasio 3:1), logo, nama toko, wilayah (Kab/Kota), **lencana level**, rating (angka + jumlah ulasan), **jam operasional** ("Buka sekarang" atau "Tutup, buka lagi besok 09.00", memakai zona waktu wilayah), tombol Bagikan. **Tab:** Barang · Tentang · Program · Ulasan. **Desktop:** panel info tempel di kiri, katalog toko di kanan.
- **Tentang:** deskripsi, kebijakan toko, cara ambil (**area**, bukan alamat lengkap), dan **kecepatan layanan dari data nyata** ("Biasanya diproses dalam 1 hari").
- **Program:** program Charity aktif milik toko dengan progres.
- **Toko baru** (< 10 pesanan) tampil sebagai **"Toko baru"**, bukan bintang kosong.
- **Toko dijeda:** banner "Toko sedang libur sampai [tanggal]. Barang tidak bisa dipesan sementara." Barang tidak muncul di katalog; halaman tetap bisa dibuka.
- **Privasi:** tidak menampilkan alamat lengkap, nomor telepon, atau nama pribadi koordinator selain nama tampil toko.
- Hanya toko **aktif** dengan **alamat terverifikasi** yang punya halaman publik.

### 7.4 Keranjang
- Barang unik: **tanpa kuantitas**. Daftar per koordinator (karena **sub-pesanan dan ongkir terpisah**) dengan penjelasan satu kalimat.
- Menunjukkan: subtotal, perkiraan ongkir, **catatan bahwa barang baru ditahan saat pesanan dikonfirmasi** (jujur). Tanpa akun: keranjang **disimpan di perangkat dan digabung saat masuk**; tombol lanjut menuju **Masuk** bila belum punya akun.
- **Gabung ongkir:** bila ada barang lain dari toko yang sama, tampilkan "Tambah barang dari toko ini, hemat ongkir Rp X" **hanya bila penghematan nyata** (angka dari server).
- Bila ada barang yang sudah tidak tersedia: tandai jelas dan tawarkan **hapus**.

### 7.5 Akun, Lengkapi data, dan Checkout
**Akun wajib untuk membuat pesanan.** Menjelajah dan mengisi keranjang boleh tanpa akun.

Alur (urutan nyata): **1 Masuk atau daftar → 2 Lengkapi data (bila belum "Siap Beli") → 3 Serah → 4 Periksa pesananmu → 5 Bayar.**

- **Masuk/daftar:** nomor HP + **OTP** (kotak kode, tempel dari pesan, kirim ulang dengan penghitung, batas percobaan jelas). **Keranjang tidak hilang.**
- **Lengkapi data (gerbang):** layar dengan **progres** ("3 dari 5 langkah") dan daftar yang masih kurang: nama lengkap, **email terverifikasi**, persetujuan syarat dan privasi, dan **alamat** (untuk kirim). Tiap butir terbuka satu per satu. Setelah lengkap, pengguna **kembali ke checkout dengan keranjang utuh**. **Tidak ada penahanan barang selama melengkapi data.** Teks pembuka: "Lengkapi data dulu supaya pesananmu sampai dengan benar."
- **Formulir alamat (mencegah salah input):** penerima → HP penerima → Provinsi → Kab/Kota → Kecamatan → Kelurahan/Desa (**combobox yang bisa dicari**) → **kode pos terisi otomatis** (boleh dikoreksi) → jalan dan nomor → RT/RW → **patokan** → jenis tempat. Validasi **per field saat blur**; **peringatan "Alamat tampak belum lengkap"** dengan contoh penulisan yang benar; tidak memotong isian; alamat bisa disimpan (maks. 5) dan dijadikan utama.
- **Serah:** **Ambil** (tampilkan **area** titik ambil; alamat lengkap dibuka setelah bayar) atau **Kirim** (pilih alamat tersimpan; **ongkir langsung dihitung**). Barang "Ambil di tempat saja" menonaktifkan opsi kirim **dengan alasan**.
- **Periksa pesananmu (wajib):** barang per toko, serah dan alamat/area titik ambil, nomor HP penerima, rincian (barang, ongkir, biaya kemas, **Pembulatan Kebaikan opsional, tidak dicentang secara default**), total. Setiap blok punya tombol **Ubah**. **Centang "Data sudah benar"**; tombol **Konfirmasi dan bayar** nonaktif sampai dicentang. Teks: "Barang akan ditahan 30 menit setelah kamu mengonfirmasi."
- **Konfirmasi dan bayar:** **hold 30 menit dimulai di sini**, hitung mundur terlihat; pilih QRIS / VA / e-wallet; instruksi jelas; **status diperbarui otomatis**; tombol "Saya sudah membayar" hanya memeriksa ulang status.
- **Galat dan konflik:** `422 PROFILE_INCOMPLETE` → kembali ke "Lengkapi data" dengan butir yang kurang disorot; `409` (barang sudah ditahan/terjual) → pesan khusus dengan **aksi** (lihat barang serupa); `409 ORDER_UNDER_REVIEW` → penjelasan netral dan kontak bantuan; jaringan putus → data form **tidak hilang**; hold habis → penjelasan dan tombol mulai ulang.
- **Ponsel:** total **tempel** di bawah; ringkasan dapat dibuka (sheet). **Desktop:** ringkasan **tempel** di kanan.
- **Idempoten:** setiap aksi pembuatan memakai `Idempotency-Key` (dibuat sekali per niat); tombol tidak bisa diklik ganda.
- **Koreksi alamat setelah bayar:** tombol "Ubah alamat" hanya aktif sampai koordinator mulai menyiapkan dan hanya dalam zona ongkir yang sama; selain itu tampilkan alasan.

### 7.6 Konfirmasi dan Kuitansi
Halaman sukses dengan **Kuitansi Kebaikan** (momen gerak tunggal), **kode ambil atau perkiraan kirim**, dan tindakan berikut (lacak pesanan, bagikan).

### 7.7 Lacak pesanan
Akses lewat **akun** (halaman Pesanan saya). Menampilkan **lini masa status**, detail serah, kode ambil (bila ada), tautan **Komplain** (aktif 48 jam setelah diterima), dan Kuitansi.

### 7.8 Komplain
Alasan (pilihan), keterangan, **unggah foto/video bukti** (komponen yang sama dengan konsol), pernyataan batas waktu, dan status penanganan. Ramah ponsel.

### 7.9 Dampak dan Transparansi
Angka agregat (barang terjual, dana kebaikan, program didanai) **per wilayah**, daftar program dengan progres, dan dokumentasi. Setiap angka punya **tanggal pembaruan** dan **tautan ke rujukannya**. Grafik hanya bila membantu dan selalu disertai **tabel/teks yang setara**.

### 7.10 Program Charity (detail)
Tujuan, penerima manfaat (deskripsi, **tanpa data pribadi**), progres dana (teks + bilah), dokumentasi, **laporan penggunaan dana** setelah disetujui. **Wajah anak tidak ditampilkan** tanpa persetujuan wali.

### 7.11 Halaman statis, akun, dan keadaan khusus
- **Statis:** cara kerja, FAQ, kebijakan, kontak, **kanal pembayaran resmi dan peringatan penipuan** (selalu mudah ditemukan).
- **Akun (wajib untuk memesan):** **Pesanan saya**, **Alamat**, **Profil dan kelengkapan** (penanda "Siap Beli" dan yang kurang), favorit tersinkron, keluar, hapus akun. Ubah nomor HP/email memerlukan verifikasi ulang.
- **404/barang tidak ada:** penjelasan + pencarian + barang terbaru.
- **Offline:** halaman offline yang membantu; keranjang tetap tersimpan.
- **Galat server:** pesan jelas + coba lagi.

### 7.12 SEO dan berbagi (wajib)
Judul/meta unik, **Open Graph** dan kartu sosial (foto sampul, harga, wilayah), data terstruktur produk, sitemap, `canonical`, URL slug stabil. **Pratinjau tautan di WhatsApp harus rapi** (uji manual). Halaman terjual tetap ada dengan status jelas. Halaman **Toko** (aktif saja) ikut terindeks.

---

## 8. Spesifikasi: Konsol (Koordinator dan Admin)

### 8.1 Kerangka dan navigasi
- **Ponsel:** **tab bawah** (Dasbor, Barang, Pesanan, Dompet, Lainnya) + tombol aksi utama **"Tambah barang"**; header ringkas dengan peran/wilayah aktif.
- **Tablet:** rel ikon. **Desktop:** sidebar dapat diciutkan, pencarian cepat.
- **Menu berdasarkan peran:** menu yang tidak berhak **tidak tampil** (server tetap menegakkan).
- **Status global** terlihat: koneksi, unggahan berjalan, notifikasi.

### 8.1a Toko saya (Koordinator)
- **Kesiapan toko:** daftar periksa (profil toko, alamat lengkap, bukti, foto, verifikasi Admin) dengan status tiap butir. **Barang tidak bisa diajukan atau diterbitkan sebelum alamat terverifikasi**; tombol terkait nonaktif dengan penjelasan dan tautan ke halaman ini.
- **Formulir alamat toko (bertahap):** alamat terstruktur → **pin peta** (geser pin, peringatan bila di luar wilayah penugasan) → **foto tampak depan (≥ 2) dan ruang penyimpanan** (kamera langsung) → **foto bukti alamat** → kontak toko → jenis dan status tempat. Simpan draf; **Ajukan verifikasi**.
- **Status verifikasi:** Diajukan → Dalam verifikasi → Perlu perbaikan (catatan per butir) → Terverifikasi; jadwal tur video/kunjungan; tanggal verifikasi ulang berikutnya.
- **Ubah alamat:** peringatan bahwa perlu verifikasi ulang; **dinonaktifkan bila ada pesanan aktif** (tampilkan pesanan terkait). Alamat lama tetap berlaku selama proses.
- **Profil toko:** nama, logo, sampul, deskripsi (penghitung ≤ 500 karakter), jam operasional, kebijakan tambahan; **pratinjau persis seperti publik**; status moderasi.
- **Jeda toko (cuti):** pilih tanggal, penjelasan dampak, pesanan aktif tetap wajib diselesaikan.
- **Skor Toko dan level:** komponen, tren, hal yang perlu diperbaiki, syarat naik level.

### 8.2 Dasbor
Koordinator: barang per status, **pesanan perlu tindakan (dengan sisa waktu SLA)**, saldo Tertunda/Tersedia, tugas revisi, **saran turun harga untuk barang yang menua**, Skor Toko. Admin: antrean review, SLA, komplain terbuka, penarikan menunggu, selisih rekonsiliasi. **Kartu tugas** (apa yang harus dikerjakan sekarang), bukan hanya angka.

### 8.3 Barang: alur kamera-first
Ini **alur paling sering dipakai koordinator**, jadi harus luar biasa di ponsel.

1. **Pilih donatur** (cari/tambah cepat) dan **persetujuan** (wajib).
2. **Pilih kategori** → checklist SOP dimuat.
3. **Checklist SOP**: satu butir per layar pada ponsel (daftar ringkas di desktop). Butir bertipe foto/video langsung membuka **kamera** dengan **panduan sudut** (depan, belakang, samping, close-up cacat, skala).
4. **Data publik**: judul, keterangan, **kekurangan**, grade, berat, dimensi, harga referensi baru, **harga usulan** (dengan peringatan bila di luar pedoman, tampil rentang yang disarankan).
5. **Pratinjau** persis seperti storefront (komponen yang sama).
6. **Ajukan review** (aktif hanya bila semua butir wajib lulus; bila tidak, tampilkan **butir mana yang belum**).

Aturan:
- **Gerbang toko:** bila alamat toko belum terverifikasi, tombol **Ajukan review** nonaktif dengan penjelasan dan tautan ke **Toko saya**.
- **Simpan draf otomatis** (IndexedDB + server); tidak ada data hilang saat koneksi putus.
- **Antrean unggah** tahan koneksi buruk: kompres foto **di perangkat** (Web Worker, tidak membekukan UI), **jeda/lanjutkan**, ulangi otomatis, progres terlihat.
- Indikator kelengkapan ("7 dari 10 butir lulus") dan **navigasi cepat ke butir yang kurang**.
- Setelah terbit: **cetak label** (kode + QR) langsung dari ponsel/desktop.

### 8.4 Pesanan (Koordinator)
Daftar dengan **penanda SLA** (warna + teks: "sisa 5 jam"). Detail: barang, pembeli (secukupnya), **alamat/ kode ambil**, tombol bertahap: **Mulai menyiapkan → Siap diambil / Kirim**. Pengiriman: kurir, **resi**, **foto kemasan dan resi (wajib)**. Verifikasi **kode ambil** (6 digit atau pindai QR) dengan umpan balik jelas.

### 8.5 Komplain
Percakapan dengan bukti, batas waktu tanggapan terlihat, putusan admin dan dampaknya ke komisi dijelaskan.

### 8.6 Dompet
Saldo **Tertunda** dan **Tersedia** (serta **penggantian ongkir dan kemas**, tersedia saat dikirim) dengan penjelasan satu kalimat; rincian per pesanan (harga → bagian koordinator); **pengaturan persen komisi ke Charity**; **ajukan penarikan** (minimal ditampilkan); riwayat. Angka **rata kanan, tabular**.

### 8.7 Charity
Ajukan program (form bertahap), status persetujuan, **Dompet Program**, **ajukan pencairan**, **laporan penggunaan** (unggah nota/foto), pengingat batas laporan.

### 8.8 Admin
- **Antrean review (inti):** desktop **berdampingan** (media + butir SOP dengan lulus/gagal + riwayat); aksi **Setujui / Minta revisi (per butir) / Tolak** dengan catatan; penanda umur antrean vs SLA; pintasan keyboard.
- **Koordinator dan wilayah:** daftar, verifikasi (identitas dan rekening ditampilkan **seperlunya**, akses tercatat), level, sanksi.
- **Verifikasi toko dan alamat:** antrean pengajuan; tampilan **berdampingan** (data alamat, pin peta, foto, bukti) dan **butir V1–V8** dengan lulus/gagal + catatan; aksi Terverifikasi / Perlu perbaikan / Tolak; penjadwalan tur video atau kunjungan; moderasi nama dan konten toko.
- **Keuangan:** penarikan (setujui, unggah bukti), rekonsiliasi (selisih disorot), koreksi ledger (alasan wajib), alokasi dana ke program.
- **Konfigurasi:** template SOP (editor butir berversi), **skema bagi hasil** (lima bagian: koordinator, kegiatan, operasional, jaminan, donatur; validasi total 100% **di UI dan server**; pratinjau hitungan dari contoh; tombol **Umumkan** dengan tanggal berlaku **≥ 30 hari**), pedoman harga, tabel ongkir, kategori, pengaturan umum. **Setiap perubahan menampilkan dampaknya** dan meminta konfirmasi.
- **Audit log:** pencarian per target/aktor.

### 8.9 Pola konsol umum
- **Aksi berisiko** (terbitkan, tarik, catat pembayaran, refund, koreksi) memakai **dialog dengan konsekuensi jelas**.
- **Tabel/daftar:** pencarian, filter tersimpan, urutan, paginasi sisi server, aksi massal (Fase 2).
- **Konflik edit** (`409`): tampilkan siapa dan kapan mengubah, tawarkan muat ulang tanpa kehilangan input.
- **Data pribadi** disamarkan secara default (tampilkan sebagian), dibuka sesuai kebutuhan.

---

## 9. Form, data, dan galat

### Form
- Label di atas, **placeholder bukan label**; teks bantu ringkas; galat **berupa teks** dekat field dan **ringkasan galat** di atas form (fokus dipindah ke sana).
- Validasi: **saat blur dan saat kirim**; **data tidak hilang** saat galat.
- **Format Indonesia:** telepon (normalisasi ke `+62`), Rupiah (`Rp 125.000`, input numerik, **bilangan bulat**), tanggal `19 November 2026`, jam dengan **WIB/WITA/WIT**.
- `autocomplete`, `inputmode`, `enterkeyhint`, `autocapitalize` yang tepat.
- **Hindari CAPTCHA yang menghalangi**; gunakan honeypot, pembatasan laju, OTP, dan opsi CAPTCHA yang aksesibel bila perlu.

### Data dan status
- **Server adalah sumber kebenaran** (TanStack Query: cache, retry, invalidasi). Pembaruan optimistis **hanya** untuk aksi aman (favorit), **tidak** untuk uang atau stok.
- **Idempotency-Key** dibuat per niat pengguna dan dikirim ulang saat percobaan ulang.
- Tangani `401` (sesi), `403`, `404`, `409` (konflik: pesan spesifik), `422` (galat per field), `429` (tunggu), `5xx` (coba lagi).
- **Jam server** untuk hitung mundur; jangan percaya jam perangkat.
- **Offline:** deteksi koneksi, tampilkan status, antre aksi yang aman.

### Teks (microcopy)
Bahasa Indonesia sederhana, huruf kecil kalimat, kata kerja jelas, **satu nama untuk satu hal** di seluruh alur.

| Konteks | Teks |
|---|---|
| Tombol beli | "Tambah ke keranjang", "Bayar sekarang" |
| Toast tambah | "Ditambahkan ke keranjang" |
| Barang ditahan | "Sedang dibayar orang lain. Coba lagi dalam beberapa menit." |
| Hold habis | "Waktu pembayaran habis. Barang dikembalikan ke katalog. Mulai lagi?" |
| Galat form | "Nomor HP belum lengkap. Tulis 10 sampai 13 digit, misalnya 0812 3456 7890." |
| Kosong katalog | "Belum ada barang yang cocok. Coba hapus satu filter atau ganti wilayah." |
| Pembulatan | "Tambah kebaikan Rp 1.000 untuk program di wilayahmu" (tidak dicentang) |
| SOP gagal | "Butir ini belum lulus. Perbaiki atau ajukan penolakan barang." |
| Ajukan review | "Ajukan review" → toast "Diajukan untuk review" |
| Profil belum lengkap | "Lengkapi data dulu supaya pesananmu sampai dengan benar." |
| Alamat tampak belum lengkap | "Alamat ini tampak belum lengkap. Tambahkan nomor rumah, RT/RW, dan patokan, misalnya: Jl. Cihampelas No. 12, RT 03/RW 05, dekat Masjid Al-Hidayah." |
| Periksa pesanan | "Periksa lagi alamat, nomor HP, dan barangmu. Centang bila sudah benar." |
| Alamat toko belum terverifikasi | "Alamat tokomu belum terverifikasi, jadi barang belum bisa diterbitkan. Lengkapi dan ajukan verifikasi." |
| Toko dijeda | "Toko sedang libur sampai 25 November. Barang bisa dipesan lagi setelah itu." |

---

## 10. Aksesibilitas (WCAG 2.2 AA)

- **Kontras** sesuai Bagian 3.1. **Status tidak hanya warna** (ikon + teks).
- **Keyboard penuh:** urutan fokus logis, **fokus terlihat** (`outline: 3px solid var(--indigo); outline-offset: 2px`; di latar gelap pakai `--kunyit`), tanpa jebakan fokus; dialog/sheet mengelola fokus dan menutup dengan Esc.
- **Sasaran** ≥ 44 px (lebih ketat dari minimum 24 px WCAG 2.2).
- **Alternatif non-gestur:** setiap geser/seret (galeri, urutan foto) punya **tombol**; **tidak ada fungsi yang hanya lewat drag**.
- **Pembaca layar:** landmark (`header`, `nav`, `main`, `footer`), judul berjenjang, label form, `aria-live` secukupnya (hitung mundur hanya pada ambang), **teks alternatif foto barang** dari judul + kondisi, ikon bermakna berlabel.
- **Bahasa:** `lang="id"`.
- **Zoom dan reflow:** sampai **200% ukuran huruf** dan **400% zoom** tanpa kehilangan konten atau scroll dua arah.
- **Gerak:** hormati `prefers-reduced-motion`; tidak ada kedipan.
- **Video:** kontrol terlihat; takarir/transkrip bila tersedia; tidak putar otomatis.
- **Form:** galat dikaitkan lewat `aria-describedby`; `aria-invalid`; fokus ke galat pertama.
- **Uji:** axe otomatis di CI + **uji manual dengan pembaca layar (TalkBack dan VoiceOver)** pada alur beli dan alur unggah.

---

## 11. Larangan (anti-pola)

**Dilarang** di kedua aplikasi:
1. Label **KAPITAL berjarak** di atas judul ("eyebrow"), atau label bergaya `KATA — fragmen`.
2. **Tanda panah "→"** ditambahkan pada teks tombol atau tautan.
3. Titik tengah sebagai pemisah meta ("A · B · C"). Pisahkan dengan baris, koma, atau elemen terpisah.
4. **Huruf monospace** untuk label kecil (pakai `tabular-nums`).
5. **Gradien dekoratif**, kartu seragam dengan bayangan abu yang sama di mana-mana, hover bergerak pada setiap kartu, animasi masuk per bagian.
6. Satu kata disorot (miring/warna) di dalam judul.
7. Penomoran "01 / 02 / 03" pada hal yang **bukan** urutan.
8. **Foto stok generik** (tangan, hati, orang tersenyum). Pakai foto barang dan dokumentasi nyata.
9. **Kelangkaan/tekanan palsu**, hitung mundur palsu, centang otomatis untuk donasi, *dark pattern* apa pun.
10. Teks di atas foto tanpa latar yang menjamin kontras.
11. Ikon tanpa label untuk aksi penting; fungsi yang hanya ada saat hover.
12. Mengunci zoom (`user-scalable=no`), `100vh` rapuh, tinggi tetap pada konten.
13. Pesan galat samar atau meminta maaf berlebihan; kosong tanpa arahan.
14. Memuat pelacak/skrip pihak ketiga yang tidak perlu.

---

## 12. Performa, pengujian, dan Definition of Done

### 12.1 Anggaran performa
Diukur pada **ponsel kelas menengah ke bawah dengan jaringan 4G lambat** (pengendalian laboratorium) **dan data lapangan** (RUM) setelah rilis.

| Metrik | Target (storefront) |
|---|---|
| **LCP** | **≤ 2,5 dtk** (persentil 75, ponsel) |
| **CLS** | **≤ 0,1** |
| **INP** | **≤ 200 ms** |
| Lighthouse (lab, ponsel) pada Beranda, Katalog, Detail | **≥ 90** performa dan **100** aksesibilitas **[Usulan, gerbang CI]** |
| JS awal per rute | **≤ 170 KB gzip [Usulan]**; di atas itu wajib dibenarkan |
| CSS awal | **≤ 50 KB gzip [Usulan]** |
| Gambar LCP | **≤ 100 KB**, `fetchpriority="high"`, tidak di-lazy-load |
| Konsol | Bundel dipecah per rute; editor/komponen berat dimuat malas; daftar panjang **divirtualisasi**; unggah tidak memblokir UI |

### 12.2 Teknik wajib
- **SSR/ISR** dengan revalidasi saat barang berubah; streaming bagian lambat; **cache CDN**.
- **Gambar**: CDN gambar, `srcset`/`sizes`, format modern (AVIF/WebP) + cadangan, **dimensi eksplisit**, warna dominan sebagai placeholder, lazy untuk yang di luar layar.
- **Video**: dimuat malas dengan poster; tidak diunduh sebelum diputar (`preload="none"`/`metadata`).
- **Font**: self-host, subset, preload ≤ 2, `size-adjust`.
- **Pemecahan kode** per rute; `prefetch` saat niat (hover/viewport) pada tautan penting; hindari pustaka besar untuk satu fungsi.
- **Service worker**: cache aset statis, halaman offline; **tidak** meng-cache data uang/pesanan.
- **Pihak ketiga**: minimal; dimuat tunda; **analitik tanpa data pribadi**.
- **Tidak ada pergeseran tata letak**: semua media/iklan/sponsor punya ruang tetap; skeleton berbentuk sama.

### 12.3 Matriks perangkat dan uji
| Uji | Cakupan |
|---|---|
| **Lebar** | 320, 360, 390, 412, 768, 1024, 1280, 1440, 1920 px |
| **Perangkat nyata** | Android kelas menengah ke bawah (Chrome), iPhone (Safari), tablet; satu perangkat dengan RAM kecil |
| **Peramban** | Chrome, Safari, Firefox, Edge, Samsung Internet (dua versi mayor terakhir) |
| **Jaringan** | Throttling 4G lambat dan offline |
| **Zoom/ukuran huruf** | 200% huruf, 400% zoom, orientasi lanskap |
| **Aksesibilitas** | axe di CI, keyboard saja, TalkBack, VoiceOver |
| **Visual** | Tangkapan layar otomatis per komponen dan halaman pada titik henti utama (regresi visual) |
| **E2E (Playwright)** | Alur: jelajah → detail → keranjang → **daftar OTP → lengkapi profil dan alamat → periksa pesananmu** → bayar (sandbox) → kuitansi → lacak → komplain; koordinator: **ajukan alamat toko** → tambah barang → SOP → unggah → ajukan; admin: **verifikasi alamat toko**, review → setujui; konflik (barang ditahan), hold habis, koneksi putus saat unggah |
| **Responsif** | Uji bahwa **tidak ada scroll horizontal** pada 320 px di semua halaman |

### 12.4 Definition of Done (frontend)
Sebuah halaman/komponen **selesai** hanya bila:
1. Sesuai spesifikasi halaman/komponen ini dan **desain UI/UX yang disetujui**, termasuk **semua kondisi** (memuat, kosong, galat, offline, sukses, konflik).
2. **Responsif sempurna** pada semua lebar di matriks (tanpa scroll horizontal, tanpa elemen terpotong atau bertumpuk, sasaran sentuh ≥ 44 px, area aman dipakai).
3. **Memenuhi token** (tidak ada hex/ukuran acak) dan **tidak melanggar Bagian 11**.
4. **Aksesibilitas**: axe bersih; keyboard penuh; kontras sesuai; uji pembaca layar pada alur utama.
5. **Performa**: lolos anggaran 12.1 di CI; tidak ada CLS.
6. **Uji otomatis**: komponen (Storybook + tangkapan visual), logika (unit), alur utama (e2e).
7. **Tidak ada data pribadi** di URL, log, analitik, atau penyimpanan lokal yang tidak perlu; **tidak ada rahasia** di kode klien.
8. Tipe dan klien API **dibangkitkan dari OpenAPI** (tanpa tipe tangan yang bisa menyimpang).
9. Dokumentasi: cerita Storybook, catatan keputusan, dan perubahan `packages/ui` diumumkan.

### 12.5 Urutan pengerjaan yang disarankan
| # | Langkah | Hasil |
|---|---|---|
| F1 | **Token + komponen dasar** + Storybook + pipeline uji (axe, visual, Lighthouse) | `packages/ui` siap |
| F2 | Storefront: **Katalog dan Detail** (data nyata/mocks dari OpenAPI) | Inti kepercayaan siap dinilai |
| F3 | Konsol: **Toko saya + alamat terverifikasi**, **Barang kamera-first + SOP + unggah** | Pasokan jalan |
| F4 | Storefront: **Daftar/masuk OTP, Lengkapi data, Keranjang, Periksa pesananmu, bayar, Kuitansi Kebaikan**, lacak, **Halaman Toko** | Alur beli penuh |
| F5 | Konsol: pesanan, komplain, dompet; Admin: antrean review | Operasional |
| F6 | Charity, Dampak, halaman statis, SEO | Kepercayaan publik |
| F7 | Pengerasan: performa, aksesibilitas manual, perangkat nyata, e2e | Gerbang rilis |

**Aturan:** F1 harus **selesai dan disetujui UI/UX** sebelum halaman dibangun; tidak ada halaman yang dibuat dengan gaya sementara yang nanti dibongkar.
