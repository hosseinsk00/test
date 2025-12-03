// User & Auth Types
export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  phoneNumber: string | null;
  email: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FLEET_MANAGER = 'FLEET_MANAGER',
  MAINTENANCE = 'MAINTENANCE',
  NETWORK_EXPERT = 'NETWORK_EXPERT',
  DRIVER = 'DRIVER',
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

// Truck Types
export interface Truck {
  id: number;
  plateNumber: string;
  model: string;
  year: number;
  chassisNumber: string;
  engineNumber: string;
  status: TruckStatus;
  currentKilometer: number;
  fuelType: string;
  fuelCapacity: number;
  expectedFuelConsumption: number | null;
  insuranceExpiry: string | null;
  inspectionExpiry: string | null;
  lastServiceDate: string | null;
  lastInspectionDate: string | null;
  qrCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export enum TruckStatus {
  ACTIVE = 'ACTIVE',
  UNDER_SERVICE = 'UNDER_SERVICE',
  BROKEN_DOWN = 'BROKEN_DOWN',
  INACTIVE = 'INACTIVE',
}

// Driver Types
export interface Driver {
  id: number;
  fullName: string;
  nationalId: string;
  licenseNumber: string;
  licenseExpiry: string;
  phoneNumber: string;
  address: string | null;
  status: DriverStatus;
  performanceScore: number;
  currentTruckId: number | null;
  currentTruck?: Truck;
  createdAt: string;
}

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

// Dashboard Types
export interface DashboardStats {
  fleet: {
    total: number;
    active: number;
    underService: number;
    brokenDown: number;
    inactive: number;
    operationalRate: string;
  };
  drivers: {
    total: number;
    active: number;
    assigned: number;
    unassigned: number;
    assignmentRate: string;
  };
  breakdowns: {
    total: number;
    critical: number;
    active: number;
    fixed: number;
    fixRate: string;
  };
  services: {
    total: number;
    scheduled: number;
    completed: number;
    overdue: number;
    completionRate: string;
  };
  inspections: {
    total: number;
    passed: number;
    failed: number;
    averageScore: string;
    passRate: string;
  };
  fuel: {
    totalConsumption: number;
    totalDistance: number;
    averageConsumptionPerKm: string;
    totalRefills: number;
    totalCost: number;
    averagePricePerLiter: string;
  };
  notifications: {
    unread: number;
  };
}

// Notification Types
export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  relatedEntity: string | null;
  relatedEntityId: number | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export enum NotificationType {
  SERVICE_DUE = 'SERVICE_DUE',
  INSPECTION_DUE = 'INSPECTION_DUE',
  BREAKDOWN_CRITICAL = 'BREAKDOWN_CRITICAL',
  INSURANCE_EXPIRY = 'INSURANCE_EXPIRY',
  DOCUMENT_EXPIRY = 'DOCUMENT_EXPIRY',
  FUEL_ABNORMAL = 'FUEL_ABNORMAL',
  INSPECTION_FAILED = 'INSPECTION_FAILED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common Types
export interface SelectOption {
  value: string | number;
  label: string;
}
