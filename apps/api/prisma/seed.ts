// ── apps/api/prisma/seed.ts ──
// Database seeding script for Laporin
// Run with: pnpm --filter @laporin/api db:seed

import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import { PrismaClient, Priority } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// All 23 infrastructure categories for Indonesia
const CATEGORIES = [
  { id: 1,  name: 'Jalan Rusak',                         emoji: '🛣',  leadAgency: 'Dinas PU Bina Marga',    defaultPriority: 'medium' as Priority },
  { id: 2,  name: 'Halte Rusak',                         emoji: '🚏',  leadAgency: 'Dinas Perhubungan',       defaultPriority: 'medium' as Priority },
  { id: 3,  name: 'Lampu Lalu Lintas & Lampu Jalan',     emoji: '🚦',  leadAgency: 'Dinas Perhubungan',       defaultPriority: 'high' as Priority   },
  { id: 4,  name: 'Rambu Lalu Lintas',                   emoji: '🪧',  leadAgency: 'Dinas Perhubungan',       defaultPriority: 'medium' as Priority },
  { id: 5,  name: 'Trotoar & Fasilitas Disabilitas',     emoji: '🦽',  leadAgency: 'Dinas PU Cipta Karya',    defaultPriority: 'medium' as Priority },
  { id: 6,  name: 'Website Pemerintah Disusupi Judol',   emoji: '🎰',  leadAgency: 'Diskominfo',              defaultPriority: 'urgent' as Priority },
  { id: 7,  name: 'Transportasi Umum Pemerintah',        emoji: '🚌',  leadAgency: 'Dinas Perhubungan',       defaultPriority: 'medium' as Priority },
  { id: 8,  name: 'Jembatan Penyeberangan & Zebra Cross',emoji: '🚶',  leadAgency: 'Dinas PU',                defaultPriority: 'high' as Priority   },
  { id: 9,  name: 'Kabel Semrawut',                      emoji: '🔌',  leadAgency: 'PLN / Telkom',            defaultPriority: 'low' as Priority    },
  { id: 10, name: 'Aplikasi & Website Pemerintah',       emoji: '💻',  leadAgency: 'Diskominfo',              defaultPriority: 'low' as Priority    },
  { id: 11, name: 'Drainase / Saluran Air',              emoji: '🌊',  leadAgency: 'Dinas PU Pengairan',      defaultPriority: 'high' as Priority   },
  { id: 12, name: 'Jembatan Umum',                       emoji: '🌉',  leadAgency: 'Dinas PU Bina Marga',    defaultPriority: 'urgent' as Priority },
  { id: 13, name: 'Fasilitas Air Bersih',                emoji: '💧',  leadAgency: 'PDAM / Dinas PU',         defaultPriority: 'high' as Priority   },
  { id: 14, name: 'Sampah & TPS Liar',                   emoji: '🗑',  leadAgency: 'Dinas Lingkungan Hidup',  defaultPriority: 'medium' as Priority },
  { id: 15, name: 'Taman Kota / Ruang Publik',           emoji: '🌳',  leadAgency: 'Dinas PU Cipta Karya',    defaultPriority: 'low' as Priority    },
  { id: 16, name: 'Fasilitas Sekolah Negeri',            emoji: '🏫',  leadAgency: 'Dinas Pendidikan',        defaultPriority: 'medium' as Priority },
  { id: 17, name: 'Fasilitas Kesehatan Pemerintah',      emoji: '🏥',  leadAgency: 'Dinas Kesehatan',         defaultPriority: 'high' as Priority   },
  { id: 18, name: 'Parkir Liar & Marka Parkir',          emoji: '🅿',  leadAgency: 'Dinas Perhubungan',       defaultPriority: 'low' as Priority    },
  { id: 19, name: 'Banjir / Genangan Jalan',             emoji: '🌧',  leadAgency: 'Dinas PU / BPBD',         defaultPriority: 'urgent' as Priority },
  { id: 20, name: 'Rel Kereta & Perlintasan',            emoji: '🚂',  leadAgency: 'KAI / Pemda',             defaultPriority: 'urgent' as Priority },
  { id: 21, name: 'Pelabuhan / Dermaga',                 emoji: '⚓',  leadAgency: 'Dinas Perhubungan',       defaultPriority: 'high' as Priority   },
  { id: 22, name: 'Jaringan Internet Publik',            emoji: '📡',  leadAgency: 'Diskominfo',              defaultPriority: 'low' as Priority    },
  { id: 23, name: 'Bangunan Pemerintah Terbengkalai',    emoji: '🏚',  leadAgency: 'Dinas PU Cipta Karya',    defaultPriority: 'medium' as Priority },
] as const

