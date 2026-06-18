/** Centralized route paths — the single source of truth for navigation. */
export const ROUTES = {
  login: '/login',

  dashboard: '/',

  users: '/users',
  userDetail: (id = ':id') => `/users/${id}`,

  stores: '/stores',
  storeDetail: (id = ':id') => `/stores/${id}`,

  categories: '/categories',

  // Moderation
  reports: '/reports',

  // Billing
  subscriptions: '/subscriptions',
  plans: '/plans',
  transactions: '/transactions',

  // CMS
  banners: '/cms/banners',
  pages: '/cms/pages',
  faqs: '/cms/faqs',

  // Engagement
  announcements: '/announcements',

  // Administration
  admins: '/admins',
  auditLog: '/audit-log',
  settings: '/settings',
} as const
