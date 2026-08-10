import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const locId = 'f27a6c55-ec34-44c2-8b0d-038f95e8f73d';
  const stops = await prisma.routestop.findMany({ where: { locationId: locId } });
  console.log("Stops for Hitech City:", stops);
}

main().catch(console.error).finally(() => prisma.$disconnect());
