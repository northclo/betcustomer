<template>
  <a-card :title="trlang.recent_betting_history" class="game-result-card betting-history-card">
    <a-table
      :columns="columns"
      :data-source="dataSource"
      row-key="key"
      class="w-100 mt-2 betting-history-table"
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
            v-if="game?.list && game.list.length > 0"
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
</template>

<script setup>
import { computed, inject } from 'vue';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

// ✅ constants
const DEFAULT_COLUMNS = (t) => [
  { key: 'id', title: t.id, dataIndex: 'id' },
  { key: 'bet_amount', title: t.bet_amount, dataIndex: 'bet_amount' },
  { key: 'bet_info', title: t.bet_info, dataIndex: 'bet_info' },
  { key: 'result', title: t.result, dataIndex: 'result' },
];

const emit = defineEmits(['cancelBetting']);

// ✅ props
const props = defineProps({
  gameResult: { type: Object, default: null },
  remainTime: { type: Number, default: 0 },
  loading: { type: Boolean, default: true },
  bettingHistory: { type: Array, default: () => [] },
});

// ✅ state
const columns = computed(() => DEFAULT_COLUMNS(trlang.value));
const dataSource = computed(() => props.bettingHistory || []);
const game = computed(() => props.gameResult);
</script>

<style scoped>
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

/* Betting History Card - No scrollbar, full width table */
.betting-history-card {
  width: 100%;
}

.betting-history-card :deep(.ant-card-body) {
  padding: 30px !important;
}

.betting-history-table :deep(.ant-table-wrapper) {
  overflow-x: visible !important;
}

.betting-history-table :deep(.ant-table) {
  width: 100% !important;
  font-size: 16px;
}

.betting-history-table :deep(.ant-table-thead > tr > th) {
  padding: 18px !important;
  font-size: 17px;
  font-weight: 600;
  white-space: nowrap;
  text-align: center !important;
}

.betting-history-table :deep(.ant-table-tbody > tr > td) {
  padding: 18px !important;
  font-size: 16px;
  white-space: nowrap;
  text-align: center !important;
}

@media (max-width: 767px) {
  .betting-history-table :deep(.ant-table-thead > tr > th),
  .betting-history-table :deep(.ant-table-tbody > tr > td) {
    padding: 8px 4px !important;
    font-size: 12px;
    white-space: normal;
    word-break: break-word;
  }
  
  .betting-history-table :deep(.ant-table-thead > tr > th) {
    font-size: 11px;
  }
}
</style>