// Default SLA rules based on priority levels
const DEFAULT_SLA_RULES = [
  { priority: 'urgent' as Priority, targetDays: 2  },
  { priority: 'high' as Priority,   targetDays: 7  },
  { priority: 'medium' as Priority, targetDays: 14 },
  { priority: 'low' as Priority,    targetDays: 30 },
] as const

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Seed test users
  console.log('👤 Seeding test users...')
  
  const passwordHash = await bcrypt.hash('password123', 10)
  
  // Citizen user
  const citizenUser = await prisma.user.upsert({
    where: { email: 'citizen@laporin.com' },
    update: {
      name: 'Test Citizen',
      passwordHash,
      role: 'citizen',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'citizen@laporin.com',
      name: 'Test Citizen',
      passwordHash,
      role: 'citizen',
      isActive: true,
      isVerified: true,
    },
  })
  console.log(`✅ Created citizen user: ${citizenUser.email}`)

  // Create a test agency first for government users
  const testAgency = await prisma.agency.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      name: 'Dinas Pekerjaan Umum Kota Bandung',
      shortName: 'Dinas PU',
      regionCode: '3273',
      regionName: 'Kota Bandung',
      email: 'pu@bandung.go.id',
      phone: '022-1234567',
      isActive: true,
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Dinas Pekerjaan Umum Kota Bandung',
      shortName: 'Dinas PU',
      regionCode: '3273',
      regionName: 'Kota Bandung',
      email: 'pu@bandung.go.id',
      phone: '022-1234567',
      isActive: true,
    },
  })
  console.log(`✅ Created test agency: ${testAgency.shortName}`)

  // Government officer user
  const officerUser = await prisma.user.upsert({
    where: { email: 'officer@laporin.com' },
    update: {
      name: 'Test Officer',
      passwordHash,
      role: 'officer',
      agencyId: testAgency.id,
      nip: '198501012010011001',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'officer@laporin.com',
      name: 'Test Officer',
      passwordHash,
      role: 'officer',
      agencyId: testAgency.id,
      nip: '198501012010011001',
      isActive: true,
      isVerified: true,
    },
  })
  console.log(`✅ Created officer user: ${officerUser.email}`)

  // Government admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@laporin.com' },
    update: {
      name: 'Test Admin',
      passwordHash,
      role: 'admin',
      agencyId: testAgency.id,
      nip: '198001012005011001',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'admin@laporin.com',
      name: 'Test Admin',
      passwordHash,
      role: 'admin',
      agencyId: testAgency.id,
      nip: '198001012005011001',
      isActive: true,
      isVerified: true,
    },
  })
  console.log(`✅ Created admin user: ${adminUser.email}`)

  // Super admin user
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'superadmin@laporin.com' },
    update: {
      name: 'Super Admin',
      passwordHash,
      role: 'super_admin',
      agencyId: testAgency.id,
      nip: '197501012000011001',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'superadmin@laporin.com',
      name: 'Super Admin',
      passwordHash,
      role: 'super_admin',
      agencyId: testAgency.id,
      nip: '197501012000011001',
      isActive: true,
      isVerified: true,
    },
  })
  console.log(`✅ Created super admin user: ${superAdminUser.email}`)

  // Additional government users for testing
  const officer2 = await prisma.user.upsert({
    where: { email: 'budi.santoso@bandung.go.id' },
    update: {
      name: 'Budi Santoso',
      passwordHash,
      role: 'officer',
      agencyId: testAgency.id,
      nip: '199001012015011001',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'budi.santoso@bandung.go.id',
      name: 'Budi Santoso',
      passwordHash,
      role: 'officer',
      agencyId: testAgency.id,
      nip: '199001012015011001',
      isActive: true,
      isVerified: true,
    },
  })
  console.log(`✅ Created officer user: ${officer2.email}`)

  const admin2 = await prisma.user.upsert({
    where: { email: 'siti.rahayu@bandung.go.id' },
    update: {
      name: 'Siti Rahayu',
      passwordHash,
      role: 'admin',
      agencyId: testAgency.id,
      nip: '198501012010012001',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'siti.rahayu@bandung.go.id',
      name: 'Siti Rahayu',
      passwordHash,
      role: 'admin',
      agencyId: testAgency.id,
      nip: '198501012010012001',
      isActive: true,
      isVerified: true,
    },
  })
  console.log(`✅ Created admin user: ${admin2.email}\n`)

  console.log('📝 Test user credentials (all use password: password123):')
  console.log('┌─────────────────────────────────────────────────────────────────┐')
  console.log('│ CITIZEN USERS                                                   │')
  console.log('├─────────────────────────────────────────────────────────────────┤')
  console.log('│ Email: citizen@laporin.com                                      │')
  console.log('│ Role:  citizen                                                  │')
  console.log('│ Access: /citizen/* pages                                        │')
  console.log('├─────────────────────────────────────────────────────────────────┤')
  console.log('│ GOVERNMENT USERS (Access: /gov/* pages)                         │')
  console.log('├─────────────────────────────────────────────────────────────────┤')
  console.log('│ 1. Officer (Basic)                                              │')
  console.log('│    Email: officer@laporin.com                                   │')
  console.log('│    Role:  officer                                               │')
  console.log('│    NIP:   198501012010011001                                    │')
  console.log('│    Can:   View reports, update status, add comments             │')
  console.log('├─────────────────────────────────────────────────────────────────┤')
  console.log('│ 2. Officer (Budi Santoso)                                       │')
  console.log('│    Email: budi.santoso@bandung.go.id                            │')
  console.log('│    Role:  officer                                               │')
  console.log('│    NIP:   199001012015011001                                    │')
  console.log('├─────────────────────────────────────────────────────────────────┤')
  console.log('│ 3. Admin (Basic)                                                │')
  console.log('│    Email: admin@laporin.com                                     │')
  console.log('│    Role:  admin                                                 │')
  console.log('│    NIP:   198001012005011001                                    │')
  console.log('│    Can:   All officer permissions + manage officers, analytics  │')
  console.log('├─────────────────────────────────────────────────────────────────┤')
  console.log('│ 4. Admin (Siti Rahayu)                                          │')
  console.log('│    Email: siti.rahayu@bandung.go.id                             │')
  console.log('│    Role:  admin                                                 │')
  console.log('│    NIP:   198501012010012001                                    │')
  console.log('├─────────────────────────────────────────────────────────────────┤')
  console.log('│ 5. Super Admin                                                  │')
  console.log('│    Email: superadmin@laporin.com                                │')
  console.log('│    Role:  super_admin                                           │')
  console.log('│    NIP:   197501012000011001                                    │')
  console.log('│    Can:   Full system access, manage agencies, system settings  │')
  console.log('└─────────────────────────────────────────────────────────────────┘')
  console.log('\n💡 All passwords: password123\n')

  // Seed categories
  console.log('📦 Seeding categories...')
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        name: cat.name,
        emoji: cat.emoji,
        leadAgency: cat.leadAgency,
        defaultPriority: cat.defaultPriority,
      },
      create: {
        id: cat.id,
        name: cat.name,
        emoji: cat.emoji,
        leadAgency: cat.leadAgency,
        defaultPriority: cat.defaultPriority,
      },
    })
  }
  console.log(`✅ Seeded ${CATEGORIES.length} categories\n`)

  // Seed default SLA rules
  console.log('⏱️  Seeding default SLA rules...')
  for (const rule of DEFAULT_SLA_RULES) {
    // Check if a default rule for this priority already exists
    const existing = await prisma.slaRule.findFirst({
      where: {
        priority: rule.priority,
        agencyId: null,
        categoryId: null,
      },
    })

    if (existing) {
      // Update existing rule
      await prisma.slaRule.update({
        where: { id: existing.id },
        data: { targetDays: rule.targetDays },
      })
    } else {
      // Create new rule (let Prisma generate UUID)
      await prisma.slaRule.create({
        data: {
          priority: rule.priority,
          targetDays: rule.targetDays,
          agencyId: null,
          categoryId: null,
        },
      })
    }
  }
  console.log(`✅ Seeded ${DEFAULT_SLA_RULES.length} default SLA rules\n`)

  // ─────────────────────────────────────────────────────────
  // Seed badges
  // ─────────────────────────────────────────────────────────
  console.log('🏅 Seeding badges...')
  const BADGES = [
    { code: 'first-report', name: 'Pelapor Pertama', description: 'Buat laporan pertamamu', icon: '📝', color: 'blue', target: 1 },
    { code: '10-reports', name: 'Pelapor Aktif', description: 'Buat 10 laporan', icon: '📋', color: 'green', target: 10 },
    { code: '50-reports', name: 'Pelapor Berdedikasi', description: 'Buat 50 laporan', icon: '🏆', color: 'gold', target: 50 },
    { code: '100-reports', name: 'Pahlawan Kota', description: 'Buat 100 laporan', icon: '🦸', color: 'purple', target: 100 },
    { code: 'community-helper', name: 'Pembantu Komunitas', description: 'Tulis 20 komentar', icon: '💬', color: 'teal', target: 20 },
    { code: 'popular-reporter', name: 'Pelapor Populer', description: 'Dapatkan 50 upvote', icon: '⭐', color: 'amber', target: 50 },
    { code: 'streak-7', name: 'Konsisten Seminggu', description: 'Lapor 7 hari berturut', icon: '🔥', color: 'orange', target: 7 },
    { code: 'streak-30', name: 'Konsisten Sebulan', description: 'Lapor 30 hari berturut', icon: '💎', color: 'cyan', target: 30 },
  ]
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: { name: badge.name, description: badge.description, icon: badge.icon, color: badge.color, target: badge.target },
      create: badge,
    })
  }
  console.log(`✅ Seeded ${BADGES.length} badges\n`)

  // ─────────────────────────────────────────────────────────
  // Seed reports with status history, comments, votes
  // ─────────────────────────────────────────────────────────
  console.log('📝 Seeding reports...')

  const SEED_REPORTS = [
    { title: 'Jalan Berlubang Besar di Depan Kampus', desc: 'Lubang berdiameter ~60cm dan kedalaman ~15cm di tengah jalan. Sudah menyebabkan 2 motor tergelincir minggu lalu.', catId: 1, lat: -6.9732, lng: 107.6308, addr: 'Jl. Telekomunikasi No. 1, Bandung', status: 'verified_complete' as const, priority: 'urgent' as Priority, daysAgo: 14 },
    { title: 'Lampu Jalan Mati 3 Tiang Berturut', desc: '3 tiang lampu jalan mati sepanjang 200m. Area gelap total malam hari, rawan kriminalitas.', catId: 3, lat: -6.9768, lng: 107.6345, addr: 'Jl. Bojongsoang No. 45, Dayeuh Kolot', status: 'in_progress' as const, priority: 'high' as Priority, daysAgo: 7 },
    { title: 'Saluran Drainase Tersumbat Sampah', desc: 'Drainase tersumbat — air meluap ke jalan saat hujan. Genangan mencapai 30cm.', catId: 11, lat: -6.9755, lng: 107.6270, addr: 'Jl. Sukabirus No. 35, Sukapura', status: 'verified' as const, priority: 'high' as Priority, daysAgo: 5 },
    { title: 'Trotoar Ambles dan Guiding Block Hilang', desc: 'Trotoar ambles di depan kampus. Guiding block untuk tunanetra sudah hilang separuh.', catId: 5, lat: -6.9710, lng: 107.6325, addr: 'Jl. Terusan Buah Batu, Bandung', status: 'completed' as const, priority: 'medium' as Priority, daysAgo: 10 },
    { title: 'Sampah Menumpuk di Lahan Kosong', desc: 'Lahan kosong dijadikan TPS liar. Bau menyengat dan menjadi sarang nyamuk.', catId: 14, lat: -6.9790, lng: 107.6360, addr: 'Jl. PGA No. 88, Bojongsoang', status: 'in_progress' as const, priority: 'medium' as Priority, daysAgo: 8 },
    { title: 'Kabel Listrik Menjuntai Rendah', desc: 'Tiang listrik penuh kabel menjuntai. Beberapa kabel terkelupas, bahaya saat hujan.', catId: 9, lat: -6.9745, lng: 107.6250, addr: 'Jl. Sukapura No. 20, Bandung', status: 'new' as const, priority: 'low' as Priority, daysAgo: 1 },
    { title: 'Halte Bus Atap Bocor dan Bangku Patah', desc: 'Atap halte bocor, bangku patah, papan informasi rute tidak terbaca.', catId: 2, lat: -6.9695, lng: 107.6335, addr: 'Halte Jl. Terusan Buah Batu', status: 'verified' as const, priority: 'medium' as Priority, daysAgo: 4 },
    { title: 'Genangan Air Permanen di Pasar', desc: 'Genangan air tidak pernah surut bahkan saat tidak hujan. Diduga pipa PDAM bocor.', catId: 19, lat: -6.9810, lng: 107.6290, addr: 'Jl. Dayeuh Kolot No. 12', status: 'new' as const, priority: 'urgent' as Priority, daysAgo: 0 },
    { title: 'Taman Kota Peralatan Karatan', desc: 'Taman mini penuh rumput liar. Ayunan dan seluncuran anak karatan dan berbahaya.', catId: 15, lat: -6.9718, lng: 107.6283, addr: 'Taman Jl. Telekomunikasi, Sukapura', status: 'completed' as const, priority: 'low' as Priority, daysAgo: 20 },
    { title: 'Rambu Lalu Lintas Tertutup Pohon', desc: 'Rambu larangan belok kiri tertutup cabang pohon. Banyak pengendara salah belok.', catId: 4, lat: -6.9775, lng: 107.6315, addr: 'Persimpangan Jl. Terusan Buah Batu', status: 'verified_complete' as const, priority: 'medium' as Priority, daysAgo: 12 },
    { title: 'WiFi Publik Tidak Berfungsi', desc: 'WiFi gratis pemkot di area kampus tidak berfungsi sejak 2 bulan. Router tampak rusak.', catId: 22, lat: -6.9725, lng: 107.6340, addr: 'Area publik Jl. Telekomunikasi', status: 'new' as const, priority: 'low' as Priority, daysAgo: 0 },
    { title: 'JPO Lantai Retak dan Pagar Goyang', desc: 'Lantai JPO retak-retak dan terkelupas. Pagar pengaman juga goyang.', catId: 8, lat: -6.9700, lng: 107.6300, addr: 'JPO Jl. Terusan Buah Batu', status: 'in_progress' as const, priority: 'urgent' as Priority, daysAgo: 3 },
  ]

  // Status lifecycle transitions
  const STATUS_FLOWS: Record<string, string[]> = {
    new: ['new'],
    verified: ['new', 'verified'],
    in_progress: ['new', 'verified', 'in_progress'],
    completed: ['new', 'verified', 'in_progress', 'completed'],
    verified_complete: ['new', 'verified', 'in_progress', 'completed', 'verified_complete'],
  }

  const NOTES: Record<string, string> = {
    new: 'Laporan dibuat',
    verified: 'Laporan valid, diteruskan ke dinas terkait',
    in_progress: 'Perbaikan sedang dilakukan',
    completed: 'Perbaikan selesai, menunggu verifikasi warga',
    verified_complete: 'Warga mengkonfirmasi perbaikan selesai',
  }

  for (let i = 0; i < SEED_REPORTS.length; i++) {
    const r = SEED_REPORTS[i]
    const seq = i + 1
    const trackingCode = `LP-2026-3273-${String(seq).padStart(5, '0')}`
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - r.daysAgo)

    // Check if report with this tracking code already exists
    const existing = await prisma.report.findUnique({ where: { trackingCode } })
    if (existing) {
      console.log(`  ⏭️  Report ${trackingCode} already exists, skipping`)
      continue
    }

    const report = await prisma.report.create({
      data: {
        trackingCode,
        title: r.title,
        description: r.desc,
        categoryId: r.catId,
        locationLat: r.lat,
        locationLng: r.lng,
        locationAddress: r.addr,
        regionCode: '3273',
        regionName: 'Kota Bandung',
        reporterId: citizenUser.id,
        status: r.status,
        priority: r.priority,
        dangerLevel: r.priority === 'urgent' ? 5 : r.priority === 'high' ? 4 : r.priority === 'medium' ? 3 : 2,
        priorityScore: r.priority === 'urgent' ? 85 : r.priority === 'high' ? 65 : r.priority === 'medium' ? 45 : 25,
        upvoteCount: Math.floor(Math.random() * 80) + 5,
        agencyId: r.status !== 'new' ? testAgency.id : null,
        assignedOfficerId: ['in_progress', 'completed', 'verified_complete'].includes(r.status) ? officerUser.id : null,
        picNip: ['in_progress', 'completed', 'verified_complete'].includes(r.status) ? officerUser.nip : null,
        createdAt,
        completedAt: ['completed', 'verified_complete'].includes(r.status) ? new Date() : null,
        verifiedAt: r.status === 'verified_complete' ? new Date() : null,
      },
    })

    // Create status history
    const flow = STATUS_FLOWS[r.status] || ['new']
    for (let j = 0; j < flow.length; j++) {
      const prevStatus = j === 0 ? 'new' : flow[j - 1]
      const histDate = new Date(createdAt)
      histDate.setDate(histDate.getDate() + j)
      await prisma.statusHistory.create({
        data: {
          reportId: report.id,
          oldStatus: prevStatus as any,
          newStatus: flow[j] as any,
          note: NOTES[flow[j]] || 'Status diperbarui',
          changedById: j === 0 ? citizenUser.id : officerUser.id,
          officerNip: j > 0 ? officerUser.nip : null,
          createdAt: histDate,
        },
      })
    }

    // Add 1-2 comments on non-new reports
    if (r.status !== 'new') {
      await prisma.comment.create({
        data: {
          reportId: report.id,
          authorId: citizenUser.id,
          content: 'Tolong segera ditangani, sudah banyak warga yang terdampak.',
          isGovernment: false,
          createdAt: new Date(createdAt.getTime() + 3600000),
        },
      })
      if (['in_progress', 'completed', 'verified_complete'].includes(r.status)) {
        await prisma.comment.create({
          data: {
            reportId: report.id,
            authorId: officerUser.id,
            content: 'Terima kasih atas laporannya. Tim kami sedang menangani.',
            isGovernment: true,
            createdAt: new Date(createdAt.getTime() + 7200000),
          },
        })
        await prisma.report.update({
          where: { id: report.id },
          data: { commentCount: 2 },
        })
      } else {
        await prisma.report.update({
          where: { id: report.id },
          data: { commentCount: 1 },
        })
      }
    }

    console.log(`  ✅ ${trackingCode} — ${r.title} [${r.status}]`)
  }
  console.log(`✅ Seeded ${SEED_REPORTS.length} reports with status history & comments\n`)

  // ─────────────────────────────────────────────────────────
  // Seed gamification for citizen user
  // ─────────────────────────────────────────────────────────
  console.log('🎮 Seeding gamification data...')
  await prisma.userGamification.upsert({
    where: { userId: citizenUser.id },
    update: { totalPoints: 600, currentLevel: 'silver', currentStreak: 3, longestStreak: 7, impactScore: 42 },
    create: { userId: citizenUser.id, totalPoints: 600, currentLevel: 'silver', currentStreak: 3, longestStreak: 7, impactScore: 42 },
  })

  // Award first-report badge
  const firstReportBadge = await prisma.badge.findUnique({ where: { code: 'first-report' } })
  if (firstReportBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: citizenUser.id, badgeId: firstReportBadge.id } },
      update: { progress: SEED_REPORTS.length, unlockedAt: new Date() },
      create: { userId: citizenUser.id, badgeId: firstReportBadge.id, progress: SEED_REPORTS.length, unlockedAt: new Date() },
    })
  }
  const tenReportBadge = await prisma.badge.findUnique({ where: { code: '10-reports' } })
  if (tenReportBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: citizenUser.id, badgeId: tenReportBadge.id } },
      update: { progress: SEED_REPORTS.length },
      create: { userId: citizenUser.id, badgeId: tenReportBadge.id, progress: SEED_REPORTS.length },
    })
  }
  console.log('✅ Seeded gamification data\n')

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((error) => {
    console.error('❌ Error during seeding:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
