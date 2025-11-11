<template>
  <div class="blog-post-page">
    <div class="page-container">
      <a-card class="blog-card" :bordered="false">
        <div class="card-header">
          <div>
            <h1 class="card-title">{{ trlang.blog_posts }}</h1>
          </div>
          <a-space align="center">
            <a-select
              v-model:value="filters.status"
              class="filter-select glass-select"
              :options="statusFilterOptions"
              dropdown-class-name="glass-select-dropdown"
              @change="handleFilterChange"
            >
              <template #suffixIcon>
                <span class="glass-select__icon">▾</span>
              </template>
            </a-select>
            <a-select
              v-model:value="filters.category"
              class="filter-select glass-select"
              :options="categoryFilterOptions"
              dropdown-class-name="glass-select-dropdown"
              @change="handleFilterChange"
            >
              <template #suffixIcon>
                <span class="glass-select__icon">▾</span>
              </template>
            </a-select>
            <a-button class="glass-primary-btn" type="primary" @click="openCreateModal">
              {{ trlang.new_post }}
            </a-button>
          </a-space>
        </div>

        <a-table
          class="blog-table"
          row-key="_id"
          :columns="columns"
          :data-source="posts"
          :loading="loading"
          :pagination="{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: false
          }"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'title'">
              <div class="title-cell">
                <div class="title">{{ record.title }}</div>
                <div class="description">{{ record.description }}</div>
              </div>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)">
                {{ formatStatus(record.status) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" @click.stop="openEditModal(record)">
                  {{ trlang.edit }}
                </a-button>
                <a-button type="link" danger @click.stop="confirmDelete(record)">
                  {{ trlang.delete }}
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </div>

  <a-modal
    :open="modalVisible"
    :confirm-loading="submitting"
    wrap-class-name="blog-modal"
    :footer="null"
    destroy-on-close
    centered
    @cancel="handleModalCancel"
  >
    <div class="blog-modal__header">
      <div class="blog-modal__badge">
        <span>{{ isEdit ? trlang.edit_post : trlang.new_post }}</span>
      </div>
        <div class="blog-modal__heading">
          <h2>{{ isEdit ? trlang.update_blog_post : trlang.create_blog_post }}</h2>
          <p class="blog-modal__subtitle">
            {{
              isEdit
                ? trlang.blog_edit_subtitle
                : trlang.blog_create_subtitle
            }}
          </p>
        </div>
      </div>

    <a-form layout="vertical" class="blog-modal__form">
      <a-form-item :label="trlang.title" required>
        <a-input
          v-model:value="formState.title"
          :placeholder="trlang.enter_descriptive_title"
          :disabled="submitting"
          size="large"
        />
      </a-form-item>

      <a-form-item :label="trlang.description" required>
        <a-textarea
          v-model:value="formState.description"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          :placeholder="trlang.write_post_content"
          :disabled="submitting"
        />
      </a-form-item>

      <a-form-item :label="trlang.image_url">
        <a-input
          v-model:value="formState.image"
          :placeholder="trlang.image_url_placeholder"
          :disabled="submitting"
        />
      </a-form-item>
      <a-form-item :label="trlang.category" required>
        <a-select
          v-model:value="formState.category"
          :options="categoryOptions"
          dropdown-class-name="glass-select-dropdown"
          class="glass-select"
          :disabled="submitting"
        >
          <template #suffixIcon>
            <span class="glass-select__icon">▾</span>
          </template>
        </a-select>
      </a-form-item>
    </a-form>

    <div class="blog-modal__footer">
      <a-button class="blog-modal__btn blog-modal__btn--ghost" @click="handleModalCancel" :disabled="submitting">
        {{ trlang.cancel }}
      </a-button>
      <a-button
        class="blog-modal__btn blog-modal__btn--primary"
        type="primary"
        @click="handleSubmit"
        :loading="submitting"
      >
        {{ isEdit ? trlang.save_changes : trlang.create_post }}
      </a-button>
    </div>
  </a-modal>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
import { message, Modal } from 'ant-design-vue';

import { deleteData, getData, postData, putData } from '@/helpers/Axios.js';
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

const posts = ref([]);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});

const loading = ref(false);
const submitting = ref(false);
const modalVisible = ref(false);
const modalMode = ref('create');
const isEdit = computed(() => modalMode.value === 'edit');

