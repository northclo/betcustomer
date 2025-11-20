<template>
  <div class="header-wrapper">
    <a-layout-header class="main-container">
      <a-flex
        class="AppBarBtns"
        justify="space-between"
        align="center"
        :wrap="isMobileView ? 'nowrap' : 'wrap'"
      >
        <button
          v-if="isMobileView"
          type="button"
          class="mobile-menu-toggle"
          :class="{ 'is-open': isMobileMenuOpen }"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="main-header-drawer"
          @click="toggleMobileMenu"
        >
          <span class="sr-only">{{ trlang.toggle_navigation }}</span>
          <span class="mobile-menu-toggle__bar" />
          <span class="mobile-menu-toggle__bar" />
          <span class="mobile-menu-toggle__bar" />
        </button>
        <!-- <div v-if="siteName" class="site-name">
          <a-typography-text class="site-name-text">
            {{ siteName }}
          </a-typography-text>
        </div> -->
        <!-- Desktop navigation -->
        <div
          v-if="!isMobileView"
          id="main-header-nav"
          class="AppBarMenu"
        >
          <div class="AppBarBtnsSub">
            <button
              class="menu-btn white-space-nowrap"
              :class="{ 'menu-btn-active': currentRoute === '/' }"
              @click="navigateTo('/')"
            >
              {{ trlang.game_menu }}
            </button>
            <button
              class="menu-btn white-space-nowrap"
              :class="{ 'menu-btn-active': currentRoute === '/bethistory' }"
              @click="navigateTo('/bethistory')"
            >
              {{ trlang.bethistory_menu }}
            </button>
            <button
              class="menu-btn white-space-nowrap"
              :class="{ 'menu-btn-active': currentRoute === '/addfund' }"
              @click="navigateTo('/addfund')"
            >
              {{ trlang.addfund_menu }}
            </button>
            <button
              class="menu-btn white-space-nowrap"
              :class="{ 'menu-btn-active': currentRoute === '/exchange' }"
              @click="navigateTo('/exchange')"
            >
              {{ trlang.exchange_menu }}
            </button>
            <button
              class="menu-btn white-space-nowrap"
              :class="{ 'menu-btn-active': currentRoute === '/contact' }"
              @click="navigateTo('/contact')"
            >
              {{ trlang.customer_center_menu }}
            </button>
            <button
              class="menu-btn white-space-nowrap"
              :class="{ 'menu-btn-active': currentRoute === '/notice' }"
              @click="navigateTo('/notice')"
            >
              {{ trlang.notice_menu }}
            </button>
          </div>
        </div>
        <div class="LoginBtns">
          <div class="log-out-btn">
            <a @click="logout">{{ trlang.logout }}</a>
          </div>
        </div>
      </a-flex>
      <a-drawer
        v-if="isMobileView"
        :open="isMobileMenuOpen"
        placement="left"
        :width="drawerWidth"
        :title="trlang.menu"
        class="header-mobile-drawer"
        :mask-closable="true"
        :destroy-on-close="false"
        :body-style="{ padding: '16px 0' }"
        :z-index="1000"
        @close="closeMobileMenu"
      >
        <a-menu
          mode="inline"
          :selected-keys="[currentRoute]"
          @click="handleMenuItemClick"
        >
          <a-menu-item key="/">
            {{ trlang.game_menu }}
          </a-menu-item>
          <a-menu-item key="/bethistory">
            {{ trlang.bethistory_menu }}
          </a-menu-item>
          <a-menu-item key="/addfund">
            {{ trlang.addfund_menu }}
          </a-menu-item>
          <a-menu-item key="/exchange">
            {{ trlang.exchange_menu }}
          </a-menu-item>
          <a-menu-item key="/contact">
            {{ trlang.customer_center_menu }}
          </a-menu-item>
          <a-menu-item key="/notice">
            {{ trlang.notice_menu }}
          </a-menu-item>
        </a-menu>
        <div class="drawer-footer">
          <a-button block type="primary" ghost @click="handleLogoutFromDrawer">
            {{ trlang.logout }}
          </a-button>
        </div>
      </a-drawer>
    </a-layout-header>
  </div>
</template>

<script>
export default {
  name: 'MainHeader',
  inject: ['langState', 'siteText'],
  props: {},
  data() {
    return {
      isMobileMenuOpen: false,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
      drawerWidth: 280,
    };
  },
  computed: {
    trlang() {
      return this.langState?.translations || {};
    },
    siteName() {
      return this.siteText?.site_name || '';
    },
    currentRoute() {
      return this.$route.path;
    },
    isMobileView() {
      return this.windowWidth < 992;
    },
  },
  watch: {
    isMobileView(newVal) {
      if (!newVal) {
        this.isMobileMenuOpen = false;
      }
    },
    currentRoute() {
      this.closeMobileMenu();
    },
  },
  mounted() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
      this.handleResize();
    }
  },
  beforeUnmount() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      this.$router.push({ path: '/auth/login' });
      this.closeMobileMenu();
    },
    toggleMobileMenu() {
      if (!this.isMobileView) return;
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    closeMobileMenu() {
      this.isMobileMenuOpen = false;
    },
    navigateTo(path) {
      if (!path) return;
      if (this.$route.path === path) {
        this.closeMobileMenu();
        return;
      }
      this.$router.push({ path });
      this.closeMobileMenu();
    },
    handleResize() {
      if (typeof window === 'undefined') return;
      this.windowWidth = window.innerWidth;
      if (this.isMobileView) {
        const calculatedWidth = Math.floor(this.windowWidth * 0.85);
        this.drawerWidth = Math.min(320, Math.max(240, calculatedWidth));
      } else {
        this.drawerWidth = 280;
      }
      if (this.windowWidth >= 992 && this.isMobileMenuOpen) {
        this.isMobileMenuOpen = false;
      }
    },
    handleMenuItemClick({ key }) {
      this.navigateTo(key);
    },
    handleLogoutFromDrawer() {
      this.closeMobileMenu();
      this.logout();
    },
  },
};
</script>
