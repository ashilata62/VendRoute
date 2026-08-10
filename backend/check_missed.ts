import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const routes = await prisma.route.findMany({
    where: { date: '2026-08-08' },
    include: { routestop: true }
  });
  console.log(JSON.stringify(routes, null, 2));
}

check().finally(() => prisma.$disconnect());
