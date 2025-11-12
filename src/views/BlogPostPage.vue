<template>
  <div class="bg-primary-light radius-1 p-5 mt-5">
    <a-card :title="trlang.blog_posts" class="game-result-card">
      <div class="card-header">
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

      <div class="table-container">
        <a-table
          class="blog-table"
          row-key="_id"
          :columns="columns"
          :data-source="posts"
          :loading="loading"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'image'">
              <div class="image-cell">
                <img 
                  v-if="record.image" 
                  :src="getImageUrl(record.image)" 
                  alt="Post image"
                  class="post-image"
                />
                <span v-else class="no-image">-</span>
              </div>
            </template>
            <template v-else-if="column.key === 'title'">
              <div class="title-cell">{{ record.title }}</div>
            </template>
            <template v-else-if="column.key === 'description'">
              <div class="description-cell">{{ record.description }}</div>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)">
                {{ formatStatus(record.status) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-space>
                <a-button type="link" @click.stop="openEditModal(record)" :title="trlang.edit">
                  <template #icon>
                    <EditOutlined />
                  </template>
                </a-button>
                <a-button type="link" danger @click.stop="confirmDelete(record)" :title="trlang.delete">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-space>
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

      <a-form-item :label="trlang.image">
        <div class="image-upload-container">
          <a-upload
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            :remove="handleRemove"
            :accept="'image/*'"
            list-type="picture-card"
            :max-count="1"
            :disabled="submitting"
          >
            <div v-if="fileList.length < 1">
              <div class="upload-icon">+</div>
              <div class="upload-text">{{ trlang.upload_image }}</div>
            </div>
          </a-upload>
          <div v-if="formState.image && !fileList.length" class="image-preview">
            <img :src="getImageUrl(formState.image)" alt="Preview" />
            <a-button type="link" danger @click="clearImage" :disabled="submitting">
              {{ trlang.remove }}
            </a-button>
          </div>
        </div>
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

  <a-modal
    :open="deleteModalVisible"
    wrap-class-name="blog-modal blog-modal--delete"
    :footer="null"
    destroy-on-close
    centered
    @cancel="handleDeleteModalCancel"
  >
    <div class="blog-modal__header">
      <div class="blog-modal__badge blog-modal__badge--danger">
        <span>{{ trlang.delete }}</span>
      </div>
      <div class="blog-modal__heading">
        <h2>{{ trlang.delete_blog_post }}</h2>
        <p class="blog-modal__subtitle">
          {{ formatTranslation('confirm_delete_blog_post', { title: selectedPost?.title || '' }) }}
        </p>
      </div>
    </div>

    <div class="blog-modal__delete-content">
      <div class="delete-warning">
        <p>{{ trlang.delete_warning }}</p>
      </div>
    </div>

    <div class="blog-modal__footer">
      <a-button 
        class="blog-modal__btn blog-modal__btn--ghost" 
        @click="handleDeleteModalCancel" 
        :disabled="deleting"
      >
        {{ trlang.cancel }}
      </a-button>
      <a-button
        class="blog-modal__btn blog-modal__btn--danger"
        type="primary"
        danger
        @click="handleDeleteConfirm"
        :loading="deleting"
      >
        {{ trlang.delete }}
      </a-button>
    </div>
  </a-modal>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue';

import { deleteData, getData, postDataWithFile, putDataWithFile } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';
import { config } from '@/config/index.js';

const BLOG_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  ALL: 'all',
};

const BLOG_CATEGORY = {
  GENERAL: 'General',
  ANNOUNCEMENTS: 'Announcements',
  EVENTS: 'Events',
  TIPS: 'Tips',
  UPDATES: 'Updates',
  ALL: 'all',
};

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
const deleting = ref(false);
const modalVisible = ref(false);
const deleteModalVisible = ref(false);
const modalMode = ref('create');
const isEdit = computed(() => modalMode.value === 'edit');
const fileList = ref([]);
const selectedFile = ref(null);
const selectedPost = ref(null);

const filters = reactive({
  status: BLOG_STATUS.ALL,
  category: BLOG_CATEGORY.ALL,
});

const formState = reactive({
  _id: null,
  title: '',
  description: '',
  image: '',
  userId: '',
  category: BLOG_CATEGORY.GENERAL,
  status: BLOG_STATUS.DRAFT,
});

const statusOptions = computed(() => [
  { label: getTranslation('status_draft'), value: BLOG_STATUS.DRAFT },
  { label: getTranslation('status_published'), value: BLOG_STATUS.PUBLISHED },
  { label: getTranslation('status_archived'), value: BLOG_STATUS.ARCHIVED },
]);

const categoryOptions = computed(() => [
  { label: getTranslation('category_general'), value: BLOG_CATEGORY.GENERAL },
  { label: getTranslation('category_announcements'), value: BLOG_CATEGORY.ANNOUNCEMENTS },
  { label: getTranslation('category_events'), value: BLOG_CATEGORY.EVENTS },
  { label: getTranslation('category_tips'), value: BLOG_CATEGORY.TIPS },
  { label: getTranslation('category_updates'), value: BLOG_CATEGORY.UPDATES },
]);

const statusFilterOptions = computed(() => [
  { label: getTranslation('filter_all_statuses'), value: BLOG_STATUS.ALL },
  ...statusOptions.value,
]);

const categoryFilterOptions = computed(() => [
  { label: getTranslation('filter_all_categories'), value: BLOG_CATEGORY.ALL },
  ...categoryOptions.value,
]);

const pageSizeOptions = computed(() => [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]);

const columns = computed(() => [
  { title: getTranslation('image'), key: 'image', width: 100 },
  { title: getTranslation('title'), dataIndex: 'title', key: 'title', width: 150 },
  { title: getTranslation('description'), dataIndex: 'description', key: 'description', width: 200 },
  { title: getTranslation('category'), dataIndex: 'category', key: 'category' },
  { title: getTranslation('status'), dataIndex: 'status', key: 'status' },
  { title: getTranslation('actions'), key: 'action', width: 150 },
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
    case BLOG_STATUS.PUBLISHED:
      return 'green';
    case BLOG_STATUS.ARCHIVED:
      return 'default';
    default:
      return 'blue';
  }
};

const statusLabels = computed(() => ({
  [BLOG_STATUS.DRAFT]: getTranslation('status_draft'),
  [BLOG_STATUS.PUBLISHED]: getTranslation('status_published'),
  [BLOG_STATUS.ARCHIVED]: getTranslation('status_archived'),
}));

const formatStatus = (status) =>
  statusLabels.value[status] || getTranslation('status_unknown');

const resetForm = () => {
  formState._id = null;
  formState.title = '';
  formState.description = '';
  formState.image = '';
  formState.category = BLOG_CATEGORY.GENERAL;
  formState.status = BLOG_STATUS.DRAFT;
  formState.userId = currentUserId.value;
  fileList.value = [];
  selectedFile.value = null;
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseURL = config.baseURL.replace('/api/', '');
  return `${baseURL}${imagePath}`;
};

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error(getTranslation('please_upload_image_file'));
    return false;
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    message.error(getTranslation('image_must_be_smaller_than_5mb'));
    return false;
  }

  selectedFile.value = file;
  
  const previewFile = {
    uid: Date.now().toString(),
    name: file.name,
    status: 'done',
    url: URL.createObjectURL(file),
  };
  fileList.value = [previewFile];

  return false;
};

