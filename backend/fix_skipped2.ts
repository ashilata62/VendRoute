import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  const dewasRoutes = await prisma.route.findMany({
    where: { name: 'dewas' },
    include: { routestop: true }
  });
  
  for (const route of dewasRoutes) {
    for (const stop of route.routestop) {
      if (stop.status === 'PENDING') {
        await prisma.routestop.update({
          where: { id: stop.id },
          data: { status: 'SKIPPED' }
        });
        console.log('Updated stop', stop.id, 'to SKIPPED');
      }
    }
  }
}

fix().finally(() => prisma.$disconnect());
