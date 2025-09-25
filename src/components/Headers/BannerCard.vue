<template>
  <div class="mt-5" style="background: rgba(253, 126, 20, 0.4)">
    <a-flex justify="space-between">
      <!-- Game Index -->
      <a-flex class="p-2" gap="small" align="center">
        <a-typography-text class="sp-icon">
          {{ trlang.game_index }}
        </a-typography-text>
        <a-flex align="flex-end" gap="small">
          <a-typography-text class="fs-2 font-bold text-pink">
            {{ total_no }} {{ trlang.index_unit }}
          </a-typography-text>
          <a-typography-text class="fs-3 font-bold text-white">
            ({{ trlang.per_day }} {{ today_no }} {{ trlang.index_unit }})
          </a-typography-text>
        </a-flex>
      </a-flex>

      <!-- Timer -->
      <a-flex class="p-2" gap="small" align="center">
        <a-typography-text class="sp-icon">
          {{ trlang.time_intro }}
        </a-typography-text>
        <a-flex class="fs-3 text-white" align="flex-end" gap="small">
          {{ formattedTime }}
          <span class="fs-1 text-warning">{{ counterText }}</span>
        </a-flex>
      </a-flex>

      <!-- Store Amount -->
      <a-flex class="p-2" align="center" gap="small">
        <a-typography-text class="sp-icon">
          {{ trlang.store_amount }}
        </a-typography-text>
        <a-flex class="fs-2 text-light-green" align="flex-end">
          {{ own_money.toLocaleString() }} {{ trlang.currency }}
        </a-flex>
      </a-flex>

      <!-- Store Link -->
      <a-flex align="center">
        <a
          :href="trlang.store_name_link"
          target="_blank"
          class="flex items-center"
        >
          <a-image :src="spImg" />
          <a-typography-text class="text-white fs-4 ms-2">
            {{ trlang.store_name }}
          </a-typography-text>
        </a>
      </a-flex>

      <!-- Partner Dashboard -->
      <div class="p-2">
        <div class="text-white">Test</div>
        <button class="bg-white cursor-pointer">
          {{ trlang.partner_dashboard }}
        </button>
      </div>

      <!-- Messages -->
      <a-flex class="p-2" align="center" gap="small">
        <a-image :src="msgIcon" />
        <a-typography-text class="text-white fs-3">0</a-typography-text>
      </a-flex>
    </a-flex>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount, watch } from 'vue';
import spImg from '@/assets/images/sp.png';
import msgIcon from '@/assets/images/msg-icon.png';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState.translations);

// ✅ props & emits
const props = defineProps({
  loading: { type: Boolean, default: false },
  today_no: { type: Number },
  total_no: { type: Number },
  own_money: { type: Number },
  remain_time: { type: Number, default: 0 },
});
const emit = defineEmits(['update:remain_time']);

// ✅ state
const formattedTime = ref('');
const counterText = ref('00:00');
let clockInterval = null;
let remain = ref(props.remain_time);

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
    emit('update:remain_time', remain.value);

    const minutes = String(Math.floor(remain.value / 60)).padStart(2, '0');
    const seconds = String(remain.value % 60).padStart(2, '0');
    counterText.value = `${minutes}:${seconds}`;
  }
}

// ✅ start clock
function startClock() {
  stopClock();
  remain.value = props.remain_time;

  if (remain.value > 0 && remain.value < 180 && !props.loading) {
    const minutes = String(Math.floor(remain.value / 60)).padStart(2, '0');
    const seconds = String(remain.value % 60).padStart(2, '0');
    counterText.value = `${minutes}:${seconds}`;
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

// ✅ watch remain_time & loading reset
watch(
  () => [props.remain_time, props.loading],
  () => {
    startClock();
  }
);
</script>
