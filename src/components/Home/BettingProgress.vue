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
            v-if="previousGameId"
            class="text-white cursor-pointer"
            @click="emit('previousGame')"
          />
        </div>
        <a-typography-text v-if="!game?.list.length" class="text-white text-xl md:text-3xl">
          {{
            remainTime >= 90 && remainTime <= 180
              ? trlang.betting_available
              : trlang.no_available_betting
          }}
        </a-typography-text>
        <div v-else>
          <a-layout-content class="flex-1 flex justify-center flex-wrap gap-2">
            <a-button :class="game?.odd ? 'active game-btn' : 'game-btn'">
              {{ trlang.odd }}
            </a-button>
            <a-button :class="game?.under ? 'active game-btn' : 'game-btn'">
              {{ trlang.under }}
            </a-button>
          </a-layout-content>
        </div>
        <div>
          <RightOutlined
            v-if="nextGameId"
            class="text-white cursor-pointer"
            @click="emit('nextGame')"
          />
        </div>
      </a-layout>
      <a-flex justify="center">
        <div class="mt-5 flex gap-5">
          <a-button
            v-for="item in game?.list"
            :key="item"
            :class="'running-ball running-ball' + item"
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

    <!-- Recent Bets -->
    <a-card :title="trlang.recent_betting_history" class="game-result-card recent-betting-card">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        row-key="key"
        class="w-100 mt-2"
        :pagination="false"
      >
        <template #emptyText>
          <a-spin v-if="loading" />
          <span v-else>{{ trlang.no_data }}</span>
        </template>

        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'id'">
            {{ dataSource.length - index }}
          </template>
          <template v-else-if="column.key === 'bet_amount'">
            {{ record.bet_amount.toLocaleString() }}
          </template>
          <template v-else-if="column.key === 'bet_info'">
            <a-tooltip :title="String(record.number_sort)" color="#0086e3">
              {{ trlang[record.type] }}
              <span class="ms-5">{{ record.benefit }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'result'">
            <a-typography-text
              v-if="game?.list?.length !== 0"
              class="text-white"
            >
              {{ record?.earning_amount || 0 }}
            </a-typography-text>
            <a-button
              v-else-if="remainTime >= 90 && remainTime <= 180"
              class="w-100"
              @click="emit('cancelBetting', { id: record.id })"
            >
              {{ trlang.cancel }}
            </a-button>
            <a-typography-text v-else class="text-white">
              {{ trlang.no_available_betting }}
            </a-typography-text>
          </template>
        </template>
      </a-table>
    </a-card>
  </a-space>
</template>

<script setup>
import { computed, inject } from 'vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

// ✅ constants
const DEFAULT_COLUMNS = (t) => [
  { key: 'id', title: 'ID', dataIndex: 'id' },
  { key: 'bet_amount', title: t.bet_amount, dataIndex: 'bet_amount' },
  { key: 'bet_info', title: t.bet_info, dataIndex: 'bet_info' },
  { key: 'result', title: t.result, dataIndex: 'result' },
];

const emit = defineEmits(['cancelBetting', 'previousGame', 'nextGame']);

// ✅ props
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

// ✅ state
const totalBettingAmount = computed(() =>
  dataSource.value.reduce((sum, el) => sum + el.bet_amount, 0)
);
const totalEarningAmount = computed(() =>
  dataSource.value.reduce((sum, el) => sum + el?.earning_amount, 0)
);
const columns = computed(() => DEFAULT_COLUMNS(trlang.value));
const dataSource = computed(() => props.bettingHistory || []);
const game = computed(() => props.gameResult);
</script>

<style scoped>
.glass-footer {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border-top: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow-soft);
}

:deep(.ant-btn) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-btn:hover) {
  transform: translateY(-2px);
}

:deep(.ant-icon) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-icon:hover) {
  color: var(--main-color);
  transform: scale(1.1);
}

/* Table Styling */
:deep(.ant-table) {
  background: transparent !important;
}

:deep(.ant-table-thead > tr > th) {
  background: var(--glass-bg-light) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
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

/* Recent Betting History Card Styling - Match Game Result Card Size */
.recent-betting-card {
  min-height: 220px;
}

.recent-betting-card :deep(.ant-card-body) {
  padding: 30px !important;
  min-height: 195px;
  display: flex;
  flex-direction: column;
}

.recent-betting-card :deep(.ant-table-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
}

.recent-betting-card :deep(.ant-table) {
  font-size: 16px;
  flex: 1;
  min-width: 720px;
}

.recent-betting-card :deep(.ant-table-thead > tr > th) {
  padding: 18px !important;
  font-size: 17px;
  font-weight: 600;
}

.recent-betting-card :deep(.ant-table-tbody > tr > td) {
  padding: 18px !important;
  font-size: 16px;
}

.recent-betting-card :deep(.ant-table-tbody) {
  min-height: 100px;
}
</style>
