<template>
  <a-layout class="flex justify-center items-center h-100vh bg-none">
    <a-space
      direction="vertical"
      size="middle"
      class="w-100"
      style="max-width: 400px"
    >
      <div>
        <a-typography-title :level="2" class="text-white text-center">
          {{ trlang.running_ball }}
        </a-typography-title>
        <a-typography-title :level="5" class="text-white text-center m-auto">
          {{ trlang.site_temporarily_unavailable }}
        </a-typography-title>
      </div>

      <a-typography-paragraph class="text-white text-center" style="white-space: pre-line">
        {{ trlang.site_is_currently_disabled }}
      </a-typography-paragraph>

      <a-button 
        v-if="!isLoginPage"
        class="w-100 bg-primary text-white" 
        @click="goToLogin"
      >
        {{ trlang.go_to_login }}
      </a-button>
    </a-space>
  </a-layout>
</template>

<script setup>
import { inject, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const isLoginPage = computed(() => route.path.startsWith('/auth/login'));

const goToLogin = () => {
  router.push('/auth/login');
};
</script>

