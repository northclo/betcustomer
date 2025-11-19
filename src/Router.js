import { createRouter, createWebHistory } from 'vue-router';

const ENABLE_AUTHENTICATION = true;

const HomePage = () => import('./views/HomePage.vue');
const LoginPage = () => import('./views/LoginPage.vue');
const RegisterPage = () => import('./views/RegisterPage.vue');
const BetHistoryPage = () => import('./views/BetHistoryPage.vue');
const AddFundPage = () => import('./views/AddFundPage.vue');
const ExchangePage = () => import('./views/ExchangePage.vue');
const CustomerCenterPage = () => import('./views/CustomerCenterPage.vue');
const NoticeListPage = () => import('./views/NoticeListPage.vue');

const routes = [
  {
    path: '/home',
    redirect: '/',
    meta: { breadcrumb: 'Home', requiresAuth: true }
  },
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { breadcrumb: 'Home', requiresAuth: true }
  },
  {
    path: '/bethistory',
    name: 'betHistory',
    component: BetHistoryPage,
    meta: { breadcrumb: 'Bet History', requiresAuth: true }
  },
  {
    path: '/addfund',
    name: 'addFund',
    component: AddFundPage,
    meta: { breadcrumb: 'Add Funds', requiresAuth: true }
  },
  {
    path: '/exchange',
    name: 'exchange',
    component: ExchangePage,
    meta: { breadcrumb: 'Money Exchange', requiresAuth: true }
  },
  {
    path: '/notice',
    name: 'notice',
    component: NoticeListPage,
    meta: { breadcrumb: 'Notice List', requiresAuth: true }
  },
  {
    path: '/contact',
    name: 'contact',
    component: CustomerCenterPage,
    meta: { breadcrumb: 'Contact Us', requiresAuth: true }
  },
  {
    path: '/auth/login',
    name: 'login',
    component: LoginPage,
    meta: { breadcrumb: 'Login', requiresAuth: false }
  },
  {
    path: '/auth/register',
    name: 'register',
    component: RegisterPage,
    meta: { breadcrumb: 'Register', requiresAuth: false }
  }
];

const decodeJwtPayload = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decodeBase64 = (value) => {
      if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        return window.atob(value);
      }
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(value, 'base64').toString('binary');
      }
      throw new Error('No base64 decoder available');
    };

    const decoded = decodeBase64(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode token payload', error);
    return null;
  }
};

const isTokenValid = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return false;
  }

  return true;
};

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: 'active'
});

router.beforeEach((to, from, next) => {
  if (!ENABLE_AUTHENTICATION) {
    return next();
  }

  const requiresAuth = to.meta.requiresAuth !== false;
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const tokenValid = isTokenValid(token);

  if (requiresAuth && !tokenValid) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath }
    });
  }

  if (to.name === 'login' && tokenValid) {
    return next({ path: '/' });
  }

  return next();
});

export default router;