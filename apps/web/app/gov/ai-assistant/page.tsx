// ── app/gov/ai-assistant/page.tsx ──
"use client";

import { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Clock,
  BarChart3,
  FileText,
  Zap,
  Brain,
  Send,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type QuickAction = {
  id: string;
  icon: typeof TrendingUp;
  label: string;
  description: string;
  prompt: string;
  color: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: any;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "urgent-reports",
    icon: AlertTriangle,
    label: "Laporan Darurat",
    description: "Analisis laporan dengan prioritas darurat",
    prompt: "Berikan ringkasan semua laporan darurat yang belum ditangani",
    color: "text-red-600 bg-red-50",
  },
  {
    id: "trending-issues",
    icon: TrendingUp,
    label: "Isu Trending",
    description: "Identifikasi masalah yang sedang meningkat",
    prompt: "Apa isu infrastruktur yang paling banyak dilaporkan minggu ini?",
    color: "text-orange-600 bg-orange-50",
  },
  {
    id: "area-hotspots",
    icon: MapPin,
    label: "Area Hotspot",
    description: "Lokasi dengan laporan terbanyak",
    prompt: "Tunjukkan area dengan konsentrasi laporan tertinggi",
    color: "text-blue-600 bg-blue-50",
  },
  {
    id: "sla-breach",
    icon: Clock,
    label: "SLA Breach",
    description: "Laporan yang melewati target waktu",
    prompt: "Berapa banyak laporan yang melewati SLA dan apa rekomendasinya?",
    color: "text-purple-600 bg-purple-50",
  },
  {
    id: "performance",
    icon: BarChart3,
    label: "Performa Tim",
    description: "Analisis kinerja petugas",
    prompt: "Bagaimana performa tim dalam menangani laporan bulan ini?",
    color: "text-teal-600 bg-teal-50",
  },
  {
    id: "budget-estimate",
    icon: FileText,
    label: "Estimasi Budget",
    description: "Proyeksi biaya perbaikan",
    prompt: "Berapa total estimasi budget untuk semua laporan aktif?",
    color: "text-green-600 bg-green-50",
  },
];

