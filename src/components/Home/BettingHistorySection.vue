<template>
  <a-card :title="trlang.recent_betting_history" class="game-result-card betting-history-card">
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        row-key="id"
        class="betting-history-table"
        size="middle"
        :bordered="false"
        :pagination="false"
        :loading="loading"
      >
        <template #emptyText>
          <div class="text-center text-white py-4">
            <a-spin v-if="loading" />
            <span v-else>{{ trlang.no_data }}</span>
          </div>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'bet_amount'">
            <span class="table-cell-content">{{ record.bet_amount?.toLocaleString() || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'bet_info'">
            <a-tooltip :title="String(record.number_sort || '')" color="#0086e3">
              <span class="table-cell-content">
                {{ trlang[record.type] || record.type }}
                <span class="ms-2">{{ record.benefit || record.betting_rate }}</span>
              </span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'win'">
            <a-tag v-if="game?.list && game.list.length > 0" :color="record.win ? 'success' : 'default'">
              {{ record.win ? trlang.win : trlang.lose }}
            </a-tag>
            <a-button
              v-else-if="record.betting_status === 'wait' && remainTime >= 90 && remainTime <= 180"
              type="primary"
              danger
              size="small"
              :loading="cancelLoading"
              :disabled="cancelLoading"
              @click="emit('cancelBetting', { id: record.id })"
            >
              {{ trlang.cancel }}
            </a-button>
            <span v-else-if="!game?.list || game.list.length === 0" class="table-cell-content text-white">
              -
            </span>
          </template>
          <template v-else-if="column.key === 'earning_amount'">
            <span class="table-cell-content" :class="record.win ? 'text-success' : 'text-white'">
              {{ record.earning_amount?.toLocaleString() || 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            <span class="table-cell-content">{{ formatDate(record.createdAt) }}</span>
          </template>
        </template>
      </a-table>
    </div>
  </a-card>
</template>

<script setup>
import { computed, inject } from 'vue';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

const columns = computed(() => [
  { 
    key: 'bet_amount', 
    title: trlang.value.bet_amount, 
    dataIndex: 'bet_amount',
    align: 'center',
    width: 120,
    ellipsis: true,
  },
  { 
    key: 'bet_info', 
    title: trlang.value.bet_info, 
    dataIndex: 'bet_info',
    align: 'center',
    width: 200,
    ellipsis: true,
  },
  { 
    key: 'win', 
    title: getTranslation('result'), 
    dataIndex: 'win',
    align: 'center',
    width: 100,
  },
  { 
    key: 'earning_amount', 
    title: trlang.value.total_earning, 
    dataIndex: 'earning_amount',
    align: 'center',
    width: 120,
    ellipsis: true,
  },
  { 
    key: 'createdAt', 
    title: getTranslation('date'), 
    dataIndex: 'createdAt',
    align: 'center',
    width: 180,
    ellipsis: true,
  },
]);

const emit = defineEmits(['cancelBetting']);

const props = defineProps({
  gameResult: { type: Object, default: null },
  remainTime: { type: Number, default: 0 },
  loading: { type: Boolean, default: true },
  bettingHistory: { type: Array, default: () => [] },
  cancelLoading: { type: Boolean, default: false },
});

const dataSource = computed(() => props.bettingHistory || []);
const game = computed(() => props.gameResult);

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style scoped>
.game-result-card {
  border-radius: 20px !important;
}

.betting-history-card {
  width: 100%;
}

.betting-history-card :deep(.ant-card-body) {
  padding: 30px !important;
}

.betting-history-table :deep(.ant-table-container) {
  overflow-x: visible !important;
}

:deep(.ant-tag) {
  background: var(--glass-bg-light) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
}

:deep(.ant-tooltip-inner) {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  box-shadow: var(--glass-shadow) !important;
}

.text-success {
  color: #10b981 !important;
}
</style>

