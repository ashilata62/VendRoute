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
    return await prisma.customer.delete({ where: { id } });
  }
}
