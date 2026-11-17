# 🎨 Panduan Penggunaan Toast (Sonner)

Toast sudah dikonfigurasi dengan styling profesional dan mendukung dark mode.

## Import

```tsx
import { toast } from "sonner";
```

## Contoh Penggunaan

### Success Toast

```tsx
toast.success("Berhasil!", {
  description: "Data berhasil disimpan ke database",
});
```

### Error Toast

```tsx
toast.error("Terjadi Kesalahan", {
  description: "Gagal menyimpan data. Silakan coba lagi.",
});
```

### Warning Toast

```tsx
toast.warning("Peringatan", {
  description: "Data yang Anda masukkan sudah ada di sistem",
});
```

### Info Toast

```tsx
toast.info("Informasi", {
  description: "Proses sinkronisasi data akan dimulai dalam 5 menit",
});
```

### Loading Toast

```tsx
const toastId = toast.loading("Sedang memproses...", {
  description: "Mohon tunggu sebentar",
});

// Update setelah selesai
toast.success("Selesai!", {
  id: toastId,
  description: "Proses berhasil diselesaikan",
});
```

### Toast dengan Action Button

```tsx
toast("Konfirmasi Diperlukan", {
  description: "Apakah Anda yakin ingin menghapus data ini?",
  action: {
    label: "Hapus",
    onClick: () => handleDelete(),
  },
  cancel: {
    label: "Batal",
  },
});
```

### Custom Duration

```tsx
toast.success("Berhasil!", {
  description: "Notifikasi ini akan otomatis hilang dalam 10 detik",
  duration: 10000, // 10 detik
});
```

### Promise Toast (Auto handle loading/success/error)

```tsx
toast.promise(
  fetch("/api/data").then((res) => res.json()),
  {
    loading: "Mengambil data...",
    success: (data) => `Berhasil! ${data.length} data berhasil dimuat`,
    error: "Gagal! Tidak dapat mengambil data dari server",
  },
);
```

## Fitur yang Sudah Dikonfigurasi

✅ **Auto Dark Mode Support** - Otomatis mengikuti theme sistem  
✅ **Rich Colors** - Warna yang sesuai untuk setiap tipe toast  
✅ **Close Button** - Tombol close di setiap toast  
✅ **Hover Animation** - Animasi smooth saat hover  
✅ **Custom Icons** - Icon profesional dari Lucide React  
✅ **Gradient Background** - Background gradient yang menarik  
✅ **Position Top-Right** - Posisi optimal untuk notifikasi

## Tips Penggunaan

1. **Selalu gunakan title dan description** untuk informasi yang lebih jelas
2. **Gunakan loading toast** untuk operasi yang membutuhkan waktu
3. **Berikan feedback yang jelas** pada setiap action user
4. **Jangan spam toast** - gunakan dengan bijak
5. **Gunakan promise toast** untuk operasi async yang otomatis

## Kustomisasi Position

Jika ingin mengubah posisi toast, edit di `src/components/ui/sonner.tsx`:

```tsx
<Sonner
  position="top-right" // top-left, top-center, bottom-right, etc
  // ...
/>
```
