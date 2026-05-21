export interface Tenant {
  id: string;
  name: string;
  slug: string;
  document?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  primaryColor: string;
  status: TenantStatus;
  planType?: string;
  trialDays: number;
  trialStartAt?: string;
  trialEndsAt?: string;
  maxStores: number;
  maxTvs: number;
  maxMedia: number;
  maxStorageMb: number;
  blockedAt?: string;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    stores: number;
    tvs: number;
    subscriptions: number;
  };
  subscription?: Subscription;
}

export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'CANCELED' | 'BLOCKED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  lastIp?: string;
  tenantId: string;
  tenant?: Tenant;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER';

export interface Store {
  id: string;
  name: string;
  code: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  managerName?: string;
  managerPhone?: string;
  latitude?: number;
  longitude?: number;
  openingTime?: string;
  closingTime?: string;
  logoUrl?: string;
  primaryColor?: string;
  status: StoreStatus;
  blockedAt?: string;
  blockedReason?: string;
  tenantId: string;
  tenant?: Tenant;
  createdAt: string;
  updatedAt: string;
  _count?: { tvs: number };
}

export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Tv {
  id: string;
  name: string;
  pairingCode: string;
  description?: string;
  model?: string;
  resolution?: string;
  orientation: Orientation;
  status: TvStatus;
  ipAddress?: string;
  lastPingAt?: string;
  volume: number;
  autoRotate: boolean;
  rotateInterval: number;
  token: string;
  m3uUrl?: string;
  storeId: string;
  store?: Store;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export type TvStatus = 'ONLINE' | 'OFFLINE' | 'PAUSED' | 'ERROR';
export type Orientation = 'HORIZONTAL' | 'VERTICAL' | 'BOTH';

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  cycle: string;
  maxStores: number;
  maxTvs: number;
  maxMedia: number;
  maxStorageMb: number;
  features?: Record<string, boolean>;
  recommended: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  asaasId?: string;
  asaasCustomerId?: string;
  planSlug: string;
  planName: string;
  status: SubscriptionStatus;
  price: number;
  cycle: string;
  trialStartDate?: string;
  trialEndDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  nextBillingAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  invoices?: Invoice[];
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

export interface Invoice {
  id: string;
  subscriptionId: string;
  asaasId?: string;
  asaasInvoiceId?: string;
  amount: number;
  discount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  creditCardInfo?: Record<string, unknown>;
  cycleReference?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'PENDING' | 'PAID' | 'CANCELED' | 'OVERDUE' | 'REFUNDED';

export interface Payment {
  id: string;
  tenantId: string;
  asaasId?: string;
  asaasPaymentId?: string;
  amount: number;
  fee: number;
  status: PaymentStatus;
  paymentMethod?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  paymentUrl?: string;
  pixCopiaECola?: string;
  boletoUrl?: string;
  boletoCode?: string;
  cardLastDigits?: string;
  paidAt?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
}

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'CANCELED' | 'REFUNDED' | 'CHARGEBACK';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxUses?: number;
  usedCount: number;
  minValue?: number;
  maxDiscount?: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
  planSlug?: string;
  firstTimeOnly: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiToken {
  id: string;
  name: string;
  token: string;
  scope: TokenScope;
  lastUsedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  tenantId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type TokenScope = 'FULL_ACCESS' | 'READ_ONLY' | 'STORES' | 'TVS' | 'MEDIA' | 'PLAYLISTS' | 'SCHEDULES' | 'BILLING' | 'IPTV';

export interface AuditLog {
  id: string;
  action: string;
  entity?: string;
  entityId?: string;
  userId: string;
  tenantId: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  user?: User;
  tenant?: Tenant;
}

export interface WebhookLog {
  id: string;
  provider: string;
  event: string;
  payload?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  ip?: string;
  status?: number;
  response?: string;
  processed: boolean;
  processedAt?: string;
  error?: string;
  tenantId?: string;
  createdAt: string;
  tenant?: Tenant;
}

export interface SystemLog {
  id: string;
  level: LogLevel;
  action: string;
  message?: string;
  userId?: string;
  tenantId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  user?: User;
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  category: string;
  isEncrypted: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AsaasConfig {
  id: string;
  apiKey: string;
  environment: string;
  webhookSecret?: string;
  notifyUrl?: string;
  enabled: boolean;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  overdueClients: number;
  totalTvs: number;
  monthlyRevenue: number;
  revenueChart: { month: string; revenue: number }[];
  recentClients: Tenant[];
  recentPayments: Payment[];
  systemHealth: SystemHealth[];
}

export interface SystemHealth {
  service: string;
  status: string;
  responseTimeMs?: number;
  error?: string;
  checkedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
