import { createRouter, createWebHashHistory } from 'vue-router';

const HomePage = () => import('./views/HomePage.vue');
const LoginPage = () => import('./views/LoginPage.vue');
const BetHistoryPage = () => import('./views/BetHistoryPage.vue');
const AddFundPage = () => import('./views/AddFundPage.vue');
const RefundPage = () => import('./views/RefundPage.vue');
const BlogPostPage = () => import('./views/BlogPostPage.vue');
const CustomerCenterPage = () => import('./views/CustomerCenterPage.vue');

const routes = [
  {
    path: '/home',
    redirect: '/',
    meta: { breadcrumb: 'Home' }
  },
  {
    path: '/',
    name: 'home',
    component: HomePage,
    meta: { breadcrumb: 'Home' }
  },
  {
    path: '/bethistory',
    name: 'betHistory',
    component: BetHistoryPage,
    meta: { breadcrumb: 'Bet History' }
  },
  {
    path: '/addfund',
    name: 'addFund',
    component: AddFundPage,
    meta: { breadcrumb: 'Add Funds' }
  },
  {
    path: '/refund',
    name: 'refund',
    component: RefundPage,
    meta: { breadcrumb: 'Withdraw Funds' }
  },
  {
    path: '/blog',
    name: 'blog',
    component: BlogPostPage,
    meta: { breadcrumb: 'News & Updates' }
  },
  {
    path: '/customer-center',
    name: 'customerCenter',
    component: CustomerCenterPage,
    meta: { breadcrumb: 'Customer Support' }
  },
  {
    path: '/auth/login',
    name: 'login',
    component: LoginPage,
    meta: { breadcrumb: 'Login' }
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: 'active'
});

export default router;