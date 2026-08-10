import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const allStops = await prisma.routestop.findMany({
    where: { status: 'SKIPPED' },
    include: { route: true, location: true }
  });
  console.log(JSON.stringify(allStops, null, 2));
}

check().finally(() => prisma.$disconnect());
