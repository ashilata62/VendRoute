import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const route = await prisma.route.findFirst({
    where: { date: '2026-08-08' },
    include: { routestop: true }
  });
  
  if (route && route.routestop.length > 0) {
    const stopToSkip = route.routestop.find(s => s.status === 'PENDING');
    if (stopToSkip) {
      await prisma.routestop.update({
        where: { id: stopToSkip.id },
        data: { status: 'SKIPPED' }
      });
      console.log('Updated stop on 08/08 to SKIPPED');
    }
  }
}

fix().finally(() => prisma.$disconnect());
