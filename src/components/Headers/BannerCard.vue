<template>
  <div class="main-container mt-2 mb-2">
    <div class="glass-banner">
      <a-flex justify="space-between" align="center" wrap="wrap">
        <a-flex class="p-2" gap="small" align="center" wrap="nowrap">
          <a-typography-text class="sp-icon mb-0 white-space-nowrap">
            {{ trlang.game_index }}
          </a-typography-text>
          <a-flex align="center" gap="small" wrap="nowrap">
            <a-typography-text class="fs-2 font-bold text-pink">
              {{ totalNo }} {{ trlang.index_unit }}
            </a-typography-text>
            <a-typography-text class="fs-3 font-bold text-white">
              ({{ trlang.per_day }} {{ todayNo }} {{ trlang.index_unit }})
            </a-typography-text>
          </a-flex>
        </a-flex>

        <a-flex class="p-2" gap="small" align="center" wrap="nowrap">
          <a-typography-text class="sp-icon mb-0 white-space-nowrap">
            {{ trlang.time_intro }}
          </a-typography-text>
          <a-flex class="fs-3 text-white" align="center" gap="small" wrap="nowrap">
            {{ formattedTime }}
            <span class="fs-1 text-warning">{{ counterText }}</span>
          </a-flex>
        </a-flex>

        <a-flex class="p-2" align="center" gap="small" wrap="nowrap">
          <a-typography-text class="sp-icon mb-0 white-space-nowrap">
            {{ trlang.store_amount }}
          </a-typography-text>
          <a-flex class="fs-2 text-light-green" align="center" wrap="nowrap">
            {{ ownMoney.toLocaleString() }} {{ trlang.currency }}
          </a-flex>
        </a-flex>

        <a-flex align="center" wrap="nowrap">
          <a
            :href="trlang.store_name_link"
            target="_blank"
            class="flex items-center"
          >
            <a-image src="/icons/sp.png" />
            <a-typography-text class="text-white fs-4 ms-2">
              {{ trlang.store_name }}
            </a-typography-text>
          </a>
        </a-flex>

        <a-flex class="p-2" align="center" gap="small" wrap="nowrap">
          <a-image src="/icons/msg-icon.png" />
          <a-typography-text class="text-white fs-3">
            0
          </a-typography-text>
        </a-flex>
      </a-flex>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const props = defineProps({
  loading: { type: Boolean, default: false },
  todayNo: { type: Number, default: 0 },
  totalNo: { type: Number, default: 0 },
  ownMoney: { type: Number, default: 0 },
  remainTime: { type: Number, default: 0 },
});

const formattedTime = ref('');
const counterText = ref('00:00');
let clockInterval = null;
const remain = ref(0);

function updateTokyoTime() {
  formattedTime.value = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

function updateCounter() {
  if (remain.value > 0) {
    remain.value = Math.max(0, remain.value - 1);
  } else {
    remain.value = Math.max(0, props.remainTime || 0);
  }

  const minutes = String(Math.floor(remain.value / 60)).padStart(2, '0');
  const seconds = String(remain.value % 60).padStart(2, '0');
  counterText.value = `${minutes}:${seconds}`;
}

function startClock() {
  stopClock();
  
  remain.value = Math.max(0, props.remainTime || 0);
  
  updateCounter();
  updateTokyoTime();

  clockInterval = setInterval(() => {
    updateTokyoTime();
    updateCounter();
  }, 1000);
}

function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

onMounted(startClock);
onBeforeUnmount(stopClock);

watch(
  () => [props.remainTime, props.loading],
  () => {
    remain.value = Math.max(0, props.remainTime || 0);
    startClock();
  }
);
</script>

<style scoped>
.glass-banner {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border-light);
  border-radius: 4px;
}
</style>
