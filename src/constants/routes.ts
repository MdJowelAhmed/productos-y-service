/** Centralized route paths — the single source of truth for navigation. */
export const ROUTES = {
  login: '/login',

  dashboard: '/',

  users: '/users',
  userDetail: (id = ':id') => `/users/${id}`,

  stores: '/stores',
  storeDetail: (id = ':id') => `/stores/${id}`,

  categories: '/categories',

  // Billing
  subscriptions: '/subscriptions',
  plans: '/plans',
  transactions: '/transactions',

  // CMS
  banners: '/cms/banners',
  pages: '/cms/pages',
  faqs: '/cms/faqs',

  // Engagement
  support: '/support',
  announcements: '/announcements',

  // Administration
  admins: '/admins',
  settings: '/settings',
} as const
