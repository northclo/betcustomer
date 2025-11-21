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
          <template v-else-if="column.key === 'bet_time'">
            <span class="table-cell-content">{{ formatDate(record.bet_time) }}</span>
          </template>
          <template v-else-if="column.key === 'game_time'">
            <span class="table-cell-content">{{ formatGameTime(record.game_time) }}</span>
          </template>
          <template v-else-if="column.key === 'game_index'">
            <span class="table-cell-content">{{ formatGameIndex(record.total_no, record.today_no) }}</span>
          </template>
          <template v-else-if="column.key === 'bet_info'">
            <a-tooltip :title="String(record.number_sort || '')" color="#0086e3">
              <a-tag class="table-cell-content">
                {{ trlang[record.betting_type] || record.betting_type }}
              </a-tag>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'bet_rate'">
            <span class="table-cell-content">{{ record.betting_rate || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'bet_amount'">
            <span class="table-cell-content">{{ record.bet_amount?.toLocaleString() || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'betting_result'">
            <template v-if="record.betting_status === 'COMPLETE'">
              <span class="table-cell-content">{{ record.bet_amount?.toLocaleString() || 0 }}</span>
            </template>
            <template v-else>
              <a-tag 
                :color="getBettingResultColor(record.betting_status)"
                class="table-cell-content"
              >
                {{ getBettingStatusText(record.betting_status) }}
              </a-tag>
            </template>
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

const columns = computed(() => [
  { 
    key: 'index', 
    title: trlang.value.no, 
    dataIndex: 'index',
    align: 'center',
    width: 80,
    ellipsis: true,
  },
  { 
    key: 'bet_time', 
    title: trlang.value.bet_time, 
    dataIndex: 'bet_time',
    align: 'center',
    width: 160,
    ellipsis: true,
  },
  { 
    key: 'game_time', 
    title: trlang.value.game_time, 
    dataIndex: 'game_time',
    align: 'center',
    width: 160,
    ellipsis: true,
  },
  { 
    key: 'game_index', 
    title: trlang.value.game_index, 
    dataIndex: 'game_index',
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
    key: 'bet_rate', 
    title: trlang.value.bet_rate, 
    dataIndex: 'bet_rate',
    align: 'center',
    width: 100,
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
    key: 'betting_result', 
    title: trlang.value.betting_result, 
    dataIndex: 'betting_result',
    align: 'center',
    width: 130,
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
      number_sort: item.number_sort || [],
    };
  });
});

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const formatGameTime = (timestamp) => {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const formatGameIndex = (totalNo, todayNo) => {
  if (totalNo === null && todayNo === null) return '-';
  if (totalNo !== null && todayNo !== null) {
    return `${totalNo} / ${todayNo}${trlang.value.per_day || 'D'}`;
  }
  if (totalNo !== null) return `${totalNo}`;
  if (todayNo !== null) return `${todayNo}${trlang.value.per_day || 'D'}`;
  return '-';
};

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

