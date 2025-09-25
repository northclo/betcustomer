<template>
  <div id="app">
    <MainHeader v-if="!isAuthPage" />
    <a-layout-content style="min-height: 80vh" class="main-container">
      <router-view />
    </a-layout-content>
  </div>
</template>

<script>
import MainHeader from './components/Headers/MainHeader.vue';
import { useRoute } from 'vue-router';
import { computed } from 'vue';

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

    const isAuthPage = computed(() => route.path.startsWith('/auth'));

    return { isAuthPage };
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
