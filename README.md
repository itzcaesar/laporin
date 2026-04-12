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

© 2026 Laporin — Menghubungkan Warga, Membangun Kota.
