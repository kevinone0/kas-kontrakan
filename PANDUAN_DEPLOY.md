# 🌐 Panduan Deploy — Kas Kontrakan Online
## Google Sheets + Apps Script + Netlify

---

## Gambaran Arsitektur

```
[Browser / HP] ──► [Netlify] ──► index.html (UI)
                        │
                        ▼
              [Google Apps Script] ──► [Google Sheets]
              (API gratis, no server)    (database)
```

Semua **GRATIS**. Tidak perlu VPS, tidak perlu bayar hosting.

---

## BAGIAN 1 — Setup Google Sheets

### 1.1 Buat Spreadsheet baru
1. Buka https://sheets.google.com
2. Klik **"+ Blank"**
3. Rename jadi **"Kas Kontrakan DB"**
4. Salin **Spreadsheet ID** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[INI_SPREADSHEET_ID]/edit
   ```
   Simpan ID ini, nanti dipakai di Code.gs

### 1.2 Buat 3 sheet tab
Buat tab dengan nama persis:
- `Transaksi`
- `Penghuni`
- `Pengaturan`

(Klik tanda `+` di bawah untuk tambah tab)

---

## BAGIAN 2 — Deploy Google Apps Script

### 2.1 Buka Apps Script
1. Di Google Sheets, klik menu **Extensions → Apps Script**
2. Hapus semua kode default yang ada
3. Copy-paste seluruh isi file `Code.gs` ke editor

### 2.2 Isi konfigurasi di Code.gs
Ganti 2 baris ini:
```javascript
const SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_KAMU';
const SECRET_KEY = 'GANTI_PASSWORD_RAHASIA';
```

Contoh:
```javascript
const SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
const SECRET_KEY = 'kontrakan2024aman';
```

> ⚠️ SECRET_KEY adalah "password" API kamu. Gunakan kombinasi huruf+angka yang tidak mudah ditebak. Bagikan hanya ke penghuni yang dipercaya.

### 2.3 Simpan dan Deploy
1. Klik ikon 💾 **Save** (atau Ctrl+S)
2. Klik tombol **"Deploy"** → **"New deployment"**
3. Klik ikon ⚙️ di sebelah "Select type" → pilih **"Web app"**
4. Isi form:
   - Description: `Kas Kontrakan API v1`
   - Execute as: **Me** (akun Google kamu)
   - Who has access: **Anyone**
5. Klik **"Deploy"**
6. Klik **"Authorize access"** → pilih akun Google kamu → Allow
7. **Salin Web App URL** yang muncul:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   Simpan URL ini!

> ⚠️ Setiap kali edit Code.gs, kamu harus **"New deployment"** lagi (bukan "Manage deployments"). URL akan berubah tiap deploy baru.

---

## BAGIAN 3 — Deploy Web App ke Netlify

### 3.1 Push ke GitHub dulu

```bash
# Di folder kas-kontrakan/
git init
git add .
git commit -m "first commit: kas kontrakan online"

# Buat repo baru di github.com dulu, lalu:
git remote add origin https://github.com/USERNAME/kas-kontrakan.git
git push -u origin main
```

### 3.2 Deploy ke Netlify
1. Buka https://netlify.com → Login dengan GitHub
2. Klik **"Add new site"** → **"Import an existing project"**
3. Pilih **GitHub** → authorize → pilih repo `kas-kontrakan`
4. Isi pengaturan build:
   - Branch: `main`
   - Build command: *(kosongkan)*
   - Publish directory: `src`
5. Klik **"Deploy site"**
6. Tunggu ~1 menit → site live di URL seperti:
   ```
   https://kas-kontrakan-abc123.netlify.app
   ```

### 3.3 Custom domain (opsional, gratis)
Di Netlify → Site settings → Domain management:
- Bisa ganti jadi `kas-kontrakan.netlify.app` (gratis)
- Atau pakai domain sendiri jika punya

---

## BAGIAN 4 — Konfigurasi Aplikasi

### 4.1 Buka web app di browser
Akses URL Netlify kamu, misalnya:
`https://kas-kontrakan.netlify.app`

