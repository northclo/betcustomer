<template>
  <div class="header-wrapper">
    <a-layout-header class="main-container">
      <a-flex class="AppBarBtns" justify="space-between" align="center">
        <!-- href="/about/" -->
        <div class="AppBarBtnsSub">
          <button class="menu-btn" @click="gotoAbout">
            {{ trlang.game_menu }}
          </button>
          <button class="menu-btn" @click="gotoAbout">
            {{ trlang.bethistory_menu }}
          </button>
          <button class="menu-btn" @click="gotoResorts">
            {{ trlang.addfund_menu }}
          </button>
          <button class="menu-btn" @click="gotoInspirations">
            {{ trlang.refund_menu }}
          </button>
          <button class="menu-btn" @click="gotoBestOffers">
            {{ trlang.blog_menu }}
          </button>
          <button class="menu-btn" @click="gotoContact">
            {{ trlang.customer_center_menu }}
          </button>
        </div>
        <div class="LoginBtns">
          <div class="log-out-btn">
            <a @click="logout">{{ trlang.logout }}</a>
          </div>
        </div>
      </a-flex>
    </a-layout-header>
  </div>
</template>

<script>
import { api } from '../../helpers/Api';
import { common } from '../../helpers/Common';

export default {
  name: 'MainHeader',
  inject: ['langState'],
  props: {},
  data() {
    return {
      top: 0,
      userInfo: {
        name: '',
      },
    };
  },
  computed: {
    trlang() {
      return this.langState.translations;
    },
  },
  methods: {
    getLogo: async function () {
      const res = await api.getLogoInfo();
      if (res.length > 0) {
        this.logoImage = `${res[0].logoimage}`;
        this.logoName = res[0].logoname;
      }
    },
    showMenu() {
      this.visibleMenu = true;
    },
    onCloseMenu() {
      this.visibleMenu = false;
    },
    gotoAbout() {
      this.$router.push({ path: '/about/' });
      this.visibleMenu = false;
    },
    gotoResorts() {
      this.$router.push({ path: '/resorts/' });
      this.visibleMenu = false;
    },
    gotoInspirations() {
      let routeData = this.$router.resolve({ path: '/inspiration/' });
      window.open(routeData.href, '_self');
      // this.$router.push({ path: '/inspiration/'})
      this.visibleMenu = false;
    },
    gotoBestOffers() {
      this.$router.push({ path: '/bestoffers/' });
      this.visibleMenu = false;
    },
    gotoContact() {
      this.$router.push({ path: '/contact/' });
      this.visibleMenu = false;
    },
    updateCurrencyDrop() {
      if (this.$store.state.selectedCurrency !== null) {
        this.selectedCurrrency = this.$store.state.selectedCurrency.name;
      } else {
        this.selectedCurrrency = 'USD';

        this.$store.commit('setCurrency', {
          code: 'us',
          name: 'USD',
          rate: 1.0,
          sign: '$',
        });
      }
    },

    handleProvinceChange(value) {
      const cellData = this.provinceData.filter((obj) => obj.name == value)[0];
      this.$store.commit('setCurrency', {
        code: cellData.code,
        name: value,
        rate: cellData.rate,
        sign: common.getSimbolFromCurrency(value),
      });
      this.$router.go(0);
    },
    onSearch() { },
    showLogin(_isShow) {
      this.visibleLogin = _isShow;
      this.visibleMenu = false;
      if (!_isShow) this.updateUserInfo();
    },
    showLoginSuccess() {
      this.visibleLoginSuccess = true;
      this.showLogin(false);
    },
    showSignup(_isShow) {
      this.visibleSignup = _isShow;
      this.visibleMenu = false;
      if (!_isShow) this.updateUserInfo();
    },
    showSuccess() {
      this.visibleSignup = false;
      this.visibleMenu = false;
      this.visibleSignUpSuccess = true;
      this.updateUserInfo();
    },
    showSuccessAgent() {
      this.visibleAgentSignup = false;
      this.visibleMenu = false;
      this.visibleSignUpSuccessAgent = true;
      this.updateUserInfo();
    },
    showForgot(_isShow) {
      this.visibleForgot = _isShow;
      this.visibleMenu = false;
      if (!_isShow) this.updateUserInfo();
    },
    showAgentSignup(_isShow) {
      this.visibleAgentSignup = _isShow;
    },
    closeShowSignup() {
      this.visibleLogin = false;
      this.visibleForgot = false;
      this.visibleSignup = true;
    },
    closeShowForgot() {
      this.visibleLogin = false;
      this.visibleSignup = false;
      this.visibleForgot = true;
      this.visibleAgentSignup = false;
    },
    closeShowLogin() {
      this.visibleLogin = true;
      this.visibleForgot = false;
      this.visibleSignup = false;
      this.visibleAgentSignup = false;
    },
    closeShowSignAgent() {
      this.visibleLogin = false;
      this.visibleSignup = false;
      this.visibleAgentSignup = true;
    },
    updateUserInfo() {
      if (this.$store.state.loginUser !== null) {
        if (this.$store.state.loginUser.loginType === 'api') {
          this.userInfo.name = this.$store.state.loginUser.api.user.name;
          this.userInfo.email = this.$store.state.loginUser.api.user.email;
          this.isLogin = true;
        } else if (this.$store.state.loginUser.loginType === 'google') {
          this.userInfo.name = this.$store.state.loginUser.google.user.name;
          this.userInfo.email = this.$store.state.loginUser.google.user.email;
          this.isLogin = true;
        } else if (this.$store.state.loginUser.loginType === 'fb') {
          this.userInfo.name = this.$store.state.loginUser.fb.user.name;
          this.isLogin = true;
        } else {
          this.userInfo.name = '';
          this.isLogin = false;
        }
      } else {
        this.userInfo.name = '';
        this.isLogin = false;
      }
    },
    logout() {
      // //   if (this.$store.state.loginUser.loginType === 'fb') {
      // //     window.FB.logout(function (response) {
      // //       // user is now logged out
      // //       console.log('fb logout', response);
      // //     });
      // //   }
      // this.visibleUserPanel = false;
      // this.$store.commit('setLoginUser', null);
      // this.updateUserInfo();
      localStorage.removeItem('token');
      this.$router.push({ path: '/auth/login' });
    },
    showConfirm() {
      this.$confirm({
        title: 'Do you want to logout?',
        content: 'When clicked the OK button, you logout!',
        onOk() {
          this.logout();
        },
        onCancel() { },
      });
    },
  },
};
</script>
