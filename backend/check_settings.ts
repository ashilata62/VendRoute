import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
  console.log("Settings from DB:", settings ? settings.data : "NULL");
}

main().catch(console.error).finally(() => prisma.$disconnect());
