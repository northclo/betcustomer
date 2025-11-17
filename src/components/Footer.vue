<template>
  <a-layout-footer v-if="copywriter" class="site-footer">
    <div class="footer-content">
      <a-typography-text class="footer-text">
        {{ copywriter }}
      </a-typography-text>
    </div>
  </a-layout-footer>
</template>

<script setup>
import { computed, inject } from 'vue';

defineOptions({
  name: 'SiteFooter'
});

const siteText = inject('siteText', { value: {} });

const copywriter = computed(() => {
  return siteText.value?.copywriter || '';
});
</script>

<style scoped>
.site-footer {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border-top: 1px solid var(--glass-border);
  padding: 16px 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  text-align: center;
}

.footer-text {
  color: var(--white-color);
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.6;
}
</style>