const filters = reactive({
  status: 'all',
  category: 'all',
});

const formState = reactive({
  _id: null,
  title: '',
  description: '',
  image: '',
  userId: '',
  category: 'General',
  status: 'draft',
});

const statusOptions = computed(() => [
  { label: getTranslation('status_draft'), value: 'draft' },
  { label: getTranslation('status_published'), value: 'published' },
  { label: getTranslation('status_archived'), value: 'archived' },
]);

const categoryOptions = computed(() => [
  { label: getTranslation('category_general'), value: 'General' },
  { label: getTranslation('category_announcements'), value: 'Announcements' },
  { label: getTranslation('category_events'), value: 'Events' },
  { label: getTranslation('category_tips'), value: 'Tips' },
  { label: getTranslation('category_updates'), value: 'Updates' },
]);

const statusFilterOptions = computed(() => [
  { label: getTranslation('filter_all_statuses'), value: 'all' },
  ...statusOptions.value,
]);

const categoryFilterOptions = computed(() => [
  { label: getTranslation('filter_all_categories'), value: 'all' },
  ...categoryOptions.value,
]);

const columns = computed(() => [
  { title: getTranslation('title'), dataIndex: 'title', key: 'title' },
  { title: getTranslation('category'), dataIndex: 'category', key: 'category' },
  { title: getTranslation('status'), dataIndex: 'status', key: 'status' },
  { title: getTranslation('actions'), key: 'action' },
]);

const decodeJwtPayload = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem('token');
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = window.atob(padded);

    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode token payload', error);
    return null;
  }
};

const currentUserId = computed(() => decodeJwtPayload()?.id ?? '');

const statusColor = (status) => {
  switch (status) {
    case 'published':
      return 'green';
    case 'archived':
      return 'default';
    default:
      return 'blue';
  }
};

const statusLabels = computed(() => ({
  draft: getTranslation('status_draft'),
  published: getTranslation('status_published'),
  archived: getTranslation('status_archived'),
}));

const formatStatus = (status) =>
  statusLabels.value[status] || getTranslation('status_unknown');

const resetForm = () => {
  formState._id = null;
  formState.title = '';
  formState.description = '';
  formState.image = '';
  formState.category = 'General';
  formState.status = 'draft';
  formState.userId = currentUserId.value;
};

const mapPost = (item) => ({
  _id: item._id,
  title: item.title ?? '',
  description: item.description ?? '',
  image: item.image ?? '',
  userId: item.userId ?? '',
  category: item.category ?? 'General',
  status: item.status ?? 'draft',
  published_at: item.published_at ?? null,
  createdAt: item.createdAt ?? null,
  updatedAt: item.updatedAt ?? null,
});

