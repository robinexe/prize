// Shared enums - must match Prisma schema
export enum Role {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  CLIENT = 'CLIENT',
}

export enum BoatStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  BLOCKED = 'BLOCKED',
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum ChargeStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum ChargeType {
  MONTHLY = 'MONTHLY',
  FUEL = 'FUEL',
  MAINTENANCE = 'MAINTENANCE',
  EXTRA = 'EXTRA',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
}

export enum DelinquencyStatus {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  NEGOTIATING = 'NEGOTIATING',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ChecklistType {
  PRE_LAUNCH = 'PRE_LAUNCH',
  POST_USE = 'POST_USE',
  WEEKLY = 'WEEKLY',
}

export enum QueueStatus {
  WAITING = 'WAITING',
  PREPARING = 'PREPARING',
  LAUNCHING = 'LAUNCHING',
  ON_WATER = 'ON_WATER',
  RETURNING = 'RETURNING',
  COMPLETED = 'COMPLETED',
}

export enum NotificationType {
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  RESERVATION_CONFIRMED = 'RESERVATION_CONFIRMED',
  RESERVATION_REMINDER = 'RESERVATION_REMINDER',
  MAINTENANCE_UPDATE = 'MAINTENANCE_UPDATE',
  DELINQUENCY_ALERT = 'DELINQUENCY_ALERT',
  QUEUE_UPDATE = 'QUEUE_UPDATE',
  GENERAL = 'GENERAL',
}

// Shared interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Boat {
  id: string;
  name: string;
  model: string;
  year: number;
  registrationNumber: string;
  totalShares: number;
  status: BoatStatus;
  imageUrl?: string;
  createdAt: string;
}

export interface Share {
  id: string;
  userId: string;
  boatId: string;
  percentage: number;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  user?: User;
  boat?: Boat;
}

export interface Reservation {
  id: string;
  userId: string;
  boatId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  notes?: string;
  user?: User;
  boat?: Boat;
}

export interface Charge {
  id: string;
  userId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: ChargeStatus;
  type: ChargeType;
  referenceMonth?: string;
  user?: User;
}

export interface Payment {
  id: string;
  chargeId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  proof?: string;
}

export interface Delinquency {
  id: string;
  userId: string;
  chargeId: string;
  amount: number;
  daysOverdue: number;
  status: DelinquencyStatus;
  notifiedAt?: string;
  blockedAt?: string;
  user?: User;
}

export interface FuelLog {
  id: string;
  boatId: string;
  operatorId: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  date: string;
  boat?: Boat;
}

export interface Maintenance {
  id: string;
  boatId: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  estimatedCost?: number;
  actualCost?: number;
  startDate?: string;
  completedDate?: string;
  boat?: Boat;
}

export interface Checklist {
  id: string;
  boatId: string;
  type: ChecklistType;
  operatorId: string;
  items: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  isCompleted: boolean;
  notes?: string;
}

export interface QueueEntry {
  id: string;
  userId: string;
  boatId: string;
  position: number;
  status: QueueStatus;
  requestedAt: string;
  user?: User;
  boat?: Boat;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FinanceDashboard {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  revenueGrowth: number;
  chargesCount: { paid: number; pending: number; overdue: number };
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
