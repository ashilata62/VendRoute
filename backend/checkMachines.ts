import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const machines = await prisma.machine.findMany();
  console.log(JSON.stringify(machines, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
