<template>
  <div class="customer-center-page">
    <div class="bg-primary-light radius-2 p-3 mt-2">
      <a-card :title="trlang.customer_center" class="game-result-card">
        <div>
          <div class="table-container">
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
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">
                  <span class="table-cell-content">{{ (pagination.page - 1) * pagination.limit + index + 1 }}</span>
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
                      :disabled="record.status !== 'PENDING' && record.status !== 'NEW'"
                      class="action-btn-edit"
                      :title="trlang.edit"
                      @click="handleEdit(record)"
                    >
                      <template #icon>
                        <EditOutlined />
                      </template>
                    </a-button>
                    <a-button
                      type="text"
                      size="small"
                      danger
                      class="action-btn-delete"
                      :title="trlang.delete"
                      @click="handleDelete(record)"
                    >
                      <template #icon>
                        <DeleteOutlined />
                      </template>
                    </a-button>
                  </div>
                </template>
              </template>
              <template #emptyText>
                <div class="text-center text-white py-1">
                  {{ trlang.no_data }}
                </div>
              </template>
            </a-table>
          </div>
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
import { ref, computed, onMounted, inject, h, reactive } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue';
import { getData, postData, putData, deleteData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

const loading = ref(false);
const deleting = ref(false);
const sending = ref(false);
const questionList = ref([]);
const selectedRowKeys = ref([]);
const showModal = ref(false);
const isEditMode = ref(false);
const editingQuestionId = ref(null);
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});
const siteSettings = ref(null);

const questionTitle = ref('');
const questionContent = ref('');

const canSendQuestion = computed(() => {
  return questionTitle.value.trim() && questionContent.value.trim() && !sending.value;
});

const pageSizeOptions = computed(() => [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]);

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys) => {
    selectedRowKeys.value = keys;
  },
  getCheckboxProps: (record) => ({
    name: record._id || record.id,
  }),
}));

