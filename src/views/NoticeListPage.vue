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
              <div class="text-center text-white py-4">
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, reactive } from 'vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const loading = ref(false);
const noticeList = ref([]);
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
        pagination.totalPages = pages;
      } else if (total !== undefined && total !== null) {
        pagination.total = total;
        pagination.totalPages = Math.ceil(total / pageSize) || 1;
      } else {
        pagination.total = noticeList.value.length;
        pagination.totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
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
    console.warn('Notices API not available yet:', error);
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

onMounted(() => {
  fetchNotices(pagination.page, pagination.limit);
});
</script>

<style scoped>
.notice-list-page {
  min-height: 80vh;
}

.notice-table {
  background: transparent;
}
</style>

