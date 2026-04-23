// scratch/check-data.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.report.count();
  const byAgency = await prisma.report.groupBy({
    by: ['agencyId'],
    _count: true
  });
  const recent = await prisma.report.findMany({
    take: 5,
    select: { id: true, agencyId: true, status: true }
  });
  
  console.log('Total Reports:', total);
  console.log('By Agency:', JSON.stringify(byAgency, null, 2));
  console.log('Recent Reports:', JSON.stringify(recent, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
