import type { EntityStatus, ID, ISODate } from './common.types'

/* ------------------------------------------------------------------ */
/*  Domain models — the shared vocabulary of the Julio marketplace.    */
/*  Buyer ↔ Seller is a *mode* of a single User. A user opens a Store  */
/*  (product OR service based) backed by an active paid Subscription.  */
/*  There is no cart/checkout — deals happen inside Conversations.     */
/* ------------------------------------------------------------------ */

export type StoreType = 'product' | 'service'

export interface User {
  id: ID
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  status: EntityStatus
  /** Convenience flag — true when the user owns a store (i.e. is a seller). */
  hasStore: boolean
  /** Name of the store this user owns (sellers only). */
  storeName?: string
  /** Id of the store this user owns (sellers only). */
  storeId?: ID
  /** Populated when status is `suspended` via a ban action. */
  banReason?: string
  createdAt: ISODate
  lastActiveAt: ISODate
}

export interface Store {
  id: ID
  name: string
  type: StoreType
  ownerId: ID
  ownerName: string
  logoUrl?: string
  category: string
  status: EntityStatus
  /** Current subscription id, if the store has one. */
  subscriptionId?: ID
  planName?: string
  listingCount: number
  rating: number
  createdAt: ISODate
}

export interface Product {
  id: ID
  title: string
  storeId: ID
  storeName: string
  category: string
  price: number
  currency: string
  stock: number
  status: EntityStatus
  imageUrl?: string
  createdAt: ISODate
}

export interface Service {
  id: ID
  title: string
  storeId: ID
  storeName: string
  category: string
  /** Services are priced per unit of work (hour, project, visit…). */
  price: number
  currency: string
  pricingUnit: 'hour' | 'project' | 'visit' | 'day'
  status: EntityStatus
  imageUrl?: string
  createdAt: ISODate
}

export type BillingInterval = 'monthly' | 'yearly'

export interface Plan {
  id: ID
  name: string
  price: number
  currency: string
  interval: BillingInterval
  /** Which store types may subscribe to this plan. */
  appliesTo: StoreType[]
  /** Max listings allowed under the plan (null = unlimited). */
  listingLimit: number | null
  features: string[]
  isActive: boolean
  popular?: boolean
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'

export interface Subscription {
  id: ID
  storeId: ID
  storeName: string
  /** The seller (user) who owns the subscribed store. */
  ownerName: string
  storeType: StoreType
  planId: ID
  planName: string
  amount: number
  currency: string
  interval: BillingInterval
  status: SubscriptionStatus
  currentPeriodStart: ISODate
  currentPeriodEnd: ISODate
  createdAt: ISODate
}

export interface Category {
  id: ID
  name: string
  type: StoreType
  listingCount: number
  isActive: boolean
}

/* --------------------------- Dashboard ---------------------------- */

export interface DashboardStats {
  totalUsers: number
  totalStores: number
  activeSubscriptions: number
  mrr: number // monthly recurring revenue
  deltas: {
    users: number
    stores: number
    subscriptions: number
    mrr: number
  }
}

export interface TimeSeriesPoint {
  label: string
  revenue: number
  signups: number
}

export interface StoreTypeBreakdown {
  type: StoreType
  count: number
}

/* --------------------------- Moderation --------------------------- */

export type ReportTargetType = 'user' | 'store' | 'product' | 'service'
export type ReportStatus = 'open' | 'resolved' | 'dismissed'
export type ReportSeverity = 'low' | 'medium' | 'high'

export interface Report {
  id: ID
  targetType: ReportTargetType
  targetName: string
  reporterName: string
  reason: string
  severity: ReportSeverity
  status: ReportStatus
  createdAt: ISODate
  resolvedAt?: ISODate
}

/* ------------------------ Admins & Access ------------------------- */

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'support'

export interface Admin {
  id: ID
  name: string
  email: string
  role: AdminRole
  status: 'active' | 'suspended'
  lastActiveAt: ISODate
  createdAt: ISODate
}

/* ------------------------------ CMS ------------------------------- */

export type BannerPlacement = 'home_top' | 'explore' | 'product_store' | 'service_store'

export interface Banner {
  id: ID
  title: string
  imageUrl?: string
  placement: BannerPlacement
  isActive: boolean
  startsAt: ISODate
  endsAt: ISODate
}

export type ContentStatus = 'published' | 'draft'

/** Maps to the mobile app's "Other Pages" (Terms, Privacy, About…). */
export interface ContentPage {
  id: ID
  title: string
  status: ContentStatus
  /** Rich HTML body shown in the app. */
  content: string
  updatedAt: ISODate
}

export interface Faq {
  id: ID
  question: string
  answer: string
  category: string
  order: number
  isPublished: boolean
}

/* ---------------------------- Billing ----------------------------- */

export type TransactionStatus = 'paid' | 'failed' | 'refunded' | 'pending'

export interface Transaction {
  id: ID
  storeName: string
  planName: string
  amount: number
  currency: string
  status: TransactionStatus
  method: 'card' | 'mobile_banking' | 'wallet'
  invoiceNo: string
  createdAt: ISODate
}

/* --------------------------- Engagement --------------------------- */

export type AnnouncementAudience = 'all' | 'buyers' | 'sellers' | 'product_sellers' | 'service_sellers'
export type AnnouncementStatus = 'sent' | 'scheduled' | 'draft'

export interface Announcement {
  id: ID
  title: string
  body: string
  audience: AnnouncementAudience
  channel: 'push' | 'email' | 'in_app'
  status: AnnouncementStatus
  recipients: number
  sentAt?: ISODate
  createdAt: ISODate
}

/* -------------------------- Support ------------------------------- */

export type SupportStatus = 'open' | 'pending' | 'resolved'
export type SupportSender = 'customer' | 'agent'

export interface SupportMessage {
  id: ID
  ticketId: ID
  sender: SupportSender
  body: string
  sentAt: ISODate
}

/** A customer support conversation shown in the admin inbox. */
export interface SupportTicket {
  id: ID
  customerName: string
  customerEmail: string
  subject: string
  status: SupportStatus
  lastMessage: string
  lastMessageAt: ISODate
  /** Unread inbound (customer) messages awaiting an agent reply. */
  unread: number
  messageCount: number
  createdAt: ISODate
}

/* ----------------------------- Audit ------------------------------ */

export interface AuditLog {
  id: ID
  actorName: string
  action: string
  targetType: string
  targetName: string
  createdAt: ISODate
}
