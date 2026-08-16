# Version Control Implementation

## 📌 Overview

Aplikasi ini menggunakan **dual version control** untuk tracking versi Frontend dan Backend secara terpisah.

## 🎯 Frontend Version

- **Lokasi**: `package.json` → `version` field
- **Saat ini**: v2.0.0
- **Update**: Manual saat release (semantic versioning)
- **Format**: `MAJOR.MINOR.PATCH`

## 🔌 Backend Version (API Endpoint Required)

### Endpoint yang Dibutuhkan:

```
GET /api/v1/version
```

### Response Format:

```json
{
  "success": true,
  "version": "1.0.0",
  "data": {
    "version": "1.0.0",
    "build_date": "2026-02-21T00:00:00Z",
    "environment": "production"
  }
}
```

**Atau format sederhana:**

```json
{
  "version": "1.0.0"
}
```

### Implementasi Backend:

Backend harus menyediakan endpoint ini untuk menampilkan versi API/Backend.

**Contoh Response Handler:**

```javascript
// Node.js/Express Example
app.get("/api/v1/version", (req, res) => {
  res.json({
    success: true,
    version: process.env.API_VERSION || "1.0.0",
    data: {
      version: process.env.API_VERSION || "1.0.0",
      build_date: process.env.BUILD_DATE || new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
  });
});
```

## 📍 Tempat Tampilan Version

### 1. **Login Page**

- **Lokasi**: Di dalam form card (detailed) + Footer (compact)
- **Variant**: Detailed + Compact
- **Menampilkan**: Frontend version + Backend version (jika tersedia)

### 2. **Sidebar (Setelah Login)**

- **Lokasi**: Bagian bawah sidebar, sebelum tombol Logout
- **Variant**: Detailed
- **Menampilkan**: Frontend version + Backend version (jika tersedia)
- **Support**: Desktop & Mobile

## 🎨 Component Usage

### Import:

```typescript
import { VersionDisplay } from "@/components/features/VersionDisplay";
```

### Detailed Variant (untuk sidebar/card):

```tsx
<VersionDisplay variant="detailed" showBackend={true} />
```

Output:

```
Frontend: v2.0.0
Backend:  v1.0.0
```

### Compact Variant (untuk footer/badge):

```tsx
<VersionDisplay variant="compact" showBackend={true} />
```

Output:

```
v2.0.0 | BE v1.0.0
```

## 🔧 Service API

### versionService.ts

Menyediakan 3 fungsi:

1. **getFrontendVersion()**: Static, dari package.json
2. **getBackendVersion()**: Async, dari API endpoint
3. **getVersionInfo()**: Kombinasi keduanya

```typescript
import { getVersionInfo } from "@/services/versionService";

const versionInfo = await getVersionInfo();
// {
//   frontend: "2.0.0",
//   backend: "1.0.0",
//   buildDate: "2026-02-21T..."
// }
```

## 📦 Update Version

### Frontend:

Edit `package.json`:

```json
{
  "version": "2.1.0"
}
```

Lalu update hardcoded version di `versionService.ts` (line 10):

```typescript
export const getFrontendVersion = (): string => {
  return "2.1.0"; // Update ini
};
```

### Backend:

Update environment variable `API_VERSION` atau konfigurasi backend Anda.

## 🚀 Best Practice

1. **Semantic Versioning**: Use MAJOR.MINOR.PATCH format
2. **Sync Updates**: Update version number saat deployment
3. **Monitoring**: Check version mismatch untuk debugging
4. **Documentation**: Update CHANGELOG.md setiap release

## ⚠️ Catatan

- Jika backend endpoint `/api/v1/version` tidak tersedia, tampilan tetap berfungsi (hanya menampilkan frontend version)
- Service akan handle error dengan gracefully (tidak akan crash)
- Version backend akan menampilkan "Not available" jika endpoint gagal

## 📋 Checklist Backend Developer

- [ ] Buat endpoint `GET /api/v1/version`
- [ ] Return format JSON dengan field `version`
- [ ] Setup environment variable untuk version tracking
- [ ] Test endpoint dapat diakses
- [ ] Update version number saat deployment
