<template>
  <div class="bg-primary-light radius-1 p-5 mt-5">
    <a-card :title="trlang.recent_betting_history" class="game-result-card">
      <div class="table-container">
        <a-table
          :columns="columns"
          :data-source="bettingHistory"
          row-key="id"
          class="w-100 mt-2"
          :scroll="{ x: 'max-content' }"
          :pagination="false"
          :loading="loading"
        >
          <template #emptyText>
            <a-spin v-if="loading" />
            <span v-else>{{ trlang.no_data }}</span>
          </template>

          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'bet_amount'">
              {{ record.bet_amount?.toLocaleString() || 0 }}
            </template>
            <template v-else-if="column.key === 'bet_info'">
              <a-tooltip :title="String(record.number_sort || '')" color="#0086e3">
                {{ trlang[record.type] || record.type }}
                <span class="ms-2">{{ record.benefit || record.betting_rate }}</span>
              </a-tooltip>
            </template>
            <template v-else-if="column.key === 'win'">
              <a-tag :color="record.win ? 'success' : 'default'">
                {{ record.win ? trlang.win : trlang.lose }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'earning_amount'">
              <span :class="record.win ? 'text-success' : 'text-white'">
                {{ record.earning_amount?.toLocaleString() || 0 }}
              </span>
            </template>
            <template v-else-if="column.key === 'createdAt'">
              {{ formatDate(record.createdAt) }}
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

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

// ✅ state
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

// ✅ columns
const columns = computed(() => [
  { 
    key: 'bet_amount', 
    title: trlang.value.bet_amount, 
    dataIndex: 'bet_amount',
    width: 120,
  },
  { 
    key: 'bet_info', 
    title: trlang.value.bet_info, 
    dataIndex: 'bet_info',
    width: 200,
  },
  { 
    key: 'win', 
    title: getTranslation('result'), 
    dataIndex: 'win',
    width: 100,
  },
  { 
    key: 'earning_amount', 
    title: trlang.value.total_earning, 
    dataIndex: 'earning_amount',
    width: 120,
  },
  { 
    key: 'createdAt', 
    title: getTranslation('date'), 
    dataIndex: 'createdAt',
    width: 180,
  },
]);

// ✅ methods
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

// ✅ lifecycle
onMounted(() => {
  fetchBettingHistory(pagination.page, pagination.limit);
});
</script>

<style scoped>
/* Card border radius override for Bet History page */
.game-result-card {
  border-radius: 10px !important;
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

:deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none !important;
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

.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

:deep(.ant-pagination) {
  color: var(--white-color) !important;
}

:deep(.ant-pagination-item) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border-color: var(--glass-border) !important;
}

:deep(.ant-pagination-item a) {
  color: var(--white-color) !important;
}

:deep(.ant-pagination-item:hover) {
  border-color: var(--glass-border-light) !important;
}

:deep(.ant-pagination-item-active) {
  background: var(--glass-bg-light) !important;
  border-color: var(--main-color) !important;
}

:deep(.ant-pagination-item-active a) {
  color: var(--white-color) !important;
}

:deep(.ant-pagination-prev),
:deep(.ant-pagination-next) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  border-radius: 10px;
}

:deep(.ant-pagination-prev .ant-pagination-item-link),
:deep(.ant-pagination-next .ant-pagination-item-link) {
  background: transparent !important;
  border: none !important;
  color: var(--white-color) !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-pagination-prev:hover),
:deep(.ant-pagination-next:hover) {
  border-color: var(--glass-border-light) !important;
  background: var(--glass-bg-light) !important;
}

:deep(.ant-pagination-prev:hover .ant-pagination-item-link),
:deep(.ant-pagination-next:hover .ant-pagination-item-link) {
  color: var(--white-color) !important;
}

:deep(.ant-pagination-disabled),
:deep(.ant-pagination-disabled:hover) {
  background: var(--glass-bg-dark) !important;
  border-color: var(--glass-border) !important;
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.ant-pagination-disabled .ant-pagination-item-link) {
  color: rgba(255, 255, 255, 0.3) !important;
}

.pagination-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--glass-border);
}

.pagination-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-select {
  min-width: 80px;
}

.glass-select :deep(.ant-select-selector) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  border-radius: 10px !important;
  height: 44px !important;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.glass-select :deep(.ant-select-selection-item),
.glass-select :deep(.ant-select-selection-placeholder) {
  color: var(--white-color) !important;
}

.glass-select :deep(.ant-select-selector:hover),
.glass-select :deep(.ant-select-focused .ant-select-selector) {
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.glass-select__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--white-color);
  font-size: 12px;
  transition: color 0.2s ease;
}

:global(.glass-select-dropdown) {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
  color: var(--white-color) !important;
  border-radius: 10px;
  overflow: hidden;
}

:global(.glass-select-dropdown .ant-select-item-option) {
  color: var(--white-color) !important;
  background: transparent !important;
}

:global(.glass-select-dropdown .ant-select-item-option:hover) {
  background: var(--glass-bg-light) !important;
}

:global(.glass-select-dropdown .ant-select-item-option-active),
:global(.glass-select-dropdown .ant-select-item-option-selected) {
  background: var(--glass-blue) !important;
  color: var(--white-color) !important;
}

:deep(.ant-tag) {
  background: var(--glass-bg-light) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
}

:deep(.ant-tag-success) {
  background: rgba(16, 185, 129, 0.2) !important;
  border-color: rgba(16, 185, 129, 0.3) !important;
  color: #10b981 !important;
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

