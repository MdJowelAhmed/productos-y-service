import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  BadgeDollarSign,
  Receipt,
  Tags,
  Megaphone,
  Settings,
  ShieldAlert,
  Image,
  FileText,
  HelpCircle,
  UserCog,
  ScrollText,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Exact match only (used for the dashboard index route). */
  end?: boolean
  /** Optional badge key resolved at render time (e.g. open reports count). */
  badgeKey?: 'reports'
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/** Sidebar navigation — grouped to mirror the marketplace's domains. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Marketplace',
    items: [
      { label: 'Users', to: ROUTES.users, icon: Users },
      { label: 'Stores', to: ROUTES.stores, icon: Store },
      { label: 'Categories', to: ROUTES.categories, icon: Tags },
    ],
  },
  {
    title: 'Moderation',
    items: [{ label: 'Reports', to: ROUTES.reports, icon: ShieldAlert, badgeKey: 'reports' }],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Subscriptions', to: ROUTES.subscriptions, icon: CreditCard },
      { label: 'Subscription Plans', to: ROUTES.plans, icon: BadgeDollarSign },
      { label: 'Transactions', to: ROUTES.transactions, icon: Receipt },
    ],
  },
  {
    title: 'Content (CMS)',
    items: [
      { label: 'Banners', to: ROUTES.banners, icon: Image },
      { label: 'Pages', to: ROUTES.pages, icon: FileText },
      { label: 'FAQs', to: ROUTES.faqs, icon: HelpCircle },
    ],
  },
  {
    title: 'Engagement',
    items: [{ label: 'Announcements', to: ROUTES.announcements, icon: Megaphone }],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Admins', to: ROUTES.admins, icon: UserCog },
      { label: 'Audit Log', to: ROUTES.auditLog, icon: ScrollText },
      { label: 'Settings', to: ROUTES.settings, icon: Settings },
    ],
  },
]
