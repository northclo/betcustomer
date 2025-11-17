<template>
  <a-layout class="flex justify-center items-center h-100vh bg-none">
    <a-space direction="vertical" size="large" class="w-100" style="max-width: 600px; text-align: center">
      <a-typography-title :level="1" class="text-white" style="font-size: 72px; margin: 0">
        404
      </a-typography-title>
      <a-typography-title :level="2" class="text-white">
        {{ trlang.page_not_found }}
      </a-typography-title>
      <a-typography-paragraph class="text-white" style="font-size: 16px; white-space: pre-line">
        {{ trlang.page_not_found_message }}
      </a-typography-paragraph>
      <a-button 
        class="bg-primary text-white" 
        @click="goToLogin"
        v-if="!isLoginPage"
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

