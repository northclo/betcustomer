<template>
  <a-space direction="vertical" class="w-100">
    <a-card :title="trlang.game_results" class="game-result-card">
      <a-typography-text class="text-white text-xl md:text-3xl">
        <span class="text-xl md:text-3xl">{{ totalNo }}</span>
        {{ trlang.round }} ({{ todayNo }} {{ trlang.round }})
      </a-typography-text>

      <a-layout
        class="bg-none flex flex-row justify-between items-center px-5 mt-5 mb-5"
      >
        <div>
          <LeftOutlined
            class="nav-game-icon"
            :class="{ 'nav-game-icon-disabled': !previousGameId }"
            @click="previousGameId && emit('previousGame')"
          />
        </div>
        <a-typography-text v-if="!game?.list?.length" class="text-white text-xl md:text-3xl">
          {{
            remainTime >= 90 && remainTime <= 180
              ? trlang.betting_available
              : trlang.no_available_betting
          }}
        </a-typography-text>
        <div v-else>
          <a-layout-content class="flex-1 flex justify-center flex-wrap gap-2">
            <a-button :class="game?.odd ? 'active game-btn game-btn-odd' : 'game-btn game-btn-odd'">
              {{ trlang.odd }}
            </a-button>
            <a-button :class="game?.under ? 'active game-btn game-btn-under' : 'game-btn game-btn-under'">
              {{ trlang.under }}
            </a-button>
          </a-layout-content>
        </div>
        <div>
          <RightOutlined
            class="nav-game-icon"
            :class="{ 'nav-game-icon-disabled': !nextGameId }"
            @click="nextGameId && emit('nextGame')"
          />
        </div>
      </a-layout>
      <a-flex class="mb-5" justify="center">
        <div class="mt-5 flex gap-5">
          <a-button
            v-for="item in (game?.list || [])"
            :key="item"
            :class="'flex items-center justify-center running-ball running-ball' + item"
            >
            {{ item }}
          </a-button>
        </div>
      </a-flex>

      <a-layout
        class="glass-footer flex flex-col md:flex-row justify-center gap-5 p-2 w-100 radius-bottom-1"
      >
        <a-typography-text class="text-white text-lg md:text-2xl">
          <span class="text-warning me-2">{{ trlang.total_betting }}</span>
          {{ totalBettingAmount.toLocaleString() }}
        </a-typography-text>
        <a-typography-text class="text-white text-lg md:text-2xl">
          <span class="text-warning me-2">{{ trlang.total_earning }}</span>
          {{ totalEarningAmount.toLocaleString() }}
        </a-typography-text>
      </a-layout>
    </a-card>

     <BettingHistorySection
      :betting-history="bettingHistory"
      :game-result="gameResult"
      :remain-time="remainTime"
      :loading="loading"
      :cancel-loading="cancelLoading"
      @cancel-betting="handleCancelBetting"
    />
  </a-space>
</template>

<script setup>
import { computed, inject } from 'vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import BettingHistorySection from '@/components/Home/BettingHistorySection.vue';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const emit = defineEmits(['cancelBetting', 'previousGame', 'nextGame']);

const handleCancelBetting = (data) => {
  emit('cancelBetting', data);
};

const props = defineProps({
  previousGameId: { type: String, default: null },
  nextGameId: { type: String, default: null },
  gameResult: { type: Object, default: null },
  remainTime: { type: Number, default: 0 },
  gameId: { type: String, default: null },
  numberList: { type: Array, default: () => [] },
  todayNo: { type: Number, default: 0 },
  totalNo: { type: Number, default: 0 },
  loading: { type: Boolean, default: true },
  bettingHistory: { type: Array, default: () => [] },
});

const totalBettingAmount = computed(() =>
  (props.bettingHistory || []).reduce((sum, el) => sum + (el?.bet_amount || 0), 0)
);
const totalEarningAmount = computed(() =>
  (props.bettingHistory || []).reduce((sum, el) => sum + (el?.earning_amount || 0), 0)
);
const game = computed(() => props.gameResult);
</script>

<style scoped>
.glass-footer {
  background: var(--glass-bg-dark);
  border-top: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow-soft);
}

:deep(.ant-btn) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-icon) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-icon:hover) {
  color: var(--main-color);
}

/* Table Styling */
:deep(.ant-table) {
  background: transparent !important;
}

:deep(.ant-table-thead > tr > th) {
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-border) !important;
  color: var(--white-color) !important;
}

:deep(.ant-table-tbody > tr > td) {
  background: transparent !important;
  border-color: var(--glass-border) !important;
  color: var(--white-color) !important;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: var(--glass-bg-light) !important;
}

:deep(.ant-table-tbody > tr) {
  background: transparent !important;
}

:deep(.ant-table-placeholder) {
  background: transparent !important;
}

:deep(.ant-empty-description) {
  color: var(--white-color) !important;
}

/* Match Game Result Card height with BettingOption */
.game-result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.game-result-card :deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
