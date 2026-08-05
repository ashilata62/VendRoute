import { prisma } from '../config/db.js';

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
    startTime: '08:00',
    endTime: '18:00',
    priority: 'Medium',
    distanceLimit: 120,
    shiftType: 'Day Shift (08:00 - 17:00)',
    breakTime: 60,
    weekendSat: true,
    weekendSun: true,
    holidays: 'New Year, Independence Day, Diwali',
  },
  gps: {
    gpsAccuracy: 'High (GPS + Network)',
    gpsInterval: 10,
    geofenceRadius: 50,
    backgroundTracking: true,
    mandatoryCheckin: true,
    maxPhotos: 4,
    maxImageSize: 5,
    compression: '80% (Optimized)',
    allowedJPG: true,
    allowedPNG: true,
    allowedWEBP: true,
    cloudProvider: 'Firebase Storage',
  },
  permissions: {
    superadmin: { regions: true, users: true, routes: true, reports: true },
    supervisor: { regions: true, users: false, routes: true, reports: true },
    driver: { regions: false, users: false, routes: false, reports: false },
  },
};

export class SettingsService {
  static async get() {
    const row = await (prisma as any).settings.findUnique({ where: { id: 'global' } });
    if (!row) return DEFAULT_SETTINGS;
    return row.data as typeof DEFAULT_SETTINGS;
  }

  static async upsert(data: any) {
    const current = await this.get();
    const merged = {
      ...current,
      ...data,
      company: { ...current.company, ...(data.company || {}) },
      routing: { ...current.routing, ...(data.routing || {}) },
      gps: { ...current.gps, ...(data.gps || {}) },
      permissions: { ...current.permissions, ...(data.permissions || {}) },
    };
    return await (prisma as any).settings.upsert({
      where: { id: 'global' },
      update: { data: merged },
      create: { id: 'global', data: merged },
    });
  }
}
