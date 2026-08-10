import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const locs = await prisma.location.findMany();
  console.log("Locations:", locs);
  
  const stops = await prisma.routestop.findMany();
  console.log("Stops:", stops);

  const routes = await prisma.route.findMany();
  console.log("Routes:", routes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
