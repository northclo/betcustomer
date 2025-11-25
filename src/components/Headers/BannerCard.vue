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
            <!-- eslint-disable-next-line vue/html-self-closing -->
            <img src="/icons/sp.png" alt="" />
            <a-typography-text class="text-white fs-4 ms-2">
              {{ trlang.store_name }}
            </a-typography-text>
          </a>
        </a-flex>

        <a-flex 
          class="p-2 notice-badge" 
          align="center" 
        >
          <a
            href="/notice"
            class="flex items-center gap-2"
          >
            <!-- eslint-disable-next-line vue/html-self-closing -->
            <img src="/icons/msg-icon.png" alt="" />
            <a-typography-text class="text-white fs-3">
              {{ noticeCount }}
            </a-typography-text>
          </a>
        </a-flex>
      </a-flex>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';
import { getCurrentTime } from '@/helpers/Common.js';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const props = defineProps({
  loading: { type: Boolean, default: false },
  todayNo: { type: Number, default: 0 },
  totalNo: { type: Number, default: 0 },
  ownMoney: { type: Number, default: 0 },
  targetTimestamp: { type: Number, default: 0 },
  serverTimeOffset: { type: Number, default: 0 },
});

const formattedTime = ref('');
const counterText = ref('00:00');
let clockInterval = null;
const noticeCount = ref(0);

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
  console.log('updateCounter called:', {
    targetTimestamp: props.targetTimestamp,
    serverTimeOffset: props.serverTimeOffset,
    loading: props.loading
  });
  
  if (!props.targetTimestamp || props.targetTimestamp <= 0) {
    counterText.value = '00:00';
    console.log('Counter set to 00:00 - targetTimestamp is invalid:', props.targetTimestamp);
    return;
  }

  const serverTime = getCurrentTime() + (props.serverTimeOffset || 0);
  const remaining = Math.max(0, Math.floor((props.targetTimestamp - serverTime) / 1000));

  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');
  counterText.value = `${minutes}:${seconds}`;
  
  console.log('Counter updated:', {
    counterText: counterText.value,
    targetTimestamp: props.targetTimestamp,
    targetTimestampDate: new Date(props.targetTimestamp).toISOString(),
    serverTime: serverTime,
    serverTimeDate: new Date(serverTime).toISOString(),
    serverTimeOffset: props.serverTimeOffset,
    remaining: remaining,
    diff: props.targetTimestamp - serverTime
  });
}

function startClock() {
  stopClock();
  
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

const fetchNoticeCount = async () => {
  try {
    if (!apiLink.get_notices) {
      noticeCount.value = 0;
      return;
    }

    const result = await getData(`${apiLink.get_notices}?page=1&limit=1`);
    
    if (result.status && result.data) {
      noticeCount.value = result.data.total || 0;
    } else {
      noticeCount.value = 0;
    }
  } catch (error) {
    console.error('Error fetching notice count:', error);
    noticeCount.value = 0;
  }
};

onMounted(() => {
  startClock();
  fetchNoticeCount();
});
onBeforeUnmount(stopClock);

watch(
  () => [props.targetTimestamp, props.serverTimeOffset, props.loading],
  () => {
    startClock();
  },
  { immediate: false }
);

watch(
  () => props.targetTimestamp,
  (newVal, oldVal) => {
    console.log('BannerCard: targetTimestamp changed', { newVal, oldVal });
    if (newVal > 0) {
      updateCounter();
    }
  }
);

watch(
  () => props.serverTimeOffset,
  (newVal, oldVal) => {
    console.log('BannerCard: serverTimeOffset changed', { newVal, oldVal });
    if (props.targetTimestamp > 0) {
      updateCounter();
    }
  }
);
</script>

<style scoped>
.glass-banner {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border-light);
  border-radius: 4px;
}

.notice-badge {
  cursor: pointer;
  transition: opacity 0.2s;
}

.notice-badge:hover {
  opacity: 0.8;
}
</style>
