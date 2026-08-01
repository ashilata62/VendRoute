import { prisma } from '../config/db.js';

export class LocationService {
  static async getAll() {
    return await prisma.location.findMany({
      include: {
        customer: { select: { companyName: true, contactPerson: true } },
        machines: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        customer: true,
        machines: true,
      },
    });
    if (!location) throw new Error('Location not found');
    return location;
  }

  static async create(data: any) {
    return await prisma.location.create({ data });
  }

  static async update(id: string, data: any) {
    return await prisma.location.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return await prisma.location.delete({ where: { id } });
  }
}
