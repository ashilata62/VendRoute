import { prisma } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

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
    return await prisma.machine.create({
      data: {
        id: data.id || uuidv4(),
        locationId: data.locationId,
        machineCode: data.machineCode,
        model: data.model,
        fillLevel: data.fillLevel ?? 100,
        status: data.status || 'ACTIVE',
      }
    });
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
