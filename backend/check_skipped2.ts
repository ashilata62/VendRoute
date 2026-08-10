import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const dewas = await prisma.route.findFirst({
    where: { name: 'dewas' },
    include: { routestop: true }
  });
  
  if (dewas) {
    const skipped = dewas.routestop.filter(s => s.status === 'SKIPPED');
    console.log(`Skipped count: ${skipped.length}`);
  }
}

check().finally(() => prisma.$disconnect());
