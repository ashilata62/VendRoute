import { prisma } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export class LocationService {
  static async getAll() {
    return await prisma.location.findMany({
      include: {
        customer: { select: { companyName: true, contactPerson: true } },
        machine: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        customer: true,
        machine: true,
      },
    });
    if (!location) throw new Error('Location not found');
    return location;
  }

  static async create(data: any) {
    const { customerId, name, address, city, latitude, longitude, imageUrl, products } = data;
    return await prisma.location.create({
      data: { 
        id: uuidv4(),
        customerId,
        name,
        address,
        city,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        imageUrl: imageUrl ? imageUrl : null,
        products: products
          ? (typeof products === 'string' ? products : JSON.stringify(products))
          : null,
      },
    });
  }

  static async update(id: string, data: any) {
    const { customerId, name, address, city, latitude, longitude, imageUrl, products } = data;
    const updateData: any = {};
    if (customerId) updateData.customerId = customerId;
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude) || 0;
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude) || 0;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (products !== undefined) updateData.products = products;

    return await prisma.location.update({
      where: { id },
      data: updateData,
    });
  }

  static async delete(id: string) {
    // 1. Delete linked route stops
    await prisma.routestop.deleteMany({ where: { locationId: id } });
    // 2. Delete linked vending machines
    await prisma.machine.deleteMany({ where: { locationId: id } });
    // 3. Delete location record
    return await prisma.location.delete({ where: { id } });
  }
}
