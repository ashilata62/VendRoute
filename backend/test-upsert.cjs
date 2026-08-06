const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  company: {
    orgName: 'Maryland Vending Service',
    timezone: 'Asia/Kolkata (IST, UTC+5:30)',
    currency: 'INR (₹)',
    language: 'English',
    theme: 'Light',
    logo: '',
  },
  routing: {
    autoOptimize: true,
    maxStops: 15,
  },
  gps: {},
  permissions: {},
};

async function main() {
  try {
    const res = await prisma.settings.upsert({
      where: { id: 'global' },
      update: { data: DEFAULT_SETTINGS },
      create: { id: 'global', data: DEFAULT_SETTINGS },
    });
    console.log("Upsert succeeded", res);
  } catch (e) {
    console.error("Upsert failed", e);
  }
}

main().catch(console.error).finally(()=>prisma.$disconnect());
