// ── app/gov/ai-assistant/page.tsx ──
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, TrendingUp, AlertTriangle, MapPin, Clock,
  BarChart3, FileText, Brain, Send, Loader2,
  Copy, Check, RefreshCw, ChevronRight,
  MessageSquare, Shield, Activity, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { useGovAnalytics } from "@/hooks/useGovAnalytics";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type QuickPrompt = {
  id: string;
  icon: React.ElementType;
  label: string;
  prompt: string;
  iconBg: string;
  iconColor: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "urgent",
    icon: AlertTriangle,
    label: "Laporan Darurat",
    prompt: "Tampilkan grafik bar jumlah laporan berdasarkan status dan berikan ringkasan laporan darurat yang belum ditangani.",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    id: "hotspot",
    icon: MapPin,
    label: "Area Hotspot",
    prompt: "Buat grafik bar area hotspot dengan laporan terbanyak dan analisis penyebabnya.",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "categories",
    icon: BarChart3,
    label: "Tren Kategori",
    prompt: "Buat grafik pie distribusi laporan berdasarkan kategori dalam 30 hari terakhir.",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: "sla",
    icon: Clock,
    label: "SLA Breach",
    prompt: "Analisis laporan yang melewati SLA, berikan rekomendasi prioritas penanganan.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    id: "status",
    icon: Activity,
    label: "Status Overview",
    prompt: "Tampilkan grafik pie breakdown status semua laporan saat ini.",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    id: "budget",
    icon: FileText,
    label: "Estimasi Budget",
    prompt: "Berikan estimasi total anggaran perbaikan untuk semua laporan aktif beserta rekomendasi prioritas alokasi.",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
];

const CHART_COLORS = ["#2563EB", "#0F766E", "#F59E0B", "#DC2626", "#7C3AED", "#059669", "#0284C7"];

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all",
        "bg-surface hover:bg-gray-100 text-muted hover:text-ink border border-border",
        copied && "bg-green-50 border-green-200 text-green-700",
        className
      )}
      title="Salin"
    >
      {copied ? <><Check size={12} />Disalin</> : <><Copy size={12} />Salin</>}
    </button>
  );
}

// ─── ChartRenderer ────────────────────────────────────────────────────────────

