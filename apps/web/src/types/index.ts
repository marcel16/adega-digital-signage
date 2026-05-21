export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: "ADMIN" | "MANAGER" | "OPERATOR"
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  document?: string
  plan: "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
  planStatus: "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELED"
  trialEndsAt?: string
  planRenewalAt?: string
  storageUsed: number
  storageLimit: number
  createdAt: string
  updatedAt: string
}

export interface Store {
  id: string
  tenantId: string
  name: string
  code: string
  document?: string
  address?: string
  city?: string
  state?: string
  phone?: string
  manager?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TV {
  id: string
  tenantId: string
  storeId?: string
  name: string
  description?: string
  pairingCode: string
  model?: string
  resolution?: string
  orientation?: "LANDSCAPE" | "PORTRAIT"
  status: "ONLINE" | "OFFLINE" | "PAUSED" | "ERROR"
  lastPingAt?: string
  m3uUrl?: string
  createdAt: string
  updatedAt: string
  store?: Store
}

export interface Media {
  id: string
  tenantId: string
  name: string
  description?: string
  type: "IMAGE" | "VIDEO" | "AUDIO" | "URL"
  url: string
  thumbnailUrl?: string
  mimeType?: string
  size: number
  duration?: number
  tags?: string[]
  folder?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CampaignMedia {
  id: string
  campaignId: string
  mediaId: string
  order: number
  duration?: number
  media?: Media
}

export interface Overlay {
  id: string
  campaignId: string
  type: "TEXT" | "PRICE" | "QR_CODE" | "BADGE" | "TIMER"
  content: string
  positionX: number
  positionY: number
  width?: number
  height?: number
  style?: Record<string, string>
  animation?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Campaign {
  id: string
  tenantId: string
  storeId?: string
  name: string
  description?: string
  type: "IMAGE" | "VIDEO" | "MIXED" | "IPTV"
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELED"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  startDate: string
  endDate?: string
  mediaItems?: CampaignMedia[]
  overlays?: Overlay[]
  store?: Store
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: string
  tenantId: string
  storeId?: string
  tvId: string
  campaignId?: string
  playlistId?: string
  name: string
  daysOfWeek: number[]
  startTime: string
  endTime: string
  startDate: string
  endDate?: string
  isRecurring: boolean
  status: "ACTIVE" | "COMPLETED" | "CANCELED"
  tv?: TV
  campaign?: Campaign
  createdAt: string
  updatedAt: string
}

export interface Playlist {
  id: string
  tenantId: string
  name: string
  description?: string
  items?: PlaylistItem[]
  createdAt: string
  updatedAt: string
}

export interface PlaylistItem {
  id: string
  playlistId: string
  mediaId: string
  order: number
  duration: number
  media?: Media
}

export interface Invoice {
  id: string
  tenantId: string
  plan: string
  amount: number
  status: "PENDING" | "PAID" | "CANCELED" | "REFUNDED"
  dueDate: string
  paidAt?: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  tenant: Tenant
  token: string
  refreshToken: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
