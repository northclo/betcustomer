<template>
  <div id="app">
    <div v-if="routerReady && !isAuthPage">
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
    <a-layout-content v-if="routerReady" style="min-height: 80vh" class="main-container">
      <router-view />
    </a-layout-content>
  </div>
</template>

<script>
import MainHeader from './components/Headers/MainHeader.vue';
import BannerCard from './components/Headers/BannerCard.vue';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref, onBeforeUnmount, watch, provide } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link';
import { socket } from '@/plugins/socket.js';

export default {
  name: 'App',
  components: {
    MainHeader,
    BannerCard,
  },
  provide() {
    return {
      langState: this, // we provide `this` so children can access both currentLang and translations
    };
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const routerReady = ref(false);

    // Banner data state
    const bannerLoading = ref(false);
    const remainTime = ref(0);
    const todayNo = ref(0);
    const totalNo = ref(0);
    const ownMoney = ref(0);

    const isAuthPage = computed(() => route.path.startsWith('/auth'));

    // Fetch game data for banner
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
      .then(() => {
        routerReady.value = true;
        if (!isAuthPage.value) {
          fetchBannerData();
          socket.on('start_game', handleStartGame);
          socket.on('end_game', handleEndGame);
        }
      })
      .catch((error) => {
        console.error('Router failed to initialize before mount', error);
        routerReady.value = true;
        if (!isAuthPage.value) {
          fetchBannerData();
          socket.on('start_game', handleStartGame);
          socket.on('end_game', handleEndGame);
        }
      });

    // Watch route changes to refetch data when navigating between authenticated pages
    watch(
      () => route.path,
      (newPath) => {
        if (!newPath.startsWith('/auth') && routerReady.value) {
          fetchBannerData();
        }
      },
      { immediate: false }
    );

    onBeforeUnmount(() => {
      socket.off('start_game', handleStartGame);
      socket.off('end_game', handleEndGame);
    });

    // Provide update functions for banner data
    provide('updateBannerMoney', (amount) => {
      ownMoney.value = amount;
    });

    provide('updateBannerGameData', (gameData) => {
      if (gameData.remainTime !== undefined) remainTime.value = gameData.remainTime;
      if (gameData.todayNo !== undefined) todayNo.value = gameData.todayNo;
      if (gameData.totalNo !== undefined) totalNo.value = gameData.totalNo;
      if (gameData.ownMoney !== undefined) ownMoney.value = gameData.ownMoney;
    });

    return { 
      isAuthPage, 
      routerReady,
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
