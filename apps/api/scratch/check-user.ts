// scratch/check-user.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, name: true, agencyId: true, role: true }
  });
  console.log('Admins:', JSON.stringify(users, null, 2));
  
  const agencies = await prisma.agency.findMany();
  console.log('Agencies:', JSON.stringify(agencies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
