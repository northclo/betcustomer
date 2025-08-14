import { createRouter, createWebHistory } from 'vue-router';

const Home = () => import('./views/Home.vue');

const routes = [
  {
    path: '/home',
    redirect: '/',
    meta: { breadcrumb: 'Home' }
  },
  {
    path: '/',
    name: 'home',
    component: Home,
    meta: { breadcrumb: 'Home' }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkActiveClass: 'active'
});

export default router;