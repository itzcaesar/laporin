// ── apps/api/prisma/seed.ts ──
// Database seeding script for Laporin
// Run with: pnpm --filter @laporin/api db:seed

import { PrismaClient, Priority } from '@prisma/client'

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
