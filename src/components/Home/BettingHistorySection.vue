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
          <template v-if="column.key === 'index'">
            <span class="table-cell-content">{{ record.index }}</span>
          </template>
          <template v-else-if="column.key === 'bet_info'">
            <a-tooltip :title="String(record.number_sort || '')" color="#0086e3">
              <a-tag class="table-cell-content">
                {{ trlang[record.betting_type] || record.betting_type }}
              </a-tag>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'bet_amount'">
            <span class="table-cell-content">{{ record.bet_amount?.toLocaleString() || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'betting_result'">
            <div class="betting-result-cell">
              <template v-if="record.betting_status === 'COMPLETE'">
                <div class="betting-result-complete">
                  <span class="table-cell-content">{{ record.bet_amount?.toLocaleString() || 0 }}</span>
                  <a-tag 
                    :color="record.win ? 'success' : 'error'"
                    class="table-cell-content win-lose-tag"
                  >
                    {{ record.win ? trlang.win : trlang.lose }}
                  </a-tag>
                </div>
              </template>
              <template v-else>
                <a-tag 
                  :color="getBettingResultColor(record.betting_status)"
                  class="table-cell-content"
                >
                  {{ getBettingStatusText(record.betting_status) }}
                </a-tag>
              </template>
              <a-button
                v-if="canCancelBet(record)"
                type="primary"
                danger
                size="small"
                :loading="cancelLoading"
                @click="handleCancelBet(record.id)"
                class="cancel-button"
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

const columns = computed(() => [
  { 
    key: 'index', 
    title: trlang.value.no, 
    dataIndex: 'index',
    align: 'center',
    width: 50,
    ellipsis: true,
  },
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
    width: 150,
    ellipsis: true,
  },
  { 
    key: 'betting_result', 
    title: trlang.value.betting_result, 
    dataIndex: 'betting_result',
    align: 'center',
    width: 180,
    ellipsis: true,
  },
]);

const props = defineProps({
  gameResult: { type: Object, default: null },
  remainTime: { type: Number, default: 0 },
  loading: { type: Boolean, default: true },
  bettingHistory: { type: Array, default: () => [] },
  cancelLoading: { type: Boolean, default: false },
});

const dataSource = computed(() => {
  const history = props.bettingHistory || [];
  const gameData = props.gameResult;
  
  return history.map((item, idx) => {
    const status = item.betting_status || 'WAIT';
    const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status;
    
    return {
      id: item.id || item._id,
      index: idx + 1,
      bet_time: item.createdAt || null,
      game_time: gameData?.end_time_stamp || null,
      total_no: item.total_no ?? gameData?.total_no ?? null,
      today_no: item.today_no ?? gameData?.today_no ?? null,
      betting_type: item.betting_type || item.type || '',
      betting_rate: item.betting_rate || item.benefit || 0,
      bet_amount: item.bet_amount || 0,
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

const getBettingResultColor = (status) => {
  switch (status) {
    case 'COMPLETE':
      return 'success';
    case 'PROGRESS':
      return 'processing';
    case 'WAIT':
      return 'default';
    case 'CANCEL':
      return 'error';
    default:
      return 'default';
  }
};

const canCancelBet = (record) => {
  const isWaitStatus = record.betting_status === 'WAIT';
  const isWithinCancelWindow = props.remainTime >= 90 && props.remainTime <= 180;
  return isWaitStatus && isWithinCancelWindow;
};

// Handle cancel bet action
const handleCancelBet = (id) => {
  emit('cancelBetting', { id });
};
</script>

<style scoped>
.game-result-card {
  border-radius: 4px !important;
}

.betting-history-card {
  width: 100%;
}

.betting-history-card :deep(.ant-card-body) {
  padding: 16px 8px !important;
}

.table-container {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

.betting-history-table :deep(.ant-table-container) {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

.betting-history-table :deep(.ant-table-body) {
  overflow-x: hidden !important;
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
  box-shadow: var(--glass-shadow) !important;
}

.text-success {
  color: #10b981 !important;
}

.betting-result-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.betting-result-cell .cancel-button {
  margin-top: 4px;
}

.betting-result-complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.betting-result-complete .win-lose-tag {
  margin-top: 2px;
}
</style>

