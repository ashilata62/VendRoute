const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const routes = await prisma.route.findMany({ select: { name: true, totalDistance: true } });
  console.log(routes);
}

main().finally(() => prisma.$disconnect());
