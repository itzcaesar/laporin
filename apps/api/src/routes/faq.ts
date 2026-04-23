import { Hono } from 'hono'
import { ok } from '../lib/response.js'

const faq = new Hono()

const MOCK_FAQS = [
  {
    id: "1",
    question: "Bagaimana cara membuat laporan yang baik?",
    answer: "Untuk membuat laporan yang baik, pastikan Anda menyertakan foto yang jelas, deskripsi yang detail, dan lokasi yang akurat menggunakan fitur pin peta.",
    category: "Umum",
    isPublished: true,
    views: 1250,
    helpful: 856,
    updatedAt: "2026-04-15T10:00:00Z",
  },
  {
    id: "2",
    question: "Berapa lama laporan saya akan diproses?",
    answer: "Waktu pemrosesan bergantung pada prioritas: Darurat (2 hari), Tinggi (7 hari), Sedang (14 hari), dan Rendah (30 hari).",
    category: "Proses Laporan",
    isPublished: true,
    views: 980,
    helpful: 645,
    updatedAt: "2026-04-10T08:30:00Z",
  },
  {
    id: "3",
    question: "Apakah identitas saya aman?",
    answer: "Ya, Anda dapat memilih opsi 'Lapor Anonim' saat membuat laporan. Identitas Anda tidak akan ditampilkan ke publik maupun petugas lapangan.",
    category: "Privasi",
    isPublished: true,
    views: 2100,
    helpful: 1890,
    updatedAt: "2026-04-05T14:20:00Z",
  },
];

faq.get('/', (c) => {
  return ok(c, MOCK_FAQS)
})

export default faq
