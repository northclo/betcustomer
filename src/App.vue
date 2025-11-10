<template>
  <div id="app">
    <MainHeader v-if="routerReady && !isAuthPage" />
    <a-layout-content v-if="routerReady" style="min-height: 80vh" class="main-container">
      <router-view />
    </a-layout-content>
  </div>
</template>

<script>
import MainHeader from './components/Headers/MainHeader.vue';
import { useRoute, useRouter } from 'vue-router';
import { computed, ref } from 'vue';

export default {
  name: 'App',
  components: {
    MainHeader,
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

    const isAuthPage = computed(() => route.path.startsWith('/auth'));

    router
      .isReady()
      .then(() => {
        routerReady.value = true;
      })
      .catch((error) => {
        console.error('Router failed to initialize before mount', error);
        routerReady.value = true;
      });

    return { isAuthPage, routerReady };
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
