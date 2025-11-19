<template>
  <div class="bg-primary-light radius-2 p-3 mt-2">
    <a-card :title="trlang.recent_betting_history" class="game-result-card">
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
              <a-tag :color="record.win ? 'success' : 'default'">
                {{ record.win ? trlang.win : trlang.lose }}
              </a-tag>
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

const fetchBettingHistory = async (page = 1, pageSize = 10) => {
  loading.value = true;
  try {
    const result = await getData(
      `${apiLink.get_bet_history}?page=${page}&pageSize=${pageSize}`
    );

    if (result.status && result.data?.items) {
      bettingHistory.value = result.data.items.map((item, index) => ({
        id: item._id || index + 1,
        bet_amount: item.bet_amount || 0,
        type: item.betting_type || '',
        benefit: item.betting_rate || 0,
        betting_rate: item.betting_rate || 0,
        number_sort: item.number_sort || [],
        win: Boolean(item.win),
        earning_amount: item.earning_amount || 0,
        createdAt: item.createdAt || new Date(),
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
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

onMounted(() => {
  fetchBettingHistory(pagination.page, pagination.limit);
});
</script>

<style scoped>
.game-result-card {
  border-radius: 20px !important;
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

