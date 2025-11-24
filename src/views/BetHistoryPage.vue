<template>
  <div class="bg-primary-light radius-2 p-3 mt-2">
    <a-card :title="trlang.betting_history" class="game-result-card">
      <div class="table-container">
        <a-table
          :columns="columns"
          :data-source="bettingHistory"
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
                <div class="betting-result-complete">
                  <span class="table-cell-content">
                    {{ record.win 
                      ? (record.earning_amount?.toLocaleString() || 0) 
                      : `-${(record.bet_amount?.toLocaleString() || 0)}` 
                    }}
                  </span>
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
            </template>
          </template>
        </a-table>
      </div>

      <div class="pagination-footer">
        <a-pagination
          v-model:current="pagination.page"
          :page-size="pagination.limit"
          :total="pagination.total"
          :show-size-changer="false"
          :show-total="false"
          @change="handlePaginationChange"
        />
        <div class="pagination-size-selector">
          <a-select
            v-model:value="pagination.limit"
            class="page-size-select glass-select"
            :options="pageSizeOptions"
            dropdown-class-name="glass-select-dropdown"
            @change="handlePageSizeChange"
          >
            <template #suffixIcon>
              <span class="glass-select__icon">▾</span>
            </template>
          </a-select>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, reactive } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';
import { message } from 'ant-design-vue';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

const bettingHistory = ref([]);
const loading = ref(false);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});

const pageSizeOptions = computed(() => [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]);

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

const fetchBettingHistory = async (page = 1, pageSize = 10) => {
  loading.value = true;
  try {
    const result = await getData(
      `${apiLink.get_bet_history}?page=${page}&pageSize=${pageSize}`
    );

    if (result.status && result.data?.items) {
      const startIndex = (page - 1) * pageSize + 1;
      bettingHistory.value = result.data.items.map((item, idx) => ({
        id: item._id,
        index: startIndex + idx,
        bet_time: item.createdAt || null,
        game_time: item.game_end_time || null,
        total_no: item.total_no || null,
        today_no: item.today_no || null,
        betting_type: item.betting_type || '',
        betting_rate: item.betting_rate || 0,
        bet_amount: item.bet_amount || 0,
        earning_amount: item.earning_amount || 0,
        betting_status: item.betting_status,
        win: item.win || false,
        number_sort: item.number_sort || [],
      }));

      if (result.data.pagination) {
        pagination.total = result.data.pagination.total || 0;
        pagination.page = result.data.pagination.page || page;
        pagination.limit = result.data.pagination.pageSize || pageSize;
        pagination.totalPages = result.data.pagination.totalPages || Math.ceil(pagination.total / pagination.limit);
      } else {
        pagination.total = bettingHistory.value.length;
        pagination.totalPages = Math.ceil(pagination.total / pagination.limit);
      }
    } else {
      bettingHistory.value = [];
      pagination.total = 0;
      pagination.totalPages = 1;
    }
  } catch (error) {
    console.error('Error fetching betting history:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
    bettingHistory.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
  } finally {
    loading.value = false;
  }
};

const handlePaginationChange = (page) => {
  pagination.page = page;
  fetchBettingHistory(page, pagination.limit);
};

const handlePageSizeChange = (pageSize) => {
  pagination.limit = pageSize;
  pagination.page = 1;
  fetchBettingHistory(1, pageSize);
};

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
    return `${totalNo} / ${todayNo}${trlang.value.per_day}`;
  }
  if (totalNo !== null) return `${totalNo}`;
  if (todayNo !== null) return `${todayNo}${trlang.value.per_day}`;
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

onMounted(() => {
  fetchBettingHistory(pagination.page, pagination.limit);
});
</script>

<style scoped>
.game-result-card {
  border-radius: 4px !important;
}

.betting-history-table :deep(.ant-table-container) {
  overflow-x: visible !important;
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

.text-error {
  color: #ef4444 !important;
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

