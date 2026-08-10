import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const notifications = await prisma.notification.findMany();
  console.log(JSON.stringify(notifications, null, 2));
}

check().finally(() => prisma.$disconnect());