const MOCK_INSIGHTS = [
  {
    title: "Peningkatan Laporan Jalan Rusak",
    description: "Laporan jalan rusak meningkat 35% minggu ini, terutama di area Dago dan Sudirman.",
    type: "warning",
    icon: TrendingUp,
  },
  {
    title: "SLA Performance Baik",
    description: "92% laporan diselesaikan tepat waktu bulan ini, naik 5% dari bulan lalu.",
    type: "success",
    icon: Clock,
  },
  {
    title: "Area Prioritas: Kecamatan Sumur Bandung",
    description: "15 laporan aktif di area ini, 8 diantaranya prioritas tinggi.",
    type: "info",
    icon: MapPin,
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Halo! Saya adalah AI Assistant Laporin. Saya dapat membantu Anda menganalisis laporan, memberikan insight, dan rekomendasi untuk meningkatkan pelayanan. Apa yang ingin Anda ketahui?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickAction = async (action: QuickAction) => {
    await handleSendMessage(action.prompt);
  };

  const handleSendMessage = async (message?: string) => {
    const messageText = message || input;
    if (!messageText.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock response based on message
    let responseContent = "";
    let responseData = null;

    if (messageText.toLowerCase().includes("darurat")) {
      responseContent = `Saat ini terdapat **5 laporan darurat** yang memerlukan perhatian segera:

1. **Jalan Berlubang Besar** - Jl. Dago No. 123
   - Prioritas: Darurat
   - Bahaya: Tingkat 4/5
   - Estimasi: Rp 15-25 juta
   - Status: Belum ditugaskan

2. **Pohon Tumbang Menghalangi Jalan** - Jl. Sudirman
   - Prioritas: Darurat
   - Bahaya: Tingkat 5/5
   - Estimasi: Rp 5-8 juta
   - Status: Sedang diproses

3. **Lampu Jalan Mati Total** - Jl. Asia Afrika
   - Prioritas: Darurat
   - Bahaya: Tingkat 3/5
   - Estimasi: Rp 3-5 juta
   - Status: Belum ditugaskan

**Rekomendasi:**
- Prioritaskan pohon tumbang (risiko kecelakaan tinggi)
- Tugaskan tim untuk jalan berlubang dalam 24 jam
- Koordinasi dengan PLN untuk lampu jalan`;

      responseData = {
        type: "urgent-reports",
        count: 5,
        totalBudget: "Rp 23-38 juta",
      };
    } else if (messageText.toLowerCase().includes("trending") || messageText.toLowerCase().includes("isu")) {
      responseContent = `Berdasarkan analisis 7 hari terakhir, berikut isu yang sedang trending:

**Top 3 Kategori Laporan:**
1. 🛣 **Jalan Rusak** - 45 laporan (+35% dari minggu lalu)
2. 💡 **Lampu Jalan** - 28 laporan (+12%)
3. 🌳 **Pohon & Taman** - 18 laporan (-5%)

**Area Terdampak:**
- Kec. Sumur Bandung: 32 laporan
- Kec. Coblong: 24 laporan
- Kec. Bandung Wetan: 19 laporan

**Insight:**
Peningkatan signifikan laporan jalan rusak kemungkinan disebabkan oleh hujan deras minggu lalu. Rekomendasi untuk melakukan inspeksi preventif di area rawan.`;

      responseData = {
        type: "trending",
        topCategory: "Jalan Rusak",
        increase: "+35%",
      };
    } else if (messageText.toLowerCase().includes("area") || messageText.toLowerCase().includes("hotspot")) {
      responseContent = `**Area Hotspot Laporan (30 Hari Terakhir):**

📍 **Kecamatan Sumur Bandung** - 67 laporan
   - Jalan Rusak: 32 laporan
   - Lampu Jalan: 18 laporan
   - Drainase: 17 laporan
   - Rata-rata waktu penyelesaian: 8 hari

📍 **Kecamatan Coblong** - 54 laporan
   - Jalan Rusak: 28 laporan
   - Pohon & Taman: 15 laporan
   - Lampu Jalan: 11 laporan
   - Rata-rata waktu penyelesaian: 6 hari

📍 **Kecamatan Bandung Wetan** - 48 laporan
   - Drainase: 22 laporan
   - Jalan Rusak: 16 laporan
   - Lampu Jalan: 10 laporan
   - Rata-rata waktu penyelesaian: 7 hari

**Rekomendasi:**
Alokasikan lebih banyak sumber daya ke Kec. Sumur Bandung untuk meningkatkan response time.`;

      responseData = {
        type: "hotspots",
        topArea: "Kec. Sumur Bandung",
        reportCount: 67,
      };
    } else if (messageText.toLowerCase().includes("sla")) {
      responseContent = `**Analisis SLA Performance:**

📊 **Status SLA Bulan Ini:**
- ✅ Tepat Waktu: 92 laporan (92%)
- ⚠️ Mendekati Deadline: 5 laporan (5%)
- ❌ Melewati SLA: 3 laporan (3%)

**Laporan yang Melewati SLA:**
1. LP-2026-BDG-00089 - Jalan Rusak (terlambat 3 hari)
2. LP-2026-BDG-00102 - Drainase Tersumbat (terlambat 2 hari)
3. LP-2026-BDG-00115 - Lampu Jalan (terlambat 1 hari)

**Rekomendasi:**
- Prioritaskan 3 laporan yang terlambat untuk segera diselesaikan
- Review proses untuk mencegah keterlambatan di masa depan
- Pertimbangkan menambah tim untuk kategori jalan rusak`;

      responseData = {
        type: "sla",
        onTime: 92,
        breached: 3,
      };
    } else if (messageText.toLowerCase().includes("performa") || messageText.toLowerCase().includes("tim")) {
      responseContent = `**Performa Tim Bulan Ini:**

👥 **Top Performers:**
1. **Budi Santosa** (NIP: 198512341234567890)
   - Laporan diselesaikan: 28
   - Rata-rata waktu: 5.2 hari
   - Rating kepuasan: 4.8/5.0

2. **Agus Permana** (NIP: 199012341234567890)
   - Laporan diselesaikan: 24
   - Rata-rata waktu: 6.1 hari
   - Rating kepuasan: 4.6/5.0

3. **Dewi Lestari** (NIP: 198803121234567890)
   - Laporan diselesaikan: 22
   - Rata-rata waktu: 5.8 hari
   - Rating kepuasan: 4.7/5.0

📈 **Metrik Tim:**
- Total laporan diselesaikan: 100
- Rata-rata waktu penyelesaian: 6.5 hari
- Tingkat kepuasan warga: 4.5/5.0
- Improvement dari bulan lalu: +8%`;

      responseData = {
        type: "performance",
        topPerformer: "Budi Santosa",
        avgTime: "6.5 hari",
      };
    } else if (messageText.toLowerCase().includes("budget") || messageText.toLowerCase().includes("biaya")) {
      responseContent = `**Estimasi Budget Laporan Aktif:**

💰 **Total Estimasi:** Rp 450 - 720 juta

**Breakdown per Kategori:**
1. 🛣 Jalan Rusak: Rp 280-450 juta (45 laporan)
2. 🌊 Drainase: Rp 95-150 juta (22 laporan)
3. 💡 Lampu Jalan: Rp 45-70 juta (28 laporan)
4. 🌳 Pohon & Taman: Rp 30-50 juta (18 laporan)

**Prioritas Budget:**
- Darurat: Rp 85-120 juta (15 laporan)
- Tinggi: Rp 180-280 juta (38 laporan)
- Sedang: Rp 120-200 juta (42 laporan)
- Rendah: Rp 65-120 juta (18 laporan)

**Rekomendasi:**
Alokasikan budget prioritas untuk 15 laporan darurat terlebih dahulu (Rp 85-120 juta).`;

      responseData = {
        type: "budget",
        total: "Rp 450-720 juta",
        urgent: "Rp 85-120 juta",
      };
    } else {
      responseContent = `Saya dapat membantu Anda dengan:

- 📊 Analisis laporan dan statistik
- 🚨 Identifikasi laporan darurat
- 📍 Pemetaan area hotspot
- ⏱️ Monitoring SLA dan deadline
- 👥 Evaluasi performa tim
- 💰 Estimasi budget dan biaya
- 📈 Trend dan prediksi

Silakan pilih salah satu quick action di atas atau tanyakan apa yang Anda butuhkan!`;
    }

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
      data: responseData,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className="dashboard-page h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue to-purple rounded-xl">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-navy">
              AI Assistant
            </h1>
            <p className="text-sm text-muted">
              Asisten cerdas untuk analisis dan insight laporan
            </p>
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {MOCK_INSIGHTS.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              className={cn(
                "rounded-xl p-4 border",
                insight.type === "warning" && "bg-orange-50 border-orange-200",
                insight.type === "success" && "bg-green-50 border-green-200",
                insight.type === "info" && "bg-blue-50 border-blue-200"
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    insight.type === "warning" && "bg-orange-100",
                    insight.type === "success" && "bg-green-100",
                    insight.type === "info" && "bg-blue-100"
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      insight.type === "warning" && "text-orange-600",
                      insight.type === "success" && "text-green-600",
                      insight.type === "info" && "text-blue-600"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-navy mb-1">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-navy mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-white hover:shadow-md transition-all text-center",
                  "hover:border-blue"
                )}
              >
                <div className={cn("p-2 rounded-lg", action.color)}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">
                    {action.label}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 rounded-2xl bg-white border border-border overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue to-purple">
                  <Sparkles size={16} className="text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-navy text-white"
                    : "bg-surface text-ink"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.data && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Zap size={12} />
                      <span>Data insight tersedia</span>
                    </div>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-light text-blue font-semibold text-sm">
                  A
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue to-purple">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Menganalisis...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-4 bg-surface"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu tentang laporan..."
              className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