const handleRemove = () => {
  selectedFile.value = null;
  formState.image = '';
  fileList.value = [];
  return true;
};

const clearImage = () => {
  selectedFile.value = null;
  formState.image = '';
  fileList.value = [];
};

const mapPost = (item) => ({
  _id: item._id,
  title: item.title ?? '',
  description: item.description ?? '',
  image: item.image ?? '',
  userId: item.userId ?? '',
  category: item.category ?? BLOG_CATEGORY.GENERAL,
  status: item.status ?? BLOG_STATUS.DRAFT,
  published_at: item.published_at ?? null,
  createdAt: item.createdAt ?? null,
  updatedAt: item.updatedAt ?? null,
});

const fetchPosts = async () => {
  loading.value = true;

  try {
    const requestedPage = pagination.page;
    const params = new URLSearchParams();
    if (filters.status !== BLOG_STATUS.ALL) {
      params.set('status', filters.status);
    }
    if (filters.category !== BLOG_CATEGORY.ALL) {
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

const handleFilterChange = () => {
  pagination.page = 1;
  fetchPosts();
};

const handlePaginationChange = (page) => {
  pagination.page = page;
  fetchPosts();
};

const handlePageSizeChange = (pageSize) => {
  pagination.limit = pageSize;
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
  formState.category = record.category ?? BLOG_CATEGORY.GENERAL;
  formState.status = record.status ?? BLOG_STATUS.DRAFT;
  formState.userId = record.userId ?? currentUserId.value;
  
  if (formState.image) {
    fileList.value = [{
      uid: Date.now().toString(),
      name: 'current-image',
      status: 'done',
      url: getImageUrl(formState.image),
    }];
  } else {
    fileList.value = [];
  }
  
  modalVisible.value = true;
};

const handleModalCancel = () => {
  if (!submitting.value) {
    modalVisible.value = false;
    resetForm();
  }
};

const handleSubmit = async () => {
  if (!formState.title?.trim() || !formState.description?.trim()) {
    message.error(getTranslation('please_provide_title_description'));
    return;
  }

  submitting.value = true;

  try {
    const formData = new FormData();
    formData.append('title', formState.title.trim());
    formData.append('description', formState.description.trim());
    formData.append('category', formState.category);
    formData.append('status', formState.status);

    if (selectedFile.value) {
      formData.append('image', selectedFile.value);
    }

    let result;
    if (modalMode.value === 'create') {
      result = await postDataWithFile(apiLink.create_blog_post, formData);
    } else {
      result = await putDataWithFile(apiLink.update_blog_post(formState._id), formData);
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
  selectedPost.value = record;
  deleteModalVisible.value = true;
};

const handleDeleteModalCancel = () => {
  if (!deleting.value) {
    deleteModalVisible.value = false;
    selectedPost.value = null;
  }
};

const handleDeleteConfirm = async () => {
  if (!selectedPost.value?._id) {
    return;
  }

  deleting.value = true;

  try {
    const result = await deleteData(apiLink.delete_blog_post(selectedPost.value._id));

    if (result.status) {
      message.success(
        result.message || getTranslation('blog_post_deleted')
      );
      deleteModalVisible.value = false;
      selectedPost.value = null;
      
      if (posts.value.length <= 1 && pagination.page > 1) {
        pagination.page = Math.max(1, pagination.page - 1);
      }
      await fetchPosts();
    }
  } finally {
    deleting.value = false;
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
.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 16px;
  margin-bottom: 24px;
}

.filter-select {
  min-width: 160px;
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

.table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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

.image-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.post-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--glass-border);
}

.no-image {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.title-cell {
  font-weight: 600;
  font-size: 16px;
  color: var(--white-color);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description-cell {
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  line-height: 1.5;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ant-btn-link) {
  padding: 4px 8px;
  height: auto;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn-link .anticon) {
  font-size: 16px;
  color: var(--white-color);
  opacity: 0.8;
  transition: all 0.3s ease;
}

:deep(.ant-btn-link:hover .anticon) {
  opacity: 1;
  transform: scale(1.1);
}

:deep(.ant-btn-link.ant-btn-dangerous .anticon) {
  color: #ff4d4f;
}

:deep(.ant-btn-link.ant-btn-dangerous:hover .anticon) {
  color: #ff7875;
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
  background: var(--glass-bg) !important;
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  box-shadow: var(--glass-shadow) !important;
  border-radius: 20px;
}

:global(.blog-modal .ant-modal-header) {
  background: transparent !important;
  border-bottom: 1px solid var(--glass-border) !important;
  padding: 28px 28px 16px;
}

:global(.blog-modal .ant-modal-title) {
  color: var(--white-color) !important;
}

:global(.blog-modal .ant-modal-body) {
  padding: 0 28px 12px;
  background: transparent !important;
}

:global(.blog-modal .ant-modal-footer) {
  background: transparent !important;
  border-top: 1px solid var(--glass-border) !important;
  padding: 16px 28px 28px;
}

:global(.blog-modal .ant-modal-close-x) {
  color: var(--white-color) !important;
  border-radius: 50%;
  transition: background 0.3s ease;
  opacity: 0.75;
}

:global(.blog-modal .ant-modal-close-x:hover) {
  background: var(--glass-bg-light) !important;
  opacity: 1;
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
  background: var(--glass-blue) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-blue-border) !important;
  color: var(--white-color) !important;
  box-shadow: var(--glass-shadow) !important;
  width: fit-content;
}

.blog-modal__badge--danger {
  background: rgba(255, 77, 79, 0.2) !important;
  border: 1px solid rgba(255, 77, 79, 0.4) !important;
  color: #ff4d4f !important;
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
  color: var(--white-color);
  opacity: 0.8;
  font-size: 14px;
  line-height: 1.5;
}

.blog-modal__form :deep(.ant-form-item-label > label) {
  color: var(--white-color) !important;
  font-weight: 600;
  letter-spacing: 0.3px;
  opacity: 0.9;
}

.blog-modal__form :deep(.ant-input),
.blog-modal__form :deep(.ant-input:hover),
.blog-modal__form :deep(.ant-input:focus),
.blog-modal__form :deep(.ant-input-focused),
.blog-modal__form :deep(.ant-textarea),
.blog-modal__form :deep(.ant-textarea:hover),
.blog-modal__form :deep(.ant-textarea:focus),
.blog-modal__form :deep(.ant-select-selector),
.blog-modal__form :deep(.ant-picker),
.blog-modal__form :deep(.ant-picker:hover),
.blog-modal__form :deep(.ant-picker-focused) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  border-radius: 10px !important;
  transition: all 0.3s ease;
}

.blog-modal__form :deep(.ant-input::placeholder),
.blog-modal__form :deep(.ant-textarea::placeholder) {
  color: var(--white-color) !important;
  opacity: 0.6 !important;
}

.blog-modal__form :deep(.ant-input:focus),
.blog-modal__form :deep(.ant-textarea:focus),
.blog-modal__form :deep(.ant-select-focused .ant-select-selector),
.blog-modal__form :deep(.ant-picker-focused) {
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.blog-modal__form :deep(.ant-select-arrow),
.blog-modal__form :deep(.ant-picker-suffix),
.blog-modal__form :deep(.ant-picker-clear) {
  color: var(--white-color) !important;
  opacity: 0.75;
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
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
}

.blog-modal__btn--ghost:hover {
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-border-light) !important;
  color: var(--white-color) !important;
}

.blog-modal__btn--primary {
  background: var(--glass-blue) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-blue-border) !important;
  box-shadow: var(--glass-shadow) !important;
  color: var(--white-color) !important;
}

.blog-modal__btn--primary:hover {
  background: var(--glass-blue-light) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: var(--glass-shadow-strong) !important;
  color: var(--white-color) !important;
}

.blog-modal__btn--danger {
  background: rgba(255, 77, 79, 0.9) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid rgba(255, 77, 79, 0.5) !important;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3) !important;
  color: var(--white-color) !important;
}

.blog-modal__btn--danger:hover {
  background: rgba(255, 77, 79, 1) !important;
  border-color: rgba(255, 77, 79, 0.7) !important;
  box-shadow: 0 6px 16px rgba(255, 77, 79, 0.4) !important;
  color: var(--white-color) !important;
}

.blog-modal__btn--danger:active {
  background: rgba(255, 77, 79, 0.8) !important;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3) !important;
}

.blog-modal__delete-content {
  margin: 24px 0;
  padding: 20px;
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid rgba(255, 77, 79, 0.3);
  border-radius: 12px;
}

.delete-warning {
  display: flex;
  align-items: center;
  gap: 12px;
}

.delete-warning p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  line-height: 1.6;
}

:global(.blog-modal--delete .ant-modal-content) {
  border-color: rgba(255, 77, 79, 0.2) !important;
}

:global(.blog-modal--delete .ant-modal-header) {
  border-bottom-color: rgba(255, 77, 79, 0.2) !important;
}

:global(.blog-modal--delete .ant-modal-footer) {
  border-top-color: rgba(255, 77, 79, 0.2) !important;
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

.image-upload-container {
  width: 100%;
}

.image-upload-container :deep(.ant-upload-select-picture-card) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  border-radius: 10px !important;
  transition: all 0.3s ease;
}

.image-upload-container :deep(.ant-upload-select-picture-card:hover) {
  background: var(--glass-bg-light) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.upload-icon {
  font-size: 32px;
  color: var(--white-color);
  margin-bottom: 8px;
}

.upload-text {
  color: var(--white-color);
  opacity: 0.8;
  font-size: 14px;
}

.image-preview {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  border: 1px solid var(--glass-border);
  object-fit: cover;
}

.image-upload-container :deep(.ant-upload-list-picture-card .ant-upload-list-item) {
  background: var(--glass-bg-dark) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 10px !important;
}

.image-upload-container :deep(.ant-upload-list-picture-card .ant-upload-list-item-thumbnail img) {
  border-radius: 8px;
}

.image-upload-container :deep(.ant-upload-list-picture-card .ant-upload-list-item-actions) {
  display: flex;
  justify-content: center;
}

.image-upload-container :deep(.ant-upload-list-picture-card .ant-upload-list-item-actions .anticon-eye) {
  display: none;
}

.image-upload-container :deep(.ant-upload-list-picture-card .ant-upload-list-item-actions .anticon-eye-invisible) {
  display: none;
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

  .table-container {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  .table-container::-webkit-scrollbar {
    height: 8px;
  }

  .table-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .table-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
  }

  .table-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .blog-table {
    min-width: 800px;
  }
}
</style>