import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const stops = await prisma.routestop.findMany({ where: { cashCollected: { gt: 0 } } });
  console.log("Stops with cash:");
  stops.forEach(s => console.log(`LocID: ${s.locationId}, Status: ${s.status}, Cash: ${s.cashCollected}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
