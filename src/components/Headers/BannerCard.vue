<template>
  <div class="glass-banner mt-3 mb-3">
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
const remain = ref(0);

// ✅ Calculate time until next 3-minute interval (betting site logic)
function calculateTimeToNextInterval() {
  const now = new Date();
  
  // Get Tokyo time components using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const minute = parseInt(parts.find(p => p.type === 'minute').value);
  const second = parseInt(parts.find(p => p.type === 'second').value);
  
  // Calculate total seconds elapsed in current hour
  const totalSecondsInHour = minute * 60 + second;
  
  // Find the next 3-minute interval (0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51, 54, 57)
  const currentInterval = Math.floor(minute / 3) * 3;
  const nextIntervalMinute = currentInterval + 3;
  
  // Calculate seconds until next interval
  let secondsUntilNext;
  if (nextIntervalMinute >= 60) {
    // Next interval is at minute 0 of the next hour (e.g., if current is 57, next is 00 of next hour)
    const secondsInCurrentHour = 3600 - totalSecondsInHour;
    secondsUntilNext = secondsInCurrentHour;
  } else {
    const nextIntervalSeconds = nextIntervalMinute * 60;
    secondsUntilNext = nextIntervalSeconds - totalSecondsInHour;
  }
  
  // If we're exactly at an interval mark (secondsUntilNext is 0 or very close), 
  // the next interval is 3 minutes (180 seconds) away
  if (secondsUntilNext <= 0) {
    return 180;
  }
  
  // Ensure we don't exceed 180 seconds (shouldn't happen, but safety check)
  return Math.min(secondsUntilNext, 180);
}

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
  // Recalculate time to next interval based on current time
  remain.value = calculateTimeToNextInterval();
  emit('update:remainTime', remain.value);

  const minutes = String(Math.floor(remain.value / 60)).padStart(2, '0');
  const seconds = String(remain.value % 60).padStart(2, '0');
  counterText.value = `${minutes}:${seconds}`;
}

// ✅ start clock
function startClock() {
  stopClock();
  
  // Calculate initial time to next 3-minute interval
  remain.value = calculateTimeToNextInterval();
  
  // Update counter display
  updateCounter();
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
  padding: 12px 16px;
  box-shadow: var(--glass-shadow-strong);
  max-width: calc(1700px - 0px);
  margin: 0 auto;
  margin-left: 8px;
  margin-right: 8px;
  margin-top: 12px;
}

@media (min-width: 1216px) {
  .glass-banner {
    margin-left: auto;
    margin-right: auto;
  }
}

.glass-banner:hover {
  box-shadow: var(--glass-shadow-strong);
}
</style>
