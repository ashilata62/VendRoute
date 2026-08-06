import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// GET /users — list all users, optionally filtered by role
export const getUsers = async (req: Request, res: Response) => {
  try {
    const role = req.query.role as string | undefined;
    const users = await (prisma.user as any).findMany({
      where: role ? { role: role.toUpperCase() as any } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        licenseNumber: true,
        emergencyContact: true,
        role: true,
        avatar: true,
        isOnline: true,
      },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// GET /users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await (prisma.user as any).findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        licenseNumber: true,
        emergencyContact: true,
        role: true,
        avatar: true,
        isOnline: true,
        createdAt: true,
      },
    });
    if (!user) throw new Error('User not found');
    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// POST /users
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, role, phone, address, licenseNumber, emergencyContact, password } = req.body;
    
    // Hash default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'password123', salt);

    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff`;

    const user = await (prisma.user as any).create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        licenseNumber: licenseNumber || null,
        emergencyContact: emergencyContact || null,
        password: hashedPassword,
        role: role ? role.toUpperCase() : 'DRIVER',
        avatar,
        id: crypto.randomUUID(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        licenseNumber: true,
        emergencyContact: true,
        role: true,
        avatar: true,
        isOnline: true,
        createdAt: true,
      }
    });

    return res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Unlink or delete routes assigned to driver
    const driverRoutes = await prisma.route.findMany({ where: { driverId: id }, select: { id: true } });
    const routeIds = driverRoutes.map(r => r.id);

    if (routeIds.length > 0) {
      await prisma.routestop.deleteMany({ where: { routeId: { in: routeIds } } });
      await prisma.route.deleteMany({ where: { driverId: id } });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, phone, address, licenseNumber, emergencyContact, role, avatar, isOnline, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (role) updateData.role = role;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (isOnline !== undefined) updateData.isOnline = isOnline;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await (prisma.user as any).update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        licenseNumber: true,
        emergencyContact: true,
        role: true,
        avatar: true,
        isOnline: true,
        createdAt: true,
      },
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
