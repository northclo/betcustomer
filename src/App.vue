<template>
  <div id="app">
    <SimpleText 
      v-if="routerReady && siteDisabled && disableStyle === 'simple_text'"
      :deactive-message="deactiveMessage"
    />
    <LoginBox 
      v-else-if="routerReady && siteDisabled && disableStyle === 'login_box'"
      :deactive-message="deactiveMessage"
    />
    <PageNotFound 
      v-else-if="routerReady && siteDisabled && disableStyle === 'page_not_found'"
      :deactive-message="deactiveMessage"
    />
    
    <template v-else-if="routerReady && !siteDisabled">
      <div v-if="!isAuthPage">
        <MainHeader />
        <BannerCard
          :loading="bannerLoading"
          :today-no="todayNo"
          :total-no="totalNo"
          :own-money="ownMoney"
          :remain-time="remainTime"
          @update:remain-time="(val) => (remainTime = val)"
        />
      </div>
      <a-layout-content style="min-height: 80vh" class="main-container">
        <router-view />
      </a-layout-content>
      <SiteFooter v-if="!isAuthPage" />
    </template>
  </div>
</template>

<script>
import MainHeader from './components/Headers/MainHeader.vue';
import BannerCard from './components/Headers/BannerCard.vue';
import SiteFooter from './components/Footer.vue';
import SimpleText from './components/SiteDisabled/SimpleText.vue';
import LoginBox from './components/SiteDisabled/LoginBox.vue';
import PageNotFound from './components/SiteDisabled/PageNotFound.vue';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, onBeforeUnmount, watch, provide, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link';
import { socket } from '@/plugins/socket.js';

export default {
  name: 'App',
  components: {
    MainHeader,
    BannerCard,
    SiteFooter,
    SimpleText,
    LoginBox,
    PageNotFound,
  },
  provide() {
    return {
      langState: this,
    };
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const routerReady = ref(false);

    const siteDisabled = ref(false);
    const disableStyle = ref('simple_text');
    const deactiveMessage = ref('');
    const siteText = ref({
      site_name: '',
      title_bar: '',
      copywriter: '',
      top_notify_message: '',
      deposit_account: '',
    });
    const membershipSettings = ref({
      membership_registration: 'recommender',
      membership_approval: true,
      membership_signup_message: '',
    });

    const bannerLoading = ref(false);
    const remainTime = ref(0);
    const todayNo = ref(0);
    const totalNo = ref(0);
    const ownMoney = ref(0);

    const isAuthPage = computed(() => route.path.startsWith('/auth'));

    const checkSiteActivation = async () => {
      try {
        const result = await getData(apiLink.get_site_setting);
        if (result.status && result.data) {
          siteDisabled.value = !result.data.site_activation;
          disableStyle.value = result.data.disable_style;
          deactiveMessage.value = result.data.deactive_message;
          
          siteText.value = {
            site_name: result.data.site_name,
            title_bar: result.data.title_bar,
            copywriter: result.data.copywriter,
            top_notify_message: result.data.top_notify_message,
            deposit_account: result.data.deposit_account,
          };
          
          membershipSettings.value = {
            membership_registration: result.data.membership_registration,
            membership_approval: result.data.membership_approval,
            membership_signup_message: result.data.membership_signup_message,
          };
          
          if (siteText.value.title_bar) {
            document.title = siteText.value.title_bar;
          }
          
          if (siteText.value.top_notify_message) {
            const messages = siteText.value.top_notify_message
              .split('\n')
              .filter(line => line.trim().length > 0);
            messages.forEach(msg => {
              message.info(msg.trim(), 5);
            });
          }
          
          if (siteDisabled.value && deactiveMessage.value) {
            message.warning(deactiveMessage.value);
          }
        }
      } catch (error) {
        console.error('Error checking site activation:', error);
        siteDisabled.value = false;
      }
    };

    const fetchBannerData = async () => {
      if (isAuthPage.value) return;
      
      bannerLoading.value = true;
      try {
        const result = await getData(`${apiLink.get_betting_info}?gameId=`);
        if (result.status && result.data) {
          const { game, user } = result.data;
          if (game) {
            remainTime.value = game.remain_time || 0;
            todayNo.value = game.today_no || 0;
            totalNo.value = game.total_no || 0;
          }
          if (user) {
            ownMoney.value = user.own_money || 0;
          }
        }
      } catch (error) {
        console.error('Error fetching banner data:', error);
      } finally {
        bannerLoading.value = false;
      }
    };

    // Socket event handlers
    const handleStartGame = () => {
      fetchBannerData();
    };

    const handleEndGame = () => {
      fetchBannerData();
    };

    router
      .isReady()
      .then(async () => {
        await checkSiteActivation();
        routerReady.value = true;
        
        if (!isAuthPage.value && !siteDisabled.value) {
          fetchBannerData();
          socket.on('start_game', handleStartGame);
          socket.on('end_game', handleEndGame);
        }
      })
      .catch(async (error) => {
        console.error('Router failed to initialize before mount', error);
        await checkSiteActivation();
        routerReady.value = true;
        
        if (!isAuthPage.value && !siteDisabled.value) {
          fetchBannerData();
          socket.on('start_game', handleStartGame);
          socket.on('end_game', handleEndGame);
        }
      });

    watch(
      () => route.path,
      (newPath) => {
        if (!newPath.startsWith('/auth') && routerReady.value && !siteDisabled.value) {
          fetchBannerData();
        }
      },
      { immediate: false }
    );

    let siteCheckInterval = null;
    onMounted(() => {
      siteCheckInterval = setInterval(() => {
        checkSiteActivation();
      }, 30000);
    });

    onBeforeUnmount(() => {
      socket.off('start_game', handleStartGame);
      socket.off('end_game', handleEndGame);
      if (siteCheckInterval) {
        clearInterval(siteCheckInterval);
      }
    });

    provide('updateBannerMoney', (amount) => {
      ownMoney.value = amount;
    });

    provide('updateBannerGameData', (gameData) => {
      if (gameData.remainTime !== undefined) remainTime.value = gameData.remainTime;
      if (gameData.todayNo !== undefined) todayNo.value = gameData.todayNo;
      if (gameData.totalNo !== undefined) totalNo.value = gameData.totalNo;
      if (gameData.ownMoney !== undefined) ownMoney.value = gameData.ownMoney;
    });

    provide('siteText', siteText);
    provide('membershipSettings', membershipSettings);

    return { 
      isAuthPage, 
      routerReady,
      siteDisabled,
      disableStyle,
      deactiveMessage,
      siteText,
      membershipSettings,
      bannerLoading,
      remainTime,
      todayNo,
      totalNo,
      ownMoney,
    };
  },
  data() {
    return {
      currentLang: 'en',
      translations: {},
    };
  },
  mounted() {
    this.loadLanguage(this.currentLang);
  },
  methods: {
    async loadLanguage(lang) {
      try {
        const langmodule = await import(`@/lang/${lang}.js`);
        this.translations = langmodule.default;
      } catch (e) {
        console.error(`Failed to load language ${lang}`, e);
      }
    },
  },
};
</script>