const questionColumns = computed(() => [
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
    title: trlang.value.actions,
    key: 'actions',
    align: 'center',
    width: 150,
    fixed: 'right',
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
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getStatusText = (status) => {
  if (status === 'RESOLVED') {
    return getTranslation('answer_completed');
  }
  if (status === 'REJECTED') {
    return getTranslation('question_rejected');
  }
  if (status === 'NEW') {
    return getTranslation('answer_waiting');
  }
  return getTranslation('answer_waiting');
};

const getStatusClass = (status) => {
  if (status === 'RESOLVED' || status === 'COMPLETE') {
    return 'status-completed';
  }
  if (status === 'REJECTED') {
    return 'status-rejected';
  }
  if (status === 'NEW' || status === 'PENDING') {
    return 'status-waiting';
  }
  return 'status-waiting';
};

const fetchQuestions = async (page = 1, pageSize = 10) => {
  loading.value = true;
  try {
    if (!apiLink.get_questions) {
      questionList.value = [];
      pagination.totalPages = 1;
      pagination.page = 1;
      pagination.total = 0;
      return;
    }

    const result = await getData(`${apiLink.get_questions}?page=${page}&limit=${pageSize}`);
    
    if (result.status && result.data) {
      const { questions, page: pageNum, totalPages: pages, total } = result.data;
      questionList.value = (questions || []).map((item) => ({
        _id: item._id || item.id,
        title: item.title || '',
        writer: item.writer || '',
        date: item.createdAt ? new Date(item.createdAt) : (item.date ? new Date(item.date) : new Date()),
        status: item.status || 'PENDING',
        question: item.question || '',
      }));
      if (total !== undefined && total !== null) {
        pagination.total = total;
      } else {
        pagination.total = questionList.value.length;
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
      questionList.value = [];
      pagination.totalPages = 1;
      pagination.page = 1;
      pagination.total = 0;
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
    questionList.value = [];
    pagination.totalPages = 1;
    pagination.total = 0;
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
          fetchQuestions(pagination.page, pagination.limit);
        }
      } catch (error) {
        console.error('Error deleting questions:', error);
        message.error(error.message || getTranslation('operation_failed'));
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
    console.error('Error fetching site settings:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
    siteSettings.value = { customer_center: true };
  }
};

const checkPendingInquiries = () => {
  if (siteSettings.value?.customer_center) {
    const hasPending = questionList.value.some(
      (q) => q.status === 'PENDING' || q.status === 'NEW'
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
  if (record.status !== 'PENDING' && record.status !== 'NEW') {
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
          fetchQuestions(pagination.page, pagination.limit);
          selectedRowKeys.value = selectedRowKeys.value.filter(id => id !== questionId);
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        message.error(error.message || getTranslation('operation_failed'));
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
    message.error(error.message || getTranslation('operation_failed'));
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

const handlePaginationChange = (page) => {
  pagination.page = page;
  fetchQuestions(page, pagination.limit);
};

const handlePageSizeChange = (pageSize) => {
  pagination.limit = pageSize;
  pagination.page = 1;
  fetchQuestions(1, pageSize);
};

onMounted(() => {
  fetchSiteSettings();
  fetchQuestions(pagination.page, pagination.limit);
});
</script>

<style scoped>
.customer-center-page {
  min-height: 80vh;
}

.question-table {
  background: transparent;
}

:deep(.ant-checkbox-wrapper),
:deep(.ant-checkbox),
:deep(.ant-checkbox-inner),
:deep(.ant-checkbox-inner::after),
:deep(.ant-checkbox-inner::before),
:deep(.ant-checkbox-input) {
  transition: none !important;
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -o-transition: none !important;
}

:deep(.ant-checkbox-wrapper) {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

:deep(.ant-checkbox-wrapper::after) {
  display: none !important;
  content: none !important;
}

:deep(.ant-checkbox-checked::after),
:deep(:where(.css-dev-only-do-not-override-1p3hq3p).ant-checkbox-checked::after),
:deep(:where([class*="css-dev-only-do-not-override"]).ant-checkbox-checked::after) {
  display: none !important;
  content: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

:deep(.ant-checkbox) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-checkbox-inner) {
  width: 20px !important;
  height: 20px !important;
  background: var(--glass-bg-dark) !important;
  border: 2px solid var(--glass-border) !important;
  border-radius: 6px !important;
  position: relative;
  overflow: hidden;
}

:deep(.ant-checkbox-inner::before) {
  display: none !important;
}

:deep(.ant-checkbox-inner::after) {
  width: 6px !important;
  height: 10px !important;
  left: 6px !important;
  top: 2px !important;
  border: 2px solid #ffffff !important;
  border-top: none !important;
  border-left: none !important;
  opacity: 1 !important;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner::after) {
  transform: rotate(45deg) scale(1) !important;
  border-color: #ffffff !important;
}


:deep(.ant-checkbox-disabled .ant-checkbox-inner) {
  background: var(--glass-bg-dark) !important;
  border-color: var(--glass-border) !important;
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

:deep(.ant-checkbox-disabled .ant-checkbox-inner::after) {
  border-color: rgba(255, 255, 255, 0.3) !important;
}


:deep(.ant-table-thead .ant-checkbox-wrapper) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-table-thead .ant-checkbox-inner) {
  width: 20px !important;
  height: 20px !important;
}

:deep(.ant-checkbox-indeterminate .ant-checkbox-inner::after) {
  width: 10px !important;
  height: 2px !important;
  left: 4px !important;
  top: 8px !important;
  border: none !important;
  background: #ffffff !important;
  transform: scale(1) !important;
  border-radius: 1px !important;
}

:deep(.ant-checkbox-indeterminate .ant-checkbox-inner) {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
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

.status-rejected {
  color: #ef4444;
  font-weight: 600;
  margin-right: 8px;
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
  background: transparent !important;
  border: none !important;
}

.action-btn-edit {
  color: var(--main-color) !important;
}

.action-btn-edit:hover:not(:disabled) {
  color: var(--main-color) !important;
  background: transparent !important;
}

.action-btn-edit:disabled {
  color: rgba(255, 255, 255, 0.3) !important;
  cursor: not-allowed;
  opacity: 0.5;
  background: transparent !important;
}

.action-btn-delete {
  color: #ef4444 !important;
  background: transparent !important;
}

.action-btn-delete:hover {
  color: #dc2626 !important;
  background: transparent !important;
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

.action-btn-delete :deep(.ant-btn-dangerous) {
  background: transparent !important;
  border: none !important;
  color: #ef4444 !important;
}

.action-btn-delete :deep(.ant-btn-dangerous:hover) {
  background: transparent !important;
  border: none !important;
  color: #dc2626 !important;
}

/* Question Modal Styles */
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
