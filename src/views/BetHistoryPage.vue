<template>
  <div class="bg-primary-light radius-1 p-5 mt-5">
    <a-card :title="trlang.recent_betting_history" class="game-result-card">
      <a-table
        :columns="columns"
        :data-source="bettingHistory"
        row-key="id"
        class="w-100 mt-2"
        :scroll="{ x: 'max-content' }"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
      >
        <template #emptyText>
          <a-spin v-if="loading" />
          <span v-else>{{ trlang.no_data }}</span>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'id'">
            {{ record.id }}
          </template>
          <template v-else-if="column.key === 'game_id'">
            {{ record.game_id || '-' }}
          </template>
          <template v-else-if="column.key === 'bet_amount'">
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
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

const formatTranslation = (key, params = {}) => {
  let template = getTranslation(key);
  Object.entries(params).forEach(([paramKey, paramValue]) => {
    template = template.replace(
      new RegExp(`{${paramKey}}`, 'g'),
      String(paramValue)
    );
  });
  return template;
};

// ✅ state
const bettingHistory = ref([]);
const loading = ref(false);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) =>
    formatTranslation('bet_history_total', { total }),
});

// ✅ columns
const columns = computed(() => [
  { 
    key: 'id', 
    title: getTranslation('id'), 
    dataIndex: 'id',
    width: 80,
  },
  { 
    key: 'game_id', 
    title: getTranslation('game_id'), 
    dataIndex: 'game_id',
    width: 150,
  },
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
        game_id: item.game_id || '-',
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
        pagination.value.total = result.data.pagination.total || 0;
        pagination.value.current = result.data.pagination.page || page;
        pagination.value.pageSize = result.data.pagination.pageSize || pageSize;
      } else {
        pagination.value.total = bettingHistory.value.length;
      }
    } else {
      bettingHistory.value = [];
      pagination.value.total = 0;
    }
  } catch (error) {
    console.error('Error fetching betting history:', error);
    bettingHistory.value = [];
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pag) => {
  pagination.value.current = pag.current;
  pagination.value.pageSize = pag.pageSize;
  fetchBettingHistory(pag.current, pag.pageSize);
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
  fetchBettingHistory(1, 10);
});
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

