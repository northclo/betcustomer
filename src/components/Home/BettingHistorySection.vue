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
          <div class="text-center text-white py-1">
            <a-spin v-if="loading" />
            <span v-else>{{ trlang.no_data }}</span>
          </div>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'index'">
            <span class="table-cell-content">{{ record.index }}</span>
          </template>
          <template v-else-if="column.key === 'bet_info'">
            <a-tooltip :title="String(record.number_sort || '')" color="#0086e3">
              <span class="table-cell-content">
                {{ trlang[record.betting_type] || record.betting_type }} ({{ record.betting_rate || 0 }})
              </span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'bet_amount'">
            <span class="table-cell-content">{{ record.bet_amount?.toLocaleString() || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'betting_result'">
            <div class="betting-result-cell">
              <template v-if="record.betting_status === 'COMPLETE'">
                <span class="table-cell-content" :class="record.win ? 'text-success' : 'text-error'">
                  {{ record.win 
                    ? (record.earning_amount?.toLocaleString() || 0) 
                    : `-${(record.bet_amount?.toLocaleString() || 0)}` 
                  }}
                </span>
              </template>
              <template v-else>
                <span class="table-cell-content">
                  {{ getBettingStatusText(record.betting_status) }}
                </span>
              </template>
              <a-button
                v-if="canCancelBet(record)"
                type="primary"
                danger
                size="small"
                :loading="cancelLoading"
                class="cancel-button"
                @click="handleCancelBet(record.id)"
              >
                {{ trlang.cancel }}
              </a-button>
            </div>
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

const emit = defineEmits(['cancelBetting']);

const columns = computed(() => {
  const t = trlang.value;
  return [
    { 
      key: 'index', 
      title: t.no, 
      dataIndex: 'index',
      align: 'center',
      width: 50,
      ellipsis: true,
    },
    { 
      key: 'bet_amount', 
      title: t.bet_amount, 
      dataIndex: 'bet_amount',
      align: 'center',
      width: 120,
      ellipsis: true,
    },
    { 
      key: 'bet_info', 
      title: t.bet_info, 
      dataIndex: 'bet_info',
      align: 'center',
      width: 150,
      ellipsis: true,
    },
    { 
      key: 'betting_result', 
      title: t.betting_result, 
      dataIndex: 'betting_result',
      align: 'center',
      width: 150,
      ellipsis: true,
    },
  ];
});

const props = defineProps({
  gameResult: { type: Object, default: null },
  loading: { type: Boolean, default: true },
  bettingHistory: { type: Array, default: () => [] },
  cancelLoading: { type: Boolean, default: false },
});

const dataSource = computed(() => {
  const history = props.bettingHistory || [];
  const gameData = props.gameResult;
  
  const reversedHistory = [...history].reverse();
  
  return reversedHistory.map((item, idx) => {
    const status = item.betting_status || 'WAIT';
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status;
    
    return {
      id: item.id || item._id,
      index: reversedHistory.length - idx,
      bet_time: item.createdAt || null,
      game_time: gameData?.end_time_stamp || null,
      total_no: item.total_no ?? gameData?.total_no ?? null,
      today_no: item.today_no ?? gameData?.today_no ?? null,
      betting_type: item.betting_type || item.type || '',
      betting_rate: item.betting_rate || item.benefit || 0,
      bet_amount: item.bet_amount || 0,
      earning_amount: item.earning_amount || 0,
      betting_status: normalizedStatus,
      win: item.win || false,
      number_sort: item.number_sort || [],
    };
  });
});

const getBettingStatusText = (status) => {
  if (!status) return '-';
  const statusKey = `betting_status_${status.toLowerCase()}`;
  return trlang.value[statusKey] || status;
};

const cancellableRecordIds = computed(() => {
  return new Set(
    dataSource.value
      .filter(record => record.betting_status === 'WAIT')
      .map(record => record.id)
  );
});

const canCancelBet = (record) => {
  return cancellableRecordIds.value.has(record.id);
};

// Handle cancel bet action
const handleCancelBet = (id) => {
  emit('cancelBetting', { id });
};
</script>

<style scoped>
.game-result-card {
  border-radius: 8px !important;
}

.betting-history-card {
  width: 100%;
}

.betting-history-card :deep(.ant-card-body) {
  padding: 16px 8px !important;
}

.table-container {
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

.betting-history-table :deep(.ant-table-container) {
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

.betting-history-table :deep(.ant-table-body) {
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

:deep(.ant-tag) {
  background: var(--glass-bg-light) !important;
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
}

:deep(.ant-tooltip-inner) {
  background: var(--glass-bg) !important;
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
}

.text-success {
  color: #10b981 !important;
}

.text-error {
  color: #ef4444 !important;
}

.betting-result-cell {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.betting-result-complete {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.betting-result-complete .win-lose-tag {
  margin-top: 0;
}

:deep(.win-tag) {
  background: #10b981 !important;
  border-color: #10b981 !important;
  color: #ffffff !important;
}

:deep(.lose-tag) {
  background: #ef4444 !important;
  border-color: #ef4444 !important;
  color: #ffffff !important;
}
</style>

