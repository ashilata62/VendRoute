import { prisma } from '../config/db.js';

export class MachineService {
  static async getAll() {
    return await prisma.machine.findMany({
      include: {
        location: {
          include: { customer: { select: { companyName: true } } },
        },
      },
      orderBy: { fillLevel: 'asc' },
    });
  }

  static async create(data: any) {
    return await prisma.machine.create({ data });
  }

  static async updateStock(id: string, fillLevel: number, status?: any) {
    return await prisma.machine.update({
      where: { id },
      data: {
        fillLevel,
        status: status || (fillLevel < 20 ? 'OUT_OF_STOCK' : 'ACTIVE'),
        lastRefill: new Date(),
      },
    });
  }
}
