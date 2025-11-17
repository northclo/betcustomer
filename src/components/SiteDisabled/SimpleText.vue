<template>
  <a-layout class="flex justify-center items-center h-100vh bg-none">
    <a-space direction="vertical" size="large" class="w-100" style="max-width: 600px; text-align: center">
      <a-typography-title :level="2" class="text-white">
        {{ trlang.site_temporarily_unavailable }}
      </a-typography-title>
      <a-typography-paragraph class="text-white" style="font-size: 16px; white-space: pre-line">
        {{ trlang.site_is_currently_disabled }}
      </a-typography-paragraph>
    </a-space>
  </a-layout>
</template>

<script setup>
import { inject, computed } from 'vue';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});
</script>

