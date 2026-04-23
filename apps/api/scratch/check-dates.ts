// scratch/check-dates.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.report.findMany({
    select: { createdAt: true }
  });
  console.log('Report Dates:', JSON.stringify(reports, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
