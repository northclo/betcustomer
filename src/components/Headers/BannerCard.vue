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
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

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
const counterText = ref('');
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

// ⏱️ Rolling 3-minute counter (from betgaming project)
function updateCounter() {
  const now = new Date()
  const secondsSince3min = (now.getMinutes() % 3) * 60 + now.getSeconds()
  const remainingSeconds = (3 * 60) - secondsSince3min

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const seconds = String(remainingSeconds % 60).padStart(2, '0')
  counterText.value = `${minutes}:${seconds}`
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
