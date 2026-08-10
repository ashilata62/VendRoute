import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const dewas = await prisma.route.findFirst({
    where: { name: 'dewas' },
    include: { routestop: true }
  });
  
  if (dewas) {
    const stopToSkip = dewas.routestop.find(s => s.status === 'PENDING');
    if (stopToSkip) {
      await prisma.routestop.update({
        where: { id: stopToSkip.id },
        data: { status: 'SKIPPED' }
      });
      console.log('Updated stop to SKIPPED');
    }
  }
}

fix().finally(() => prisma.$disconnect());
