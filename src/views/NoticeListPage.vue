<template>
  <div class="notice-list-page">
    <div class="bg-primary-light radius-2 p-3 mt-2">
      <a-card :title="trlang.notice_list" class="game-result-card">
        <div class="table-container">
          <a-table
            :columns="noticeColumns"
            :data-source="noticeList"
            :loading="loading"
            :pagination="false"
            :bordered="false"
            size="middle"
            class="notice-table"
            :custom-row="customRow"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">
                <span class="table-cell-content">{{ (pagination.page - 1) * pagination.limit + index + 1 }}</span>
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
            </template>
            <template #emptyText>
              <div class="text-center text-white py-1">
                {{ trlang.no_notice_messages }}
              </div>
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

      <a-modal
        v-model:open="showNoticeModal"
        :title="selectedNotice?.title || ''"
        :width="600"
        :mask-closable="false"
        class="question-modal"
        @cancel="handleModalClose"
      >
        <template #footer>
          <a-button @click="handleModalClose">
            {{ trlang.close }}
          </a-button>
        </template>

        <div class="question-form-modal">
          <div class="form-group">
            <div class="notice-content">
              {{ selectedNotice?.content || '' }}
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, reactive } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';
import { message } from 'ant-design-vue';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const loading = ref(false);
const noticeList = ref([]);
const showNoticeModal = ref(false);
const selectedNotice = ref(null);
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

const noticeColumns = computed(() => [
  {
    title: trlang.value.no,
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
    ellipsis: true,
  },
  {
    title: trlang.value.date,
    key: 'date',
    align: 'center',
    width: 200,
  },
]);

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

const fetchNotices = async (page = 1, pageSize = 10) => {
  loading.value = true;
  try {
    if (!apiLink.get_notices) {
      noticeList.value = [];
      pagination.totalPages = 1;
      pagination.page = 1;
      pagination.total = 0;
      return;
    }

    const result = await getData(`${apiLink.get_notices}?page=${page}&limit=${pageSize}`);
    
    if (result.status && result.data) {
      const { notices, page: pageNum, totalPages: pages, total } = result.data;
      noticeList.value = (notices || []).map((item) => ({
        _id: item._id || item.id,
        title: item.title || '',
        writer: item.writer || '',
        date: item.createdAt ? new Date(item.createdAt) : new Date(),
        content: item.content || '',
        message: item.content || '',
      }));
      
      if (total !== undefined && total !== null) {
        pagination.total = total;
      } else {
        pagination.total = noticeList.value.length;
      }
      
      if (pages !== undefined && pages !== null) {
        pagination.totalPages = pages;
      } else {
        pagination.totalPages = Math.ceil(pagination.total / pageSize) || 1;
      }
      
      if (pageNum !== undefined && pageNum !== null) {
        pagination.page = pageNum;
      } else {
        pagination.page = page;
      }
      pagination.limit = pageSize;
    } else {
      noticeList.value = [];
      pagination.totalPages = 1;
      pagination.page = 1;
      pagination.total = 0;
    }
  } catch (error) {
    console.error('Error fetching notices:', error);
    message.error(error.message || trlang.value.failed_to_fetch_data);
    noticeList.value = [];
    pagination.totalPages = 1;
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

const handlePaginationChange = (page) => {
  pagination.page = page;
  fetchNotices(page, pagination.limit);
};

const handlePageSizeChange = (pageSize) => {
  pagination.limit = pageSize;
  pagination.page = 1;
  fetchNotices(1, pageSize);
};

const customRow = (record) => {
  return {
    onClick: () => {
      selectedNotice.value = record;
      showNoticeModal.value = true;
    },
  };
};

const handleModalClose = () => {
  showNoticeModal.value = false;
  selectedNotice.value = null;
};

onMounted(() => {
  fetchNotices(pagination.page, pagination.limit);
});
</script>

<style scoped>
.notice-list-page {
  min-height: 80vh;
}

.notice-list-page .notice-table {
  background: transparent;
}

.notice-list-page .notice-table :deep(.ant-table-tbody > tr) {
  cursor: pointer;
}


.notice-content {
  color: var(--white-color);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.question-modal .ant-modal-content) {
  background: rgb(35 33 48) !important;
  border: 1px solid var(--glass-border) !important;
}

:deep(.question-modal .ant-modal-header) {
  background: var(--glass-bg-light) !important;
  border-bottom: 1px solid var(--glass-border) !important;
}

:deep(.question-modal .ant-modal-title) {
  color: var(--white-color) !important;
  font-weight: 600;
}

:deep(.question-modal .ant-modal-close) {
  color: var(--white-color) !important;
}

:deep(.question-modal .ant-modal-close:hover) {
  color: var(--main-color) !important;
}

:deep(.question-modal .ant-modal-body) {
  color: var(--white-color) !important;
}

:deep(.question-modal .ant-modal-footer) {
  background: var(--glass-bg-light) !important;
  border-top: 1px solid var(--glass-border) !important;
}

:deep(.question-modal .ant-modal-footer .ant-btn:not(.ant-btn-primary)) {
  color: var(--white-color) !important;
  background: transparent !important;
  border-color: var(--glass-border) !important;
}

:deep(.question-modal .ant-modal-footer .ant-btn:not(.ant-btn-primary):hover) {
  color: var(--white-color) !important;
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-blue-border) !important;
}
</style>

