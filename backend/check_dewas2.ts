import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function check() {
  const routes = await prisma.route.findMany({
    where: { name: 'dewas' },
    include: { routestop: true }
  });
  fs.writeFileSync('dewas_out.json', JSON.stringify(routes, null, 2), 'utf-8');
}

check().finally(() => prisma.$disconnect());
