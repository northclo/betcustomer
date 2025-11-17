<template>
  <div class="notice-list-page">
    <div class="bg-primary-light radius-2 p-3 mt-2">
      <a-card :title="trlang.notice_list" class="game-result-card">
        <a-table
          :columns="noticeColumns"
          :data-source="noticeList"
          :loading="loading"
          :pagination="false"
          :bordered="false"
          :scroll="{ x: 'max-content' }"
          size="middle"
          class="notice-table"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'index'">
              <span class="table-cell-content">{{ record.index }}</span>
            </template>
            <template v-else-if="column.key === 'title'">
              <span class="table-cell-content">{{ record.title }}</span>
            </template>
            <template v-else-if="column.key === 'writer'">
              <span class="table-cell-content">{{ record.writer }}</span>
            </template>
            <template v-else-if="column.key === 'date'">
              <span class="table-cell-content">{{ formatDate(record.date) }}</span>
            </template>
            <template v-else-if="column.key === 'start_date'">
              <span class="table-cell-content">{{ record.start_date ? formatDate(record.start_date) : '-' }}</span>
            </template>
            <template v-else-if="column.key === 'end_date'">
              <span class="table-cell-content">{{ record.end_date ? formatDate(record.end_date) : '-' }}</span>
            </template>
          </template>
          <template #emptyText>
            <div class="text-center text-white py-4">{{ trlang.no_notice_messages }}</div>
          </template>
        </a-table>

        <div class="pagination-controls mt-3">
          <a-button
            class="pagination-nav-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            {{ trlang.prev_page }}
          </a-button>
          <template v-for="pageNum in pageNumbers" :key="pageNum">
            <a-button
              :type="currentPage === pageNum ? 'primary' : 'default'"
              class="page-number-btn"
              :class="{ 'active': currentPage === pageNum }"
              @click="goToPage(pageNum)"
            >
              {{ pageNum }}
            </a-button>
          </template>
          <a-button
            class="pagination-nav-btn"
            :disabled="currentPage >= totalPages || totalPages <= 1"
            @click="goToPage(currentPage + 1)"
          >
            {{ trlang.next_page }}
          </a-button>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

// ✅ state
const loading = ref(false);
const noticeList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);

// ✅ table columns
const noticeColumns = computed(() => [
  {
    title: trlang.value.index,
    key: 'index',
    width: 80,
    align: 'center',
  },
  {
    title: trlang.value.title,
    key: 'title',
    align: 'left',
    ellipsis: true,
  },
  {
    title: trlang.value.writer,
    key: 'writer',
    align: 'center',
    width: 150,
    ellipsis: true,
  },
  {
    title: trlang.value.date,
    key: 'date',
    align: 'center',
    width: 200,
  },
  {
    title: trlang.value.start_date,
    key: 'start_date',
    align: 'center',
    width: 200,
  },
  {
    title: trlang.value.end_date,
    key: 'end_date',
    align: 'center',
    width: 200,
  },
]);

// ✅ computed
const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1);
});

// ✅ methods
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const fetchNotices = async () => {
  loading.value = true;
  try {
    // Check if API endpoint exists, if not return empty list
    if (!apiLink.get_notices) {
      noticeList.value = [];
      totalPages.value = 1;
      currentPage.value = 1;
      return;
    }

    const result = await getData(`${apiLink.get_notices}?page=${currentPage.value}&limit=${pageSize.value}`);
    
    if (result.status && result.data) {
      const { notices, page, totalPages: pages, total } = result.data;
      noticeList.value = (notices || []).map((item) => ({
        _id: item._id || item.id,
        index: item.index || 0,
        title: item.title || '',
        writer: item.writer || '',
        date: item.createdAt ? new Date(item.createdAt) : new Date(),
        content: item.content || '',
        message: item.content || '',
        start_date: item.start_date || null,
        end_date: item.end_date || null,
      }));
      
      if (pages !== undefined && pages !== null) {
        totalPages.value = pages;
      } else if (total !== undefined && total !== null) {
        totalPages.value = Math.ceil(total / pageSize.value) || 1;
      } else {
        totalPages.value = 1;
      }
      
      if (page !== undefined && page !== null) {
        currentPage.value = page;
      }
    } else {
      noticeList.value = [];
      totalPages.value = 1;
      currentPage.value = 1;
    }
  } catch (error) {
    // Silently handle 404 or other API errors - API endpoint may not be implemented yet
    console.warn('Notices API not available yet:', error);
    noticeList.value = [];
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchNotices();
  }
};

// ✅ lifecycle
onMounted(() => {
  fetchNotices();
});
</script>

<style scoped>
.notice-list-page {
  min-height: 80vh;
}

.notice-table {
  background: transparent;
}

:deep(.ant-table-wrapper),
:deep(.ant-table),
:deep(.ant-table-container) {
  background: transparent !important;
}

:deep(.ant-table-thead > tr > th) {
  background: var(--glass-bg-light) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border-color: var(--glass-border) !important;
  color: var(--white-color) !important;
  font-weight: 600;
  padding: 12px 16px !important;
}

:deep(.ant-table-tbody > tr > td) {
  background: transparent !important;
  border-color: var(--glass-border) !important;
  color: var(--white-color) !important;
  padding: 12px 16px !important;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: var(--glass-bg-light) !important;
}

.table-cell-content {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.text-center {
  text-align: center;
}

.text-white {
  color: var(--white-color);
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

/* Pagination Styles */
.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
}

.pagination-controls :deep(.ant-btn) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
}

.pagination-controls :deep(.ant-btn:hover:not(:disabled)) {
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: var(--glass-shadow);
  transform: translateY(-1px);
}

.pagination-controls :deep(.ant-btn:disabled) {
  background: transparent !important;
  background-color: transparent !important;
  color: rgba(255, 255, 255, 0.3) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  cursor: not-allowed;
}

.pagination-nav-btn {
  min-width: auto;
  padding: 6px 16px;
  border-radius: 8px;
}

.page-number-btn {
  min-width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid var(--glass-border) !important;
}

.page-number-btn.active {
  background: var(--glass-red) !important;
  border-color: var(--glass-red-border) !important;
  color: var(--white-color) !important;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4), var(--glass-shadow-soft);
  font-weight: 700;
}

.page-number-btn:not(.active):hover:not(:disabled) {
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-blue-border) !important;
}

.mt-3 {
  margin-top: 12px;
}
</style>