### 4.2 Masuk ke Pengaturan
1. Klik menu **Pengaturan** di sidebar
2. Di bagian **"Konfigurasi Google Sheets API"**, isi:
   - **Apps Script URL**: paste URL dari langkah 2.3
   - **Secret Key**: password yang kamu set di Code.gs
3. Klik **"Simpan & Test Koneksi"**
4. Kalau muncul **"✓ Koneksi berhasil"** → selesai!

### 4.3 Upload data historis
Karena data sebelumnya ada di localStorage:
1. Di Pengaturan → klik **"↑ Upload Semua"**
2. Konfirmasi → semua data dikirim ke Google Sheets
3. Sekarang semua penghuni yang akses URL yang sama akan lihat data yang sama

---

## BAGIAN 5 — Berbagi ke Penghuni

Bagikan 2 hal ke penghuni kontrakan:
1. **URL web app** → `https://kas-kontrakan.netlify.app`
2. **Secret Key** → password API

Mereka tinggal buka URL di browser HP, masuk Pengaturan, isi URL + key, test koneksi. Selesai.

> 💡 Tip: Tambahkan ke Home Screen HP mereka (browser → Share → Add to Home Screen) supaya terasa seperti app.

---

## Cara Kerja Sinkronisasi

```
Input data baru
      │
      ▼
Simpan ke localStorage (instan, offline)
      │
      ▼
Kirim ke Apps Script API (background)
      │
      ▼
Apps Script tulis ke Google Sheets
      │
      ▼
Penghuni lain klik "⟳ Sync" → dapat data terbaru
```

- Data **selalu tersimpan lokal** dulu (tidak hilang kalau internet mati)
- Sinkronisasi ke Sheets terjadi **otomatis di background**
- Penghuni lain perlu klik **"⟳ Sync"** untuk refresh data terbaru

---

## Update Aplikasi

Setiap kali edit `index.html`:
```bash
git add src/index.html
git commit -m "update: tambah fitur X"
git push
```
Netlify otomatis redeploy dalam ~1 menit.

---

## Troubleshooting

### "Unauthorized" saat test koneksi
- Cek SECRET_KEY di Code.gs sudah sama persis dengan yang diisi di app
- Pastikan sudah deploy ulang setelah edit Code.gs

### Data tidak muncul setelah Sync
- Cek apakah tab sheet namanya persis: `Transaksi`, `Penghuni`, `Pengaturan`
- Buka Apps Script → Execution log untuk lihat error

### CORS error di browser
- Pastikan `Who has access` di deployment Apps Script adalah **"Anyone"**
- Coba deploy ulang dengan "New deployment"

### Netlify build gagal
- Pastikan `Publish directory` diisi `src` (bukan `/src` atau `.`)
- Cek file `src/index.html` ada di repo

### Apps Script "Authorization required" terus
- Di Apps Script, jalankan fungsi `doGet` manual sekali dari editor
- Klik Review Permissions → Allow

---

## Keamanan

| Aspek | Status |
|---|---|
| HTTPS | ✅ Otomatis (Netlify + Google) |
| Auth sederhana | ✅ SECRET_KEY di setiap request |
| Data enkripsi | ⚠️ Tidak (Google Sheets bisa dibaca owner) |
| Rate limit | ⚠️ Apps Script: 20.000 req/hari (lebih dari cukup) |

> Untuk kontrakan kecil (7 penghuni), limit Apps Script tidak akan tersentuh.

---

## Ringkasan Biaya

| Layanan | Biaya |
|---|---|
| Netlify (hosting) | **Gratis** (100GB bandwidth/bulan) |
| Google Apps Script | **Gratis** (20.000 req/hari) |
| Google Sheets | **Gratis** (15GB storage Google Drive) |
| **Total** | **Rp 0/bulan** |

---

*Kas Kontrakan v2.0 — Google Sheets Edition*
