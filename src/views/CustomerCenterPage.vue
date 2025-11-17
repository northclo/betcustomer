<template>
  <div class="customer-center-page">
    <div class="bg-primary-light radius-2 p-3 mt-2">
      <a-card :title="trlang.customer_center" class="game-result-card">
        <div>
          <a-table
            :columns="questionColumns"
            :data-source="questionList"
            :loading="loading"
            :pagination="false"
            :row-selection="rowSelection"
            :row-key="(record) => record._id || record.id"
            size="middle"
            :bordered="false"
            class="question-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'index'">
                <span class="table-cell-content">{{ record.index }}</span>
              </template>
              <template v-else-if="column.key === 'title'">
                <span class="table-cell-content">
                  <span :class="getStatusClass(record.status)">{{ getStatusText(record.status) }}</span>
                  {{ record.title }}
                </span>
              </template>
              <template v-else-if="column.key === 'writer'">
                <span class="table-cell-content">{{ record.writer }}</span>
              </template>
              <template v-else-if="column.key === 'date'">
                <span class="table-cell-content">{{ formatDate(record.date) }}</span>
              </template>
              <template v-else-if="column.key === 'actions'">
                <div class="action-buttons">
                  <a-button
                    type="text"
                    size="small"
                    :disabled="record.status !== 'pending'"
                    @click="handleEdit(record)"
                    class="action-btn-edit"
                    :title="trlang.edit"
                  >
                    <template #icon><EditOutlined /></template>
                  </a-button>
                  <a-button
                    type="text"
                    size="small"
                    danger
                    @click="handleDelete(record)"
                    class="action-btn-delete"
                    :title="trlang.delete"
                  >
                    <template #icon><DeleteOutlined /></template>
                  </a-button>
                </div>
              </template>
            </template>
            <template #emptyText>
              <div class="text-center text-white py-4">{{ trlang.no_data }}</div>
            </template>
          </a-table>

          <div class="action-bar mt-3">
            <a-button
              type="primary"
              danger
              :disabled="selectedRowKeys.length === 0"
              :loading="deleting"
              @click="handleDeleteList"
            >
              {{ trlang.delete_list }}
            </a-button>

            <div class="pagination-controls">
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

            <a-button
              type="primary"
              @click="handleNewQuestion"
            >
              {{ trlang.send_question }}
            </a-button>
          </div>
        </div>
      </a-card>

      <a-modal
        v-model:open="showModal"
        :title="isEditMode ? trlang.edit_question : trlang.send_question"
        :width="600"
        :mask-closable="false"
        class="question-modal"
        @cancel="handleModalCancel"
      >
        <template #footer>
          <a-button @click="handleModalCancel">
            {{ trlang.cancel }}
          </a-button>
          <a-button
            type="primary"
            :loading="sending"
            :disabled="!canSendQuestion"
            @click="handleSendQuestion"
          >
            {{ isEditMode ? trlang.update : trlang.send_question }}
          </a-button>
        </template>

        <div class="question-form-modal">
          <div class="form-group">
            <label class="form-label">{{ trlang.title }}</label>
            <a-input
              v-model:value="questionTitle"
              :placeholder="trlang.enter_title"
              size="large"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ trlang.question_content }}</label>
            <a-textarea
              v-model:value="questionContent"
              :placeholder="trlang.enter_question_content"
              :rows="8"
              size="large"
              class="form-textarea"
            />
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, h } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { getData, postData, putData, deleteData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

// ✅ state
const loading = ref(false);
const deleting = ref(false);
const sending = ref(false);
const questionList = ref([]);
const selectedRowKeys = ref([]);
const showModal = ref(false);
const isEditMode = ref(false);
const editingQuestionId = ref(null);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);
const siteSettings = ref(null);

// Form fields
const questionTitle = ref('');
const questionContent = ref('');

// ✅ computed
const canSendQuestion = computed(() => {
  return questionTitle.value.trim() && questionContent.value.trim() && !sending.value;
});

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1);
});

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = keys;
  },
  getCheckboxProps: (record) => ({
    name: record._id || record.id,
  }),
}));

// ✅ table columns
const questionColumns = computed(() => [
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
    title: trlang.value.actions,
    key: 'actions',
    align: 'center',
    width: 150,
    fixed: 'right',
  },
]);

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

const getStatusText = (status) => {
  // Map backend status to display text
  if (status === 'resolved') {
    return getTranslation('answer_completed');
  }
  return getTranslation('answer_waiting');
};

const getStatusClass = (status) => {
  if (status === 'resolved' || status === 'COMPLETE') {
    return 'status-completed';
  }
  return 'status-waiting';
};

