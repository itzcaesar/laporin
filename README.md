# Laporin 🏛️

**Laporin** adalah platform pelaporan infrastruktur publik (civic technology) yang menghubungkan warga dengan pemerintah daerah. Melalui Laporin, warga dapat melaporkan jalan rusak, jembatan ambles, lampu jalan mati, hingga fasilitas umum yang terbengkalai. Pemerintah dapat memantau perbaikan dan memverifikasi hasilnya secara transparan dan akuntabel.

---

## Fitur Utama 🚀

- **Pelaporan Mudah & Cepat**: Laporkan kerusakan infrastruktur hanya dalam hitungan detik dengan dukungan foto dan lokasi GPS.
- **Peta Interaktif (Geospasial)**: Semua laporan divisualisasikan dalam peta sebaran sehingga warga dan pemerintah tahu persis lokasi kerusakan.
- **Transparansi & Pelacakan Status**: Pantau laporan dari siklus "Baru" → "Diverifikasi" → "Diproses" → "Selesai" → "Terverifikasi".
- **Responsive & PWA Ready**: Dioptimasi penuh untuk perangkat seluler. Pengguna dapat meng-install aplikasi (Add to Home Screen) sebagai Progressive Web App.
- **Klasifikasi AI (Simulasi)**: Prioritas laporan secara cerdas untuk memilah mana yang membutuhkan perhatian segera berdasarkan tingkat bahaya infrastruktur.

---

## Tech Stack 🛠️

Project ini dibangun dengan menggunakan arsitektur modern web ecosystem:
- **Framework:** Next.js 16 (App Router)
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS v3
- **Komponen UI:** Kombinasi kustom Vanilla CSS, CSS Modules & class-variance-authority (`cva`)
- **Peta (Geopatial):** React Leaflet (OpenStreetMap)
- **Ikonografi:** Lucide React
- **Tools:** ESLint, Prettier, PostCSS

---

## Panduan Instalasi Lokal 💻

Ikuti langkah-langkah berikut untuk menjalankan Laporin di environment lokal Anda:

### Persyaratan
- Node.js (versi 18.17 atau lebih baru)
- npm / yarn / pnpm

### Langkah Instalasi

1. **Clone repository ini**
   ```bash
   git clone https://github.com/itzcaesar/laporin.git
   cd laporin
   ```

2. **Install dependensi**
   ```bash
   npm install
   # Atau jika menggunakan yarn: yarn install
   ```

3. **Jalankan Development Server**
   ```bash
   npm run dev
   ```

4. **Akses Aplikasi**
   Buka browser komputer atau perangkat seluler Anda dan akses `http://localhost:3000`.

---

## Lingkungan & Variabel (Environment Variables) 🔑

Saat ini, aplikasi berjalan 100% secara statis menggunakan basis data _mock_ pada `data/mock-reports.ts`.
Belum diperlukan konfigurasi berkas `.env.local` khusus. Namun, jika infrastruktur Backend mulai dihubungkan, format Environment Variables akan seperti ini:

```env
NEXT_PUBLIC_MAP_API_KEY=your_map_api_key
NEXT_PUBLIC_DATABASE_URL=your_backend_url
```

---

## Panduan Build & Deploy ke Vercel ☁️

Aplikasi ini didesain sepenuhnya **Vercel-ready**. Struktur App Router dioptimalkan untuk _edge architecture_.

1. Upload/Push repository Anda ke akun GitHub (seperti yang ada pada https://github.com/itzcaesar/laporin).
2. Login ke dashboard [Vercel](https://vercel.com/) dan buat project baru (**"Add New..."** > **"Project"**).
3. Import repository GitHub `itzcaesar/laporin`.
4. Pada menu **Framework Preset**, Vercel akan otomatis mendeteksi **Next.js**. Biarkan pengaturan dasar _(Build Command: `next build`, Install Command: `npm install`)_ tanpa diubah.
5. Tekan **Deploy** dan tunggu proses selesai. 

> _Vercel akan otomatis men-generate URL staging (misalnya laporin.vercel.app)._

---

## Menghubungkan Custom Domain (laporin.site) 🌐

Panduan bagi Anda yang ingin menggunakan DNS dari provider di luar Vercel untuk domain **laporin.site**.

1. Buka project Anda di dashboard Vercel, lalu navigasi ke menu **Settings** > **Domains**.
2. Masukkan domain Anda: `laporin.site` dan klik **Add**.
3. Vercel akan meminta verifikasi DNS record. 
4. Buka dasbor platform penyedia domain Anda (contoh: Niagahoster, Hostinger, Cloudflare).
5. Pada pengaturan **DNS Management**, tambahkan **A Record** dan **CNAME** sebagaimana disyaratkan Vercel:
   - **Type:** A Record
   - **Name:** `@` (atau dikosongkan, yang berarti apex/root domain `laporin.site`)
   - **Value / IPv4 Address:** `76.76.21.21` (IP Server Vercel)
   
   Dan untuk _subdomain_ (misalnya `www`):
   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com.`
6. Propagasi DNS biasanya memakan waktu antara beberapa menit hingga maksimal 24 jam. Setelah propagasi selesai, Vercel akan otomatis menerbitkan **Sertifikat SSL (HTTPS)**.

---
© 2026 Laporin — Menghubungkan Warga, Membangun Kota.
