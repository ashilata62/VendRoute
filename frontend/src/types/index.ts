// ─── Auth ─────────────────────────────────────────────────────────────────────
export type UserRole = "superadmin" | "supervisor" | "driver" | "viewer" | "NIVHE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

// ─── Driver ───────────────────────────────────────────────────────────────────
export type DriverStatus = "active" | "inactive";
export type DriverLiveStatus = "online" | "offline" | "on-route";

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  licenseNumber: string;
  assignedVehicleId: string | null;
  status: DriverStatus;
  liveStatus: DriverLiveStatus;
  rating: number;
  totalRoutes: number;
  completedStops: number;
  joinedDate: string;
  address: string;
}

// ─── Vehicle ──────────────────────────────────────────────────────────────────
export type VehicleType = "van" | "truck" | "bike";
export type FuelType = "diesel" | "petrol" | "cng" | "electric";

export interface Vehicle {
  id: string;
  model: string;
  plateNumber: string;
  type: VehicleType;
  fuelType: FuelType;
  lastMaintenance: string;
  nextMaintenance: string;
  gpsDeviceId: string;
  currentFuelLevel: number; // 0-100
  odometer: number;
  assignedDriverId: string | null;
  status: "available" | "in-use" | "maintenance";
}

// ─── Vending Location ─────────────────────────────────────────────────────────
export type MachineType = "Snack" | "Beverage" | "Combo" | "Coffee";
export type LocationStatus = "operational" | "needs-service" | "offline";
export type VisitFrequency = "Daily" | "Weekly" | "Bi-weekly" | "Monthly";

export interface VendingLocation {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  contactPerson: string;
  contactPhone: string;
  machineId: string;
  machineType: MachineType;
  products: string[];
  visitFrequency: VisitFrequency;
  lastServiceDate: string;
  nextServiceDate: string;
  status: LocationStatus;
  notes: string;
  photoGallery: string[];
  customerId: string;
  revenue: number;
}

// ─── Stop ─────────────────────────────────────────────────────────────────────
export type StopStatus = "PENDING" | "REACHED" | "COMPLETED" | "SKIPPED";

export interface InventoryItem {
  product: string;
  qty: number;
}

export interface Stop {
  id: string;
  routeId: string;
  locationId: string;
  sequenceNumber: number;
  status: StopStatus;
  arrivalTime: string | null;
  departureTime: string | null;
  gpsVerified: boolean;
  photos: string[];
  notes: string;
  inventoryRefilled: InventoryItem[];
  cashCollected: number;
  machineIssues: string;
  signature: boolean;
}

// ─── Route ────────────────────────────────────────────────────────────────────
export type RouteStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Route {
  id: string;
  name: string;
  date: string;
  driverId: string;
  vehicleId: string;
  status: RouteStatus;
  stops: string[]; // stop IDs
  totalDistance: number; // km
  estimatedTime: number; // minutes
  actualTime: number | null; // minutes
  startTime: string | null;
  endTime: string | null;
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  companyName: string;
  contractStart: string;
  contractEnd: string;
  locations: string[]; // location IDs
  primaryContact: string;
  email: string;
  phone: string;
  industry: string;
  totalRevenue: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType = "info" | "warning" | "success" | "error";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}