const fetchQuestions = async () => {
  loading.value = true;
  try {
    // Check if API endpoint exists, if not return empty list
    if (!apiLink.get_questions) {
      questionList.value = [];
      totalPages.value = 1;
      currentPage.value = 1;
      return;
    }

    const result = await getData(`${apiLink.get_questions}?page=${currentPage.value}&limit=${pageSize.value}`);
    
    if (result.status && result.data) {
      const { questions, page, totalPages: pages, total } = result.data;
      questionList.value = (questions || []).map((item, index) => ({
        _id: item._id || item.id,
        index: item.index || (page - 1) * pageSize.value + index + 1,
        title: item.title || '',
        writer: item.writer || '',
        date: item.createdAt ? new Date(item.createdAt) : (item.date ? new Date(item.date) : new Date()),
        status: item.status || 'pending',
        question: item.question || '',
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
      questionList.value = [];
      totalPages.value = 1;
      currentPage.value = 1;
    }
  } catch (error) {
    // Silently handle 404 or other API errors - API endpoint may not be implemented yet
    console.warn('Questions API not available yet:', error);
    questionList.value = [];
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
};

const handleDeleteList = () => {
  if (selectedRowKeys.value.length === 0) {
    return message.warning(getTranslation('please_select_questions_to_delete'));
  }

  const count = selectedRowKeys.value.length;
  const confirmMessage = getTranslation('confirm_delete_questions_count')?.replace('{count}', count) || 
                         getTranslation('confirm_delete_questions_message');

  Modal.confirm({
    title: getTranslation('confirm_delete_questions'),
    icon: () => h(ExclamationCircleOutlined),
    content: confirmMessage,
    okText: getTranslation('confirm'),
    cancelText: getTranslation('cancel'),
    wrapClassName: 'confirm-modal-glass',
    onOk: async () => {
      deleting.value = true;
      try {
        const result = await postData(apiLink.bulk_delete_questions, {
          ids: selectedRowKeys.value
        });

        if (result.status) {
          const deletedCount = result.data?.deletedCount || selectedRowKeys.value.length;
          const successMessage = getTranslation('successfully_deleted_questions_count')?.replace('{count}', deletedCount) || 
                                 getTranslation('questions_deleted_successfully');
          message.success(successMessage);
          selectedRowKeys.value = [];
          fetchQuestions();
        } else {
          message.error(getTranslation('failed_to_delete_questions'));
        }
      } catch (error) {
        console.error('Error deleting questions:', error);
        message.error(getTranslation('failed_to_delete_questions'));
      } finally {
        deleting.value = false;
      }
    },
  });
};

const fetchSiteSettings = async () => {
  try {
    const result = await getData(apiLink.get_site_setting);
    if (result.status && result.data) {
      siteSettings.value = result.data;
    }
  } catch (error) {
    console.warn('Failed to fetch site settings:', error);
    siteSettings.value = { customer_center: true };
  }
};

const checkPendingInquiries = () => {
  if (siteSettings.value?.customer_center) {
    const hasPending = questionList.value.some(
      (q) => q.status === 'pending' || q.status === 'PENDING'
    );
    
    return hasPending;
  }
  
  return false;
};

const handleNewQuestion = () => {
  if (checkPendingInquiries()) {
    message.error(getTranslation('cannot_submit_new_inquiry_with_pending'));
    return;
  }
  
  isEditMode.value = false;
  editingQuestionId.value = null;
  questionTitle.value = '';
  questionContent.value = '';
  showModal.value = true;
};

const handleEdit = (record) => {
  if (record.status !== 'pending') {
    return message.warning(getTranslation('cannot_edit_resolved_question'));
  }
  isEditMode.value = true;
  editingQuestionId.value = record._id || record.id;
  questionTitle.value = record.title || '';
  questionContent.value = record.question || '';
  showModal.value = true;
};

const handleDelete = (record) => {
  const questionId = record._id || record.id;
  if (!questionId) {
    return message.error(getTranslation('invalid_question_id'));
  }

  Modal.confirm({
    title: getTranslation('confirm_delete_question'),
    icon: () => h(ExclamationCircleOutlined),
    content: getTranslation('confirm_delete_question_message'),
    okText: getTranslation('confirm'),
    cancelText: getTranslation('cancel'),
    wrapClassName: 'confirm-modal-glass',
    onOk: async () => {
      try {
        const result = await deleteData(`${apiLink.delete_question}/${questionId}`);
        
        if (result.status) {
          message.success(result.message || getTranslation('question_deleted_successfully'));
          fetchQuestions();
          selectedRowKeys.value = selectedRowKeys.value.filter(id => id !== questionId);
        } else {
          message.error(result.message || getTranslation('failed_to_delete_question'));
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        message.error(getTranslation('failed_to_delete_question'));
      }
    },
  });
};

const handleSendQuestion = async () => {
  if (!canSendQuestion.value) {
    return message.error(getTranslation('please_fill_in_all_fields'));
  }

  if (!isEditMode.value && checkPendingInquiries()) {
    message.error(getTranslation('cannot_submit_new_inquiry_with_pending'));
    return;
  }

  sending.value = true;
  try {
    let result;
    
    if (isEditMode.value && editingQuestionId.value) {
      result = await putData(`${apiLink.update_question}/${editingQuestionId.value}`, {
        title: questionTitle.value.trim(),
        question: questionContent.value.trim(),
      });
      
      if (result.status) {
        message.success(result.message || getTranslation('question_updated_successfully'));
      } else {
        message.error(result.message || getTranslation('failed_to_update_question'));
        sending.value = false;
        return;
      }
    } else {
      result = await postData(apiLink.submit_contact, {
        title: questionTitle.value.trim(),
        question: questionContent.value.trim(),
      });
      
      if (result.status) {
        message.success(result.message || getTranslation('questions_sent_successfully'));
      } else {
        message.error(result.message || getTranslation('failed_to_send_questions'));
        sending.value = false;
        return;
      }
    }

    questionTitle.value = '';
    questionContent.value = '';
    isEditMode.value = false;
    editingQuestionId.value = null;
    showModal.value = false;
    fetchQuestions();
  } catch (error) {
    console.error('Error saving question:', error);
    message.error(getTranslation('unexpected_error_try_again'));
  } finally {
    sending.value = false;
  }
};

const handleModalCancel = () => {
  questionTitle.value = '';
  questionContent.value = '';
  isEditMode.value = false;
  editingQuestionId.value = null;
  showModal.value = false;
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchQuestions();
  }
};

// ✅ lifecycle
onMounted(() => {
  fetchSiteSettings();
  fetchQuestions();
});
</script>

<style scoped>
.customer-center-page {
  min-height: 80vh;
}

.question-table {
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

:deep(.ant-checkbox-wrapper) {
  color: var(--white-color);
}

:deep(.ant-checkbox-inner) {
  background: var(--glass-bg-dark);
  border-color: var(--glass-border);
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background: var(--glass-blue);
  border-color: var(--glass-blue-border);
}

.status-waiting {
  color: #f59e0b;
  font-weight: 600;
  margin-right: 8px;
}

.status-completed {
  color: #10b981;
  font-weight: 600;
  margin-right: 8px;
}

.table-cell-content {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.action-btn-edit,
.action-btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
}

.action-btn-edit {
  color: var(--main-color) !important;
}

.action-btn-edit:hover:not(:disabled) {
  color: var(--main-color) !important;
}

.action-btn-edit:disabled {
  color: rgba(255, 255, 255, 0.3) !important;
  cursor: not-allowed;
  opacity: 0.5;
}

.action-buttons :deep(.anticon) {
  font-size: 16px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-controls :deep(.ant-btn) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: var(--glass-shadow-soft);
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
  opacity: 0.5;
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

.action-bar :deep(.ant-btn-dangerous) {
  color: #ffffff !important;
  font-weight: 600;
}

.action-bar :deep(.ant-btn-dangerous:hover:not(:disabled)) {
  color: #ffffff !important;
  background: var(--glass-red-light) !important;
}

.action-bar :deep(.ant-btn-dangerous:disabled) {
  color: rgba(255, 255, 255, 0.4) !important;
  background: rgba(239, 68, 68, 0.3) !important;
}

.question-form-modal {
  padding: 8px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  color: var(--white-color);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-input,
.form-textarea {
  width: 100%;
}

:deep(.ant-input),
:deep(.ant-textarea) {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  color: var(--white-color);
}

:deep(.ant-input:focus),
:deep(.ant-textarea:focus) {
  background: var(--glass-bg-light);
  border-color: var(--glass-blue-border);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

:deep(.ant-input::placeholder),
:deep(.ant-textarea::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

:deep(.ant-btn-primary) {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
}

:deep(.ant-btn-primary:hover) {
  background: var(--glass-blue-light) !important;
  border-color: var(--glass-blue-border) !important;
}

:deep(.ant-btn-dangerous) {
  background: var(--glass-red) !important;
  border-color: var(--glass-red-border) !important;
}

:deep(.ant-btn-dangerous:hover) {
  background: var(--glass-red-light) !important;
  border-color: var(--glass-red-border) !important;
}

.text-center {
  text-align: center;
}

.text-white {
  color: var(--white-color);
}

.mt-3 {
  margin-top: 12px;
}

/* Question Modal Styles */
:deep(.question-modal .ant-modal-content) {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
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
