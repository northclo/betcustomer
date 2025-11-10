<template>
  <div class="glass-banner mt-5">
    <a-flex justify="space-between" align="center" wrap="wrap">
      <!-- Game Index -->
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

      <!-- Timer -->
      <a-flex class="p-2" gap="small" align="center" wrap="nowrap">
        <a-typography-text class="sp-icon mb-0 white-space-nowrap">
          {{ trlang.time_intro }}
        </a-typography-text>
        <a-flex class="fs-3 text-white" align="center" gap="small" wrap="nowrap">
          {{ formattedTime }}
          <span class="fs-1 text-warning">{{ counterText }}</span>
        </a-flex>
      </a-flex>

      <!-- Store Amount -->
      <a-flex class="p-2" align="center" gap="small" wrap="nowrap">
        <a-typography-text class="sp-icon mb-0 white-space-nowrap">
          {{ trlang.store_amount }}
        </a-typography-text>
        <a-flex class="fs-2 text-light-green" align="center" wrap="nowrap">
          {{ ownMoney.toLocaleString() }} {{ trlang.currency }}
        </a-flex>
      </a-flex>

      <!-- Store Link -->
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

      <!-- Partner Dashboard -->
      <!-- <div class="p-2">
        <div class="text-white">
          Test
        </div>
        <button class="bg-white cursor-pointer">
          {{ trlang.partner_dashboard }}
        </button>
      </div> -->

      <!-- Messages -->
      <a-flex class="p-2" align="center" gap="small" wrap="nowrap">
        <a-image src="/icons/msg-icon.png" />
        <a-typography-text class="text-white fs-3">
          0
        </a-typography-text>
      </a-flex>
    </a-flex>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

// ✅ props & emits
const props = defineProps({
  loading: { type: Boolean, default: false },
  todayNo: { type: Number, default: 0 },
  totalNo: { type: Number, default: 0 },
  ownMoney: { type: Number, default: 0 },
  remainTime: { type: Number, default: 0 },
});
const emit = defineEmits(['update:remainTime']);

// ✅ state
const formattedTime = ref('');
const counterText = ref('00:00');
let clockInterval = null;
const remain = ref(props.remainTime);

// ✅ update Tokyo Time
function updateTokyoTime() {
  formattedTime.value = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date());
}

// ✅ update Counter
function updateCounter() {
  if (remain.value > 0) {
    remain.value -= 1;
    emit('update:remainTime', remain.value);

    const minutes = String(Math.floor(remain.value / 60)).padStart(2, '0');
    const seconds = String(remain.value % 60).padStart(2, '0');
    counterText.value = `${minutes}:${seconds}`;
  }
}

// ✅ start clock
function startClock() {
  stopClock();
  remain.value = props.remainTime;

  // Timer shows for 3 minutes (180 seconds)
  if (remain.value > 0 && remain.value <= 180 && !props.loading) {
    const minutes = String(Math.floor(remain.value / 60)).padStart(2, '0');
    const seconds = String(remain.value % 60).padStart(2, '0');
    counterText.value = `${minutes}:${seconds}`;
  } else {
    counterText.value = '00:00';
  }

  updateTokyoTime();

  clockInterval = setInterval(() => {
    updateTokyoTime();
    updateCounter();
  }, 1000);
}

// ✅ stop clock
function stopClock() {
  if (clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }
}

// ✅ lifecycle
onMounted(startClock);
onBeforeUnmount(stopClock);

// ✅ watch remainTime & loading reset
watch(
  () => [props.remainTime, props.loading],
  () => {
    startClock();
  }
);
</script>

<style scoped>
.glass-banner {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border: 1px solid var(--glass-border-light);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--glass-shadow-strong);
}

.glass-banner:hover {
  box-shadow: var(--glass-shadow-strong), 0 0 40px rgba(99, 102, 241, 0.15);
}
</style>