function ChartRenderer({ raw }: { raw: string }) {
  let config: any = null;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) config = JSON.parse(jsonMatch[0]);
  } catch {
    return (
      <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
        ⚠️ Format grafik tidak valid.
      </div>
    );
  }

  if (!config?.type || !Array.isArray(config?.data)) return null;

  const tooltipStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    fontSize: "12px",
    color: "#111827",
  };

  const axisStyle = { fontSize: 11, fill: "#6B7280" };

  const renderChart = () => {
    switch (config.type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={config.data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#F9FAFB" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {config.data.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: "11px", color: "#6B7280" }} />
              <Pie data={config.data} cx="50%" cy="45%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value">
                {config.data.map((_: any, i: number) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={config.data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="text-xs text-muted p-3 text-center">Tipe grafik "{config.type}" tidak didukung.</div>;
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-border bg-white shadow-sm">
      {config.title && (
        <div className="px-5 pt-4 pb-1">
          <p className="text-sm font-semibold text-navy">{config.title}</p>
        </div>
      )}
      <div className="px-3 pb-3 pt-2">{renderChart()}</div>
    </div>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  const renderAssistantContent = (content: string) => {
    // Match any fenced code block: ```chart, ```json, or plain ```
    const parts = content.split(/(```(?:chart|json)?\s*\{[\s\S]*?\}[\s\S]*?```)/g);
    return parts.map((part, i) => {
      // Check if this part is a fenced block containing chart-like JSON
      const fenceMatch = part.match(/^```(?:chart|json)?\s*([\s\S]*?)```$/);
      if (fenceMatch) {
        const inner = fenceMatch[1].trim();
        // Try to detect chart JSON (has "type" and "data" keys)
        try {
          const jsonMatch = inner.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.type && Array.isArray(parsed.data)) {
              return <ChartRenderer key={i} raw={jsonMatch[0]} />;
            }
          }
        } catch {
          // Not valid chart JSON, fall through to markdown
        }
      }
      if (!part.trim()) return null;
      return (
        <ReactMarkdown
          key={i}
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ ...props }) => <p className="mb-3 last:mb-0 text-ink leading-relaxed text-sm" {...props} />,
            ul: ({ ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1.5 text-ink text-sm" {...props} />,
            ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5 text-ink text-sm" {...props} />,
            li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
            strong: ({ ...props }) => <strong className="font-semibold text-navy" {...props} />,
            em: ({ ...props }) => <em className="italic text-muted" {...props} />,
            h1: ({ ...props }) => <h1 className="text-base font-bold mb-3 mt-4 text-navy border-b border-border pb-2" {...props} />,
            h2: ({ ...props }) => <h2 className="text-sm font-bold mb-2 mt-3 text-navy" {...props} />,
            h3: ({ ...props }) => <h3 className="text-sm font-semibold mb-2 mt-3 text-ink" {...props} />,
            blockquote: ({ ...props }) => (
              <blockquote className="border-l-4 border-blue bg-blue-light/30 pl-4 py-2 pr-3 rounded-r-xl my-3 text-muted italic text-sm" {...props} />
            ),
            table: ({ ...props }) => (
              <div className="overflow-x-auto my-4 rounded-xl border border-border">
                <table className="w-full text-sm" {...props} />
              </div>
            ),
            thead: ({ ...props }) => <thead className="bg-surface text-muted font-semibold border-b border-border" {...props} />,
            th: ({ ...props }) => <th className="px-4 py-2.5 text-left text-xs uppercase tracking-wide" {...props} />,
            td: ({ ...props }) => <td className="px-4 py-2.5 text-ink border-t border-border/50" {...props} />,
            code: ({ className, children, ...props }: any) => {
              const text = String(children).replace(/\n$/, "");
              
              // Auto-detect chart JSON in ANY code block
              try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  if (parsed.type && Array.isArray(parsed.data)) {
                    return <ChartRenderer raw={jsonMatch[0]} />;
                  }
                }
              } catch {
                // Not chart JSON, render as normal code
              }

              const langMatch = /language-(\w+)/.exec(className || "");
              return langMatch ? (
                <div className="relative group/code my-3">
                  <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                    <CopyButton text={text} />
                  </div>
                  <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 overflow-x-auto text-xs font-mono">
                    <code {...props}>{children}</code>
                  </pre>
                </div>
              ) : (
                <code className="bg-blue-light text-navy rounded px-1.5 py-0.5 text-[13px] font-mono" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 group">
        <div className="max-w-[75%] bg-navy text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-light border border-blue/20 flex items-center justify-center text-blue text-xs font-bold">
          A
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue to-navy flex items-center justify-center shadow-sm">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="max-w-[88%] relative">
        <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          {renderAssistantContent(message.content)}
        </div>
        <div className="flex items-center gap-2 mt-1.5 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-muted">
            {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <CopyButton text={message.content} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Selamat datang! Saya **AI Assistant Laporin**, siap membantu Anda menganalisis data laporan infrastruktur secara real-time.\n\nSaya dapat:\n- 📊 **Membuat grafik** visualisasi data laporan\n- 🔍 **Menganalisis tren** dan pola laporan\n- ⚡ **Memberikan rekomendasi** berbasis data aktual\n- 💰 **Estimasi anggaran** penanganan laporan\n\nPilih analisis cepat di bawah atau ketik pertanyaan Anda.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: analyticsData } = useGovAnalytics("30");

  const stats = [
    {
      label: "Total Laporan",
      value: analyticsData?.overview?.totalReports ?? "—",
      icon: MessageSquare,
      iconBg: "bg-blue-50",
      iconColor: "text-blue",
    },
    {
      label: "Diselesaikan",
      value: analyticsData?.overview?.completedReports ?? "—",
      icon: Check,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "SLA Compliance",
      value: analyticsData?.overview?.slaCompliancePercent != null
        ? `${analyticsData.overview.slaCompliancePercent}%`
        : "—",
      icon: Activity,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    const messageText = text.trim();
    if (!messageText || isLoading) return;

    setMessages((prev) => [...prev, {
      id: `user-${Date.now()}`, role: "user", content: messageText, timestamp: new Date(),
    }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await api.post<{ success: true; data: { message: string } }>("/gov/ai/chatbot", {
        message: messageText,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((prev) => [...prev, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.data?.message || "Maaf, saya tidak dapat memproses permintaan Anda.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Gagal terhubung ke AI. Silakan coba lagi.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="dashboard-page h-[calc(100vh-4rem)] flex gap-5">

      {/* ── Left Sidebar ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">

        {/* Header Card */}
        <div className="rounded-2xl bg-gradient-to-br from-navy to-blue p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Brain size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-tight">AI Assistant</h1>
              <p className="text-white/60 text-[10px]">Powered by Laporin AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/70 text-[10px]">Online · Data real-time</span>
          </div>
        </div>

        {/* Live Stats */}
        <div className="rounded-2xl bg-white border border-border p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">Statistik Live</p>
          <div className="space-y-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", s.iconBg)}>
                    <Icon size={14} className={s.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted leading-none mb-0.5">{s.label}</p>
                    <p className="text-sm font-bold text-navy">{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="rounded-2xl bg-white border border-border p-4 shadow-sm flex-1">
          <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">Analisis Cepat</p>
          <div className="space-y-1">
            {QUICK_PROMPTS.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.id}
                  onClick={() => sendMessage(q.prompt)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-all hover:bg-surface active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", q.iconBg)}>
                    <Icon size={13} className={q.iconColor} />
                  </div>
                  <span className="text-xs text-ink group-hover:text-navy transition-colors font-medium leading-tight flex-1">
                    {q.label}
                  </span>
                  <ChevronRight size={12} className="text-muted/40 group-hover:text-muted transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Guard badge */}
        <div className="rounded-xl bg-surface border border-border p-3 flex items-start gap-2">
          <Shield size={12} className="text-muted mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-muted leading-relaxed">
            AI ini dibatasi hanya untuk konteks laporan infrastruktur Laporin.
          </p>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0 rounded-2xl bg-white border border-border shadow-sm overflow-hidden">

        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-navy">Sesi Chat</span>
            <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
              {messages.length - 1} pesan
            </span>
          </div>
          <button
            onClick={() => setMessages([messages[0]])}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors px-2.5 py-1.5 rounded-lg hover:bg-surface border border-transparent hover:border-border"
          >
            <RefreshCw size={12} />
            Reset Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-surface/40">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue to-navy flex items-center justify-center shadow-sm">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 rounded-full bg-blue animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 rounded-full bg-blue animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-muted">AI sedang menganalisis data...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-border p-4 bg-white">
          <div className="flex items-end gap-3 bg-surface border border-border rounded-xl px-4 py-3 focus-within:border-blue focus-within:bg-white focus-within:ring-2 focus-within:ring-blue/10 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan tentang laporan, minta grafik, atau analisis data... (Enter untuk kirim)"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted outline-none resize-none leading-relaxed disabled:opacity-50 max-h-[120px]"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-muted hidden sm:block">⏎ kirim</span>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                  input.trim() && !isLoading
                    ? "bg-navy hover:bg-navy/90 shadow-sm text-white"
                    : "bg-gray-100 text-muted cursor-not-allowed"
                )}
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted text-center mt-2">
            AI dapat membuat kesalahan. Verifikasi data penting secara mandiri.
          </p>
        </div>
      </div>
    </div>
  );
}
