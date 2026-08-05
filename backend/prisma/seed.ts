import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Clear existing data (to prevent unique constraint errors on re-run)
  console.log('🧹 Clearing old data...');
  await prisma.routeStop.deleteMany();
  await prisma.route.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.location.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vehicle.deleteMany();

  // 1. Create all Demo Users (upsert = create if not exists, skip if exists)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vendroute.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@vendroute.com', password: hashedPassword, role: 'ADMIN', phone: '+919876543210' },
  });

  const adminIn = await prisma.user.upsert({
    where: { email: 'admin@vendroute.in' },
    update: {},
    create: { name: 'Rohit Kapoor', email: 'admin@vendroute.in', password: hashedPassword, role: 'ADMIN', phone: '+919876500001' },
  });

  const managerIn = await prisma.user.upsert({
    where: { email: 'manager@vendroute.in' },
    update: {},
    create: { name: 'Sunita Agarwal', email: 'manager@vendroute.in', password: hashedPassword, role: 'SUPERVISOR', phone: '+919876500002' },
  });

  const driverIn = await prisma.user.upsert({
    where: { email: 'driver@vendroute.in' },
    update: {},
    create: { name: 'Arjun Sharma', email: 'driver@vendroute.in', password: hashedPassword, role: 'DRIVER', phone: '+919876500003' },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'driver@vendroute.com' },
    update: {},
    create: { name: 'Rahul Sharma', email: 'driver@vendroute.com', password: hashedPassword, role: 'DRIVER', phone: '+919812345678' },
  });

  console.log('✅ Created Users:', [admin, adminIn, managerIn, driverIn, driver].map(u => u.email).join(', '));

  // 3. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      companyName: 'Metro Hospital & Research Centre',
      contactPerson: 'Dr. Alok Verma',
      email: 'contact@metrohospitals.com',
      phone: '+911145678900',
      industry: 'Healthcare',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      companyName: 'CyberTech IT Park',
      contactPerson: 'Priya Sundaram',
      email: 'facilities@cybertech.io',
      phone: '+918023456789',
      industry: 'Information Technology',
    },
  });

  console.log('✅ Created 2 Customers');

  // 4. Create Locations
  const location1 = await prisma.location.create({
    data: {
      customerId: customer1.id,
      name: 'Metro Hospital Main Lobby',
      address: 'Sector 62, Noida, UP',
      city: 'Noida',
      latitude: 28.6273,
      longitude: 77.3725,
    },
  });

  const location2 = await prisma.location.create({
    data: {
      customerId: customer2.id,
      name: 'CyberTech Tower A - Cafeteria',
      address: 'Electronic City, Bengaluru',
      city: 'Bengaluru',
      latitude: 12.8399,
      longitude: 77.677,
    },
  });

  console.log('✅ Created 2 Vending Locations');

  // 5. Create Vending Machines
  await prisma.machine.createMany({
    data: [
      {
        locationId: location1.id,
        machineCode: 'VEND-HL-101',
        model: 'SnackMaster Pro V4',
        fillLevel: 85,
        status: 'ACTIVE',
      },
      {
        locationId: location1.id,
        machineCode: 'VEND-HL-102',
        model: 'Beverage Express 500',
        fillLevel: 25,
        status: 'NEEDS_MAINTENANCE',
      },
      {
        locationId: location2.id,
        machineCode: 'VEND-CT-201',
        model: 'Combo Vend Max 2026',
        fillLevel: 90,
        status: 'ACTIVE',
      },
    ],
  });

  console.log('✅ Created 3 Vending Machines');

  // 5.5 Create Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      model: 'Tata Ace Gold',
      plateNumber: 'MH-01-AB-1234',
      type: 'van',
      fuelType: 'diesel',
      assignedDriverId: driverIn.id,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      model: 'Mahindra Bolero',
      plateNumber: 'MH-01-CD-5678',
      type: 'truck',
      fuelType: 'diesel',
      assignedDriverId: driver.id,
    },
  });
  console.log('✅ Created 2 Vehicles');

  // 6. Create Route & Stops for Driver
  const route = await prisma.route.create({
    data: {
      driverId: driverIn.id,
      vehicleId: vehicle1.id,
      name: 'North Mumbai Morning Run',
      date: new Date().toISOString().split("T")[0],
      status: 'IN_PROGRESS',
      stops: {
        create: [
          {
            locationId: location1.id,
            stopOrder: 1,
            status: 'PENDING',
          },
          {
            locationId: location2.id,
            stopOrder: 2,
            status: 'PENDING',
          },
        ],
      },
    },
  });

  console.log('✅ Created Driver Route:', route.name);
  console.log('🎉 Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