const fetchPosts = async () => {
  loading.value = true;

  try {
    const requestedPage = pagination.page;
    const params = new URLSearchParams();
    if (filters.status !== 'all') {
      params.set('status', filters.status);
    }
    if (filters.category !== 'all') {
      params.set('category', filters.category);
    }
    params.set('page', String(requestedPage));
    params.set('limit', String(pagination.limit));

    const endpoint = `${apiLink.blog_posts}?${params.toString()}`;
    const result = await getData(endpoint);

    if (result.status && result.data) {
      const {
        items = [],
        total = 0,
        totalPages = 1,
        page = requestedPage,
        limit = pagination.limit,
      } = result.data || {};

      posts.value = Array.isArray(items) ? items.map(mapPost) : [];

      const sanitizedLimit =
        Number.isFinite(limit) && limit > 0 ? limit : pagination.limit;
      pagination.limit = sanitizedLimit;

      const sanitizedTotal = Number.isFinite(total) ? total : posts.value.length;
      pagination.total = sanitizedTotal;

      const sanitizedTotalPages =
        Number.isFinite(totalPages) && totalPages > 0
          ? totalPages
          : Math.max(1, Math.ceil(sanitizedTotal / sanitizedLimit) || 1);
      pagination.totalPages = sanitizedTotalPages;

      const sanitizedPage =
        Number.isFinite(page) && page > 0
          ? Math.min(page, sanitizedTotalPages)
          : Math.min(requestedPage, sanitizedTotalPages);
      const resolvedPage = sanitizedPage || 1;

      const shouldRefetch =
        sanitizedTotal > 0 &&
        posts.value.length === 0 &&
        resolvedPage !== requestedPage;

      pagination.page = resolvedPage;

      if (shouldRefetch) {
        await fetchPosts();
        return;
      }
    } else {
      posts.value = [];
      pagination.total = 0;
      pagination.totalPages = 1;
      pagination.page = 1;
    }
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (paginationInfo) => {
  const nextPage = paginationInfo?.current ?? pagination.page;
  if (nextPage !== pagination.page) {
    pagination.page = nextPage;
    fetchPosts();
  }
};

const handleFilterChange = () => {
  pagination.page = 1;
  fetchPosts();
};

const openCreateModal = () => {
  modalMode.value = 'create';
  resetForm();
  modalVisible.value = true;
};

const openEditModal = (record) => {
  modalMode.value = 'edit';
  formState._id = record._id;
  formState.title = record.title;
  formState.description = record.description;
  formState.image = record.image ?? '';
  formState.category = record.category ?? 'General';
  formState.status = record.status ?? 'draft';
  formState.userId = record.userId ?? currentUserId.value;
  modalVisible.value = true;
};

const handleModalCancel = () => {
  if (!submitting.value) {
    modalVisible.value = false;
    resetForm();
  }
};

const buildPayload = () => {
  const payload = {
    title: formState.title.trim(),
    description: formState.description.trim(),
    image: formState.image ? formState.image.trim() : '',
    category: formState.category,
    status: formState.status,
  };

  if (!payload.title || !payload.description) {
    return null;
  }

  if (!payload.image) {
    payload.image = null;
  }

  return payload;
};

const handleSubmit = async () => {
  const payload = buildPayload();

  if (!payload) {
    message.error(getTranslation('please_provide_title_description'));
    return;
  }

  submitting.value = true;

  try {
    let result;
    if (modalMode.value === 'create') {
      result = await postData(apiLink.create_blog_post, payload);
    } else {
      result = await putData(apiLink.update_blog_post(formState._id), payload);
    }

    if (result.status) {
      message.success(
        result.message ||
          getTranslation('changes_saved_successfully')
      );
      modalVisible.value = false;
      resetForm();
      if (modalMode.value === 'create') {
        pagination.page = 1;
      }
      await fetchPosts();
    }
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = (record) => {
  Modal.confirm({
    title: getTranslation('delete_blog_post'),
    content: formatTranslation('confirm_delete_blog_post', {
      title: record.title,
    }),
    okText: getTranslation('delete'),
    okType: 'danger',
    cancelText: getTranslation('cancel'),
    onOk: () => handleDelete(record._id),
  });
};

const handleDelete = async (postId) => {
  const result = await deleteData(apiLink.delete_blog_post(postId));

  if (result.status) {
    message.success(
      result.message || getTranslation('blog_post_deleted')
    );
    if (posts.value.length <= 1 && pagination.page > 1) {
      pagination.page = Math.max(1, pagination.page - 1);
    }
    await fetchPosts();
  }
};

watch(
  () => currentUserId.value,
  (value) => {
    if (value && !formState.userId) {
      formState.userId = value;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  formState.userId = currentUserId.value;
  await fetchPosts();
});
</script>

<style scoped>
.blog-post-page {
  min-height: 80vh;
  padding: 24px 0;
}

.page-container {
  max-width: 1100px;
  margin: 0 auto;
}

.blog-card {
  background: var(--glass-bg-light);
  border-radius: 20px;
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  padding: 24px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.card-title {
  color: var(--white-color);
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.card-subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.filter-select {
  min-width: 160px;
}

.glass-select :deep(.ant-select-selector) {
  background: rgba(15, 23, 42, 0.65) !important;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  color: var(--white-color) !important;
  border-radius: 12px !important;
  height: 44px !important;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.glass-select :deep(.ant-select-selection-item),
.glass-select :deep(.ant-select-selection-placeholder) {
  color: rgba(226, 232, 240, 0.85) !important;
}

.glass-select :deep(.ant-select-selector:hover),
.glass-select :deep(.ant-select-focused .ant-select-selector) {
  border-color: rgba(99, 102, 241, 0.55) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.glass-select__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(226, 232, 240, 0.85);
  font-size: 12px;
  transition: color 0.2s ease;
}

.blog-modal__form .glass-select {
  width: 100%;
}

:global(.glass-select-dropdown .ant-select-item-option-content) {
  font-weight: 500;
}

.glass-primary-btn {
  height: 44px;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(139, 92, 246, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.35);
  backdrop-filter: blur(6px);
  color: var(--white-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.glass-primary-btn:hover,
.glass-primary-btn:focus {
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(99, 102, 241, 1), rgba(139, 92, 246, 1));
  box-shadow: 0 18px 34px rgba(99, 102, 241, 0.45);
  color: var(--white-color);
}

.glass-primary-btn:active {
  transform: translateY(0);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.35);
}

.blog-table :deep(.ant-table) {
  background: transparent;
  color: var(--white-color);
}

.blog-table :deep(.ant-table-thead > tr > th) {
  background: rgba(255, 255, 255, 0.08);
  color: var(--white-color);
  border: none;
}

.blog-table :deep(.ant-table-tbody > tr > td) {
  background: rgba(22, 27, 34, 0.6);
  border: none;
}

.blog-table :deep(.ant-table-placeholder) {
  background: rgba(22, 27, 34, 0.6);
  color: var(--white-color);
  pointer-events: none;
}

.blog-table :deep(.ant-table-placeholder:hover) {
  background: rgba(22, 27, 34, 0.6) !important;
}

.blog-table :deep(.ant-table-tbody > tr:not(.ant-table-placeholder):hover > td) {
  background: rgba(99, 102, 241, 0.2) !important;
}

.blog-table :deep(.ant-empty-description) {
  color: var(--white-color);
}

.title-cell .title {
  font-weight: 600;
  font-size: 16px;
  color: var(--white-color);
}

.title-cell .description {
  color: rgba(255, 255, 255, 0.65);
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.blog-card :deep(.ant-select-selector),
.blog-card :deep(.ant-input),
.blog-card :deep(.ant-input:hover),
.blog-card :deep(.ant-input:focus),
.blog-card :deep(.ant-input-focused),
.blog-card :deep(.ant-picker),
.blog-card :deep(.ant-picker:hover),
.blog-card :deep(.ant-picker-focused) {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.15) !important;
  color: var(--white-color) !important;
}

.blog-card :deep(.ant-picker-suffix),
.blog-card :deep(.ant-picker-clear),
.blog-card :deep(.ant-input-prefix),
.blog-card :deep(.ant-input-suffix) {
  color: var(--white-color) !important;
}

.blog-card :deep(.ant-tag) {
  border-radius: 16px;
  padding: 2px 12px;
  font-weight: 600;
}

.blog-card :deep(.ant-modal-content) {
  background: rgba(18, 22, 31, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--white-color);
}

.blog-card :deep(.ant-modal-header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.blog-card :deep(.ant-modal-title) {
  color: var(--white-color);
}

.blog-card :deep(.ant-modal-footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

:global(.glass-select-dropdown) {
  background: rgba(12, 16, 24, 0.96);
  border: 1px solid rgba(99, 102, 241, 0.35);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(16px);
  color: rgba(226, 232, 240, 0.9);
  border-radius: 14px;
  overflow: hidden;
}

:global(.glass-select-dropdown .ant-select-item-option) {
  color: rgba(226, 232, 240, 0.9);
}

:global(.glass-select-dropdown .ant-select-item-option-active),
:global(.glass-select-dropdown .ant-select-item-option-selected) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.45), rgba(139, 92, 246, 0.45));
  color: #fff;
}

:deep(.ant-picker-dropdown) {
  background: rgba(18, 24, 33, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  color: #fff;
}

:deep(.ant-picker-panel-container) {
  background: transparent;
}

:deep(.ant-picker-cell) {
  color: rgba(255, 255, 255, 0.85);
}

:deep(.ant-picker-cell-in-view.ant-picker-cell-range-hover),
:deep(.ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner),
:deep(.ant-picker-cell-in-view.ant-picker-cell-range-start .ant-picker-cell-inner),
:deep(.ant-picker-cell-in-view.ant-picker-cell-range-end .ant-picker-cell-inner) {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.45), rgba(139, 92, 246, 0.45)) !important;
}

:global(.blog-modal .ant-modal-content) {
  background: rgba(12, 16, 24, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  backdrop-filter: blur(18px);
  border-radius: 20px;
}

:global(.blog-modal .ant-modal-header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 28px 28px 16px;
}

:global(.blog-modal .ant-modal-title) {
  color: #fff;
}

:global(.blog-modal .ant-modal-body) {
  padding: 0 28px 12px;
}

:global(.blog-modal .ant-modal-footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px 28px 28px;
}

:global(.blog-modal .ant-modal-close-x) {
  color: rgba(226, 232, 240, 0.75);
  border-radius: 50%;
  transition: background 0.3s ease;
}

:global(.blog-modal .ant-modal-close-x:hover) {
  background: rgba(148, 163, 184, 0.2);
}

.blog-modal__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.blog-modal__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.35px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
  color: #fff;
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.35);
  width: fit-content;
}

.blog-modal__heading h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--white-color);
  letter-spacing: -0.25px;
}

.blog-modal__subtitle {
  margin: 6px 0 0;
  color: rgba(226, 232, 240, 0.8);
  font-size: 14px;
  line-height: 1.5;
}

.blog-modal__form :deep(.ant-form-item-label > label) {
  color: rgba(226, 232, 240, 0.9) !important;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.blog-modal__form :deep(.ant-input),
.blog-modal__form :deep(.ant-input:hover),
.blog-modal__form :deep(.ant-input:focus),
.blog-modal__form :deep(.ant-input-focused),
.blog-modal__form :deep(.ant-select-selector),
.blog-modal__form :deep(.ant-picker),
.blog-modal__form :deep(.ant-picker:hover),
.blog-modal__form :deep(.ant-picker-focused) {
  background: rgba(15, 23, 42, 0.65) !important;
  border: 1px solid rgba(148, 163, 184, 0.25) !important;
  color: var(--white-color) !important;
  border-radius: 12px !important;
  transition: all 0.3s ease;
}

.blog-modal__form :deep(.ant-input:focus),
.blog-modal__form :deep(.ant-select-focused .ant-select-selector),
.blog-modal__form :deep(.ant-picker-focused) {
  border-color: rgba(99, 102, 241, 0.55) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
}

.blog-modal__form :deep(.ant-select-arrow),
.blog-modal__form :deep(.ant-picker-suffix),
.blog-modal__form :deep(.ant-picker-clear) {
  color: rgba(255, 255, 255, 0.75) !important;
}

.blog-modal__footer {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.blog-modal__btn {
  height: 46px;
  min-width: 130px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.blog-modal__btn--ghost {
  background: rgba(148, 163, 184, 0.16);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: rgba(226, 232, 240, 0.85);
}

.blog-modal__btn--ghost:hover {
  background: rgba(148, 163, 184, 0.24);
  border-color: rgba(148, 163, 184, 0.55);
  color: #fff;
}

.blog-modal__btn--primary {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
  border: none;
  box-shadow: 0 12px 28px rgba(99, 102, 241, 0.35);
}

.blog-modal__btn--primary:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 1), rgba(139, 92, 246, 1));
  box-shadow: 0 16px 32px rgba(99, 102, 241, 0.45);
}

.blog-card :deep(.ant-pagination) {
  display: flex;
  justify-content: flex-end;
  color: var(--white-color);
}

.blog-card :deep(.ant-pagination-item) {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(22, 27, 34, 0.6);
}

.blog-card :deep(.ant-pagination-item a) {
  color: rgba(226, 232, 240, 0.85);
}

.blog-card :deep(.ant-pagination-item-active) {
  border-color: rgba(99, 102, 241, 0.7);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.85), rgba(139, 92, 246, 0.85));
  box-shadow: 0 10px 18px rgba(99, 102, 241, 0.35);
}

.blog-card :deep(.ant-pagination-item-active a) {
  color: #fff;
}

.blog-card :deep(.ant-pagination-item:hover) {
  border-color: rgba(99, 102, 241, 0.55);
}

.blog-card :deep(.ant-pagination-item-link) {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(22, 27, 34, 0.6);
  color: rgba(226, 232, 240, 0.85);
}

.blog-card :deep(.ant-pagination-item-link:hover) {
  border-color: rgba(99, 102, 241, 0.55);
  color: #fff;
}

.blog-card :deep(.ant-pagination-disabled .ant-pagination-item-link),
.blog-card :deep(.ant-pagination-disabled .ant-pagination-item-link:hover) {
  color: rgba(148, 163, 184, 0.45);
  border-color: rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.6);
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-select {
    width: 100%;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>