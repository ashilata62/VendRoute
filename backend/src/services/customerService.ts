import { prisma } from '../config/db.js';

export class CustomerService {
  static async getAll() {
    return await prisma.customer.findMany({
      include: {
        locations: {
          include: {
            machines: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        locations: {
          include: { machines: true },
        },
      },
    });
    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  static async create(data: any) {
    return await prisma.customer.create({ data });
  }

  static async update(id: string, data: any) {
    return await prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    const locations = await prisma.location.findMany({ where: { customerId: id }, select: { id: true } });
    const locationIds = locations.map(l => l.id);

    if (locationIds.length > 0) {
      await prisma.routeStop.deleteMany({ where: { locationId: { in: locationIds } } });
      await prisma.machine.deleteMany({ where: { locationId: { in: locationIds } } });
      await prisma.location.deleteMany({ where: { customerId: id } });
    }

    return await prisma.customer.delete({ where: { id } });
  }
}
