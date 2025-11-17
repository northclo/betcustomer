<template>
  <div class="add-fund-page">
    <div class="bg-primary-light radius-2 p-3 mt-2">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :lg="18">
          <a-card :title="getTranslation('money_charged_list')" class="game-result-card matching-height-card">
            <a-table
              :columns="chargeListColumns"
              :data-source="chargeList"
              :loading="loadingHistory"
              :pagination="false"
              size="middle"
              :bordered="false"
              class="charge-list-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'index'">
                  <span class="table-cell-content">{{ record.index }}</span>
                </template>
                <template v-else-if="column.key === 'chargeAmount'">
                  <span class="table-cell-content">{{ record.chargeAmount.toLocaleString() }} {{ trlang.currency }}</span>
                </template>
                <template v-else-if="column.key === 'chargerName'">
                  <span class="table-cell-content">{{ record.chargerName || '*' }}</span>
                </template>
                <template v-else-if="column.key === 'requestDate'">
                  <span class="table-cell-content">{{ formatDate(record.requestDate) }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag 
                    :color="getStatusColor(record.status)"
                    :class="record.status === 'APPROVED' || record.status === 'COMPLETE' ? 'status-complete' : ''"
                  >
                    {{ getStatusText(record.status) }}
                  </a-tag>
                </template>
                <template v-else-if="column.key === 'action'">
                  <a-button
                    v-if="record.status === 'PENDING'"
                    type="primary"
                    danger
                    size="small"
                    :loading="record.cancelling"
                    @click="handleCancelCharge(record)"
                  >
                    {{ getTranslation('cancel') }}
                  </a-button>
                  <span v-else class="text-gray">-</span>
                </template>
              </template>
              <template #emptyText>
                <div class="text-center text-white py-4">{{ getTranslation('no_data') }}</div>
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
        </a-col>

        <a-col :xs="24" :lg="6">
          <a-card :title="getTranslation('request_money_charging')" class="game-result-card matching-height-card">
            <a-space direction="vertical" size="middle" class="w-100">
              <div class="instruction-text">
                <p>
                  {{ getTranslation('charge_instruction_text') }}
                </p>
              </div>

              <div class="warning-text">
                <strong>{{ getTranslation('before_process_charging_warning') }}</strong>
              </div>

              <div>
                <div class="section-title">{{ getTranslation('charge_amount_selection') }}</div>
                <a-row :gutter="[8, 8]" class="mt-2">
                  <a-col
                    v-for="moAmount in moAmounts"
                    :key="moAmount.value"
                    :xs="8"
                    :sm="6"
                    :md="4"
                  >
                    <button
                      class="mo-btn glass-btn w-100 cursor-pointer"
                      :class="{ 'mo-btn-active': selectedMoAmount === moAmount.value }"
                      @click="selectMoAmount(moAmount.value)"
                    >
                      {{ moAmount.label }}
                    </button>
                  </a-col>
                  <a-col :xs="8" :sm="6" :md="4">
                    <button
                      class="mo-btn glass-btn glass-action-pink w-100 cursor-pointer"
                      @click="resetChargeAmount"
                    >
                      {{ getTranslation('reset') }}
                    </button>
                  </a-col>
                </a-row>
              </div>

              <div>
                <div class="section-title">{{ getTranslation('charge_money') }}</div>
                <a-row :gutter="[8, 8]" class="mt-2">
                  <a-col :xs="16" :sm="18">
                    <a-input-number
                      v-model:value="chargeAmount"
                      :min="chargeMin"
                      :max="chargeMax"
                      :step="10000"
                      :controls="false"
                      class="w-100"
                      :placeholder="trlang.enter_amount"
                      size="large"
                      :formatter="(value) => value ? value.toLocaleString() : ''"
                      :parser="(value) => value.replace(/\$\s?|(,*)/g, '')"
                    />
                  </a-col>
                  <a-col :xs="8" :sm="6">
                    <a-button
                      type="primary"
                      class="w-100 glass-action-green request-charge-btn"
                      size="large"
                      :loading="loading"
                      :disabled="!chargeAmount || chargeAmount <= 0 || !isWithinChargeTimeRange"
                      @click="handleRequestCharging"
                    >
                      <span class="request-charge-text">{{ getTranslation('request_charge') }}</span>
                    </a-button>
                  </a-col>
                </a-row>
              </div>

              <div>
                <div class="section-title">{{ getTranslation('bank_number') }}</div>
                <a-input
                  :value="displayBankNumber"
                  :type="showBankNumber ? 'text' : 'password'"
                  readonly
                  class="mt-2"
                  size="large"
                >
                  <template #suffix>
                    <a-button
                      type="text"
                      @click="toggleBankNumber"
                      class="bank-view-btn"
                    >
                      <EyeOutlined v-if="!showBankNumber" />
                      <EyeInvisibleOutlined v-else />
                    </a-button>
                  </template>
                </a-input>
              </div>

              <div v-if="depositAccount" class="deposit-account-info">
                <div class="section-title">{{ getTranslation('deposit_account_information') }}</div>
                <div class="deposit-account-content">
                  <pre class="deposit-account-text">{{ depositAccount }}</pre>
                </div>
              </div>

              <div v-if="chargeSettings.charge_timezone && !isWithinChargeTimeRange" class="warning-text text-danger">
                {{ chargeSettings.charge_impossible_timezone_message || getTranslation('charging_not_available_at_this_time') }}
              </div>
              <div v-if="chargeSettings.charge_min || chargeSettings.charge_max" class="warning-text" style="margin-top: 8px;">
                <strong>{{ getTranslation('charge_amount_selection') }}:</strong>
                <span v-if="chargeSettings.charge_min">
                  {{ getTranslation('minimum') }}: {{ chargeSettings.charge_min.toLocaleString() }} {{ trlang.currency }}
                </span>
                <span v-if="chargeSettings.charge_min && chargeSettings.charge_max"> / </span>
                <span v-if="chargeSettings.charge_max">
                  {{ getTranslation('maximum') }}: {{ chargeSettings.charge_max.toLocaleString() }} {{ trlang.currency }}
                </span>
              </div>
              <div class="warning-text text-danger">
                {{ getTranslation('bank_account_change_warning') }}
              </div>
            </a-space>
          </a-card>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { message } from 'ant-design-vue';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons-vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

// ✅ i18n
const langState = inject('langState');
const siteText = inject('siteText', { value: {} });
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

const depositAccount = computed(() => {
  return siteText.value?.deposit_account || '';
});

// ✅ constants
const MO_VALUE = 10000; // MO means 10,000
const moAmounts = [
  { label: '1 MO', value: 1 * MO_VALUE },
  { label: '3 MO', value: 3 * MO_VALUE },
  { label: '5 MO', value: 5 * MO_VALUE },
  { label: '10 MO', value: 10 * MO_VALUE },
  { label: '50 MO', value: 50 * MO_VALUE },
  { label: '100 MO', value: 100 * MO_VALUE },
];

// ✅ state
const loading = ref(false);
const loadingHistory = ref(false);
const chargeList = ref([]);
const chargeAmount = ref(null);
const selectedMoAmount = ref(null);
const bankNumber = ref('');
const showBankNumber = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);
const chargeSettings = ref({
  charge_min: null,
  charge_max: null,
  charge_timezone: false,
  charge_start_time: null,
  charge_end_time: null,
  charge_impossible_timezone_message: '',
  charge_complete_message: '',
});

// ✅ computed
const displayBankNumber = computed(() => {
  if (!bankNumber.value) return '******';
  if (showBankNumber.value) return bankNumber.value;
  return '******';
});

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1);
});

const chargeMin = computed(() => {
  return chargeSettings.value.charge_min ?? 0;
});

const chargeMax = computed(() => {
  return chargeSettings.value.charge_max ?? 10000000;
});

const isWithinChargeTimeRange = computed(() => {
  if (!chargeSettings.value.charge_timezone) return true;
  
  const startTime = chargeSettings.value.charge_start_time;
  const endTime = chargeSettings.value.charge_end_time;
  
  if (!startTime || !endTime) return true;
  
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHours * 100 + currentMinutes;
  
  const start = Number(startTime);
  const end = Number(endTime);
  
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }
  
  return currentTime >= start && currentTime <= end;
});

// ✅ table columns
const chargeListColumns = computed(() => [
  {
    title: getTranslation('index'),
    key: 'index',
    width: 80,
    align: 'center',
  },
  {
    title: getTranslation('charge_amount'),
    key: 'chargeAmount',
    align: 'center',
    width: 160,
    ellipsis: true,
  },
  {
    title: getTranslation('charger_name'),
    key: 'chargerName',
    align: 'center',
    width: 130,
    ellipsis: true,
  },
  {
    title: getTranslation('charging_request_date'),
    key: 'requestDate',
    align: 'center',
    width: 200,
    ellipsis: true,
  },
  {
    title: getTranslation('status'),
    key: 'status',
    align: 'center',
    width: 140,
  },
  {
    title: getTranslation('cancel_delete'),
    key: 'action',
    align: 'center',
    width: 150,
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
  const statusMap = {
    PENDING: getTranslation('in_request'),
    APPROVED: getTranslation('complete'),
    REJECTED: getTranslation('rejected'),
    COMPLETE: getTranslation('complete'),
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    PENDING: 'orange',
    APPROVED: 'complete',
    REJECTED: 'red',
    COMPLETE: 'complete',
  };
  return colorMap[status] || 'default';
};

const selectMoAmount = (amount) => {
  selectedMoAmount.value = amount;
  chargeAmount.value = amount;
};

const resetChargeAmount = () => {
  selectedMoAmount.value = null;
  chargeAmount.value = null;
};

const toggleBankNumber = () => {
  if (!bankNumber.value) {
    message.warning(getTranslation('bank_number_not_available'));
    return;
  }
  showBankNumber.value = !showBankNumber.value;
};

const validateChargeAmount = () => {
  if (!chargeAmount.value || chargeAmount.value <= 0) {
    message.error(getTranslation('please_enter_valid_charge_amount'));
    return false;
  }

  if (chargeSettings.value.charge_min !== null && chargeAmount.value < chargeSettings.value.charge_min) {
    message.error(
      getTranslation('minimum_charge_amount').replace('{amount}', chargeSettings.value.charge_min.toLocaleString())
    );
    return false;
  }

  if (chargeSettings.value.charge_max !== null && chargeAmount.value > chargeSettings.value.charge_max) {
    message.error(
      getTranslation('maximum_charge_amount').replace('{amount}', chargeSettings.value.charge_max.toLocaleString())
    );
    return false;
  }

  if (!isWithinChargeTimeRange.value) {
    const errorMessage = chargeSettings.value.charge_impossible_timezone_message || 
                        getTranslation('charging_not_available_at_this_time');
    message.error(errorMessage);
    return false;
  }

  return true;
};

const handleRequestCharging = async () => {
  if (!validateChargeAmount()) {
    return;
  }

  loading.value = true;
  try {
    const result = await postData(apiLink.add_fund, {
      amount: chargeAmount.value,
    });

    if (result.status) {
      const successMessage = result.data?.message || 
                             chargeSettings.value.charge_complete_message || 
                             getTranslation('fund_request_submitted');
      message.success(successMessage);
      resetChargeAmount();
      fetchChargeHistory();
    } else {
      message.error(
        result.message || getTranslation('failed_to_add_funds')
      );
    }
  } catch (error) {
    console.error('Error requesting charging:', error);
    message.error(getTranslation('unexpected_error_try_again'));
  } finally {
    loading.value = false;
  }
};

const handleCancelCharge = async (record) => {
  if (record.status !== 'PENDING') {
    return message.warning(getTranslation('only_pending_charges_can_be_cancelled'));
  }

  record.cancelling = true;
  try {
    const result = await postData(apiLink.cancel_fund, {
      transactionId: record._id,
    });
    
    if (result.status) {
      message.success(result.message || getTranslation('fund_request_cancelled'));
      fetchChargeHistory();
    } else {
      message.error(result.message || getTranslation('failed_to_cancel_fund_request'));
    }
  } catch (error) {
    console.error('Error cancelling charge:', error);
    message.error(getTranslation('unexpected_error_try_again'));
  } finally {
    record.cancelling = false;
  }
};

const fetchChargeHistory = async () => {
  loadingHistory.value = true;
  try {
    const result = await getData(`${apiLink.get_fund_history}?page=${currentPage.value}&limit=${pageSize.value}`);
    
    if (result.status && result.data) {
      const data = Array.isArray(result.data) ? result.data : (result.data.data || []);
      const pagination = result.data.pagination || {};
      
      chargeList.value = data.map((item, index) => ({
        _id: item._id,
        index: (currentPage.value - 1) * pageSize.value + index + 1,
        chargeAmount: item.amount || 0,
        chargerName: item.payment_method || '*',
        requestDate: item.createdAt,
        status: item.status || 'PENDING',
        cancelling: false,
      }));

      if (pagination.totalPages !== undefined) {
        totalPages.value = pagination.totalPages || 1;
        currentPage.value = pagination.page || currentPage.value;
      } else {
        totalPages.value = 1;
      }
    } else {
      chargeList.value = [];
      totalPages.value = 1;
    }
  } catch (error) {
    console.error('Error fetching charge history:', error);
    chargeList.value = [];
    totalPages.value = 1;
  } finally {
    loadingHistory.value = false;
  }
};

const fetchBankNumber = async () => {
  try {
    const result = await getData(apiLink.get_betting_info);
    if (result.status && result.data && result.data.user) {
      bankNumber.value = result.data.user.bank_number || '';
    }
  } catch (error) {
    console.error('Error fetching bank number:', error);
  }
};

const fetchChargeSettings = async () => {
  try {
    const result = await getData(apiLink.get_site_setting);
    if (result.status && result.data) {
      chargeSettings.value = {
        charge_min: result.data.charge_min ?? null,
        charge_max: result.data.charge_max ?? null,
        charge_timezone: result.data.charge_timezone ?? false,
        charge_start_time: result.data.charge_start_time ?? null,
        charge_end_time: result.data.charge_end_time ?? null,
        charge_impossible_timezone_message: result.data.charge_impossible_timezone_message || '',
        charge_complete_message: result.data.charge_complete_message || '',
      };
    }
  } catch (error) {
    console.error('Error fetching charge settings:', error);
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchChargeHistory();
  }
};

// ✅ lifecycle
onMounted(() => {
  fetchChargeHistory();
  fetchBankNumber();
  fetchChargeSettings();
});
</script>

<style scoped>
.add-fund-page {
  min-height: 80vh;
}

/* Make table fit without horizontal scroll */
.charge-list-table :deep(.ant-table-container) {
  overflow-x: visible !important;
}

.instruction-text {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 12px;
  color: var(--white-color);
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
}

.instruction-text p {
  margin: 0;
}

.warning-text {
  color: var(--white-color);
  font-size: 14px;
  padding: 8px 12px;
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
}

.warning-text.text-danger {
  color: rgba(239, 68, 68, 0.9);
}

.section-title {
  color: var(--white-color);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.mo-btn {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid var(--glass-border);
  color: var(--white-color);
  border-radius: 8px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  font-weight: 600;
  font-size: 14px;
  min-height: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1.2;
  text-align: center;
  word-break: break-word;
  padding: 8px 4px;
}

.mo-btn:hover {
  background: var(--glass-bg-light);
  border-color: var(--glass-blue-border);
  box-shadow: var(--glass-shadow);
}

.mo-btn-active {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4) !important;
}

.bank-view-btn {
  color: var(--white-color);
}

.bank-view-btn:hover {
  color: var(--main-color);
}

.text-gray {
  color: rgba(255, 255, 255, 0.5);
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
  white-space: nowrap;
  word-wrap: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 12px 16px !important;
}

:deep(.ant-table-tbody > tr > td) {
  background: transparent !important;
  border-color: var(--glass-border) !important;
  color: var(--white-color) !important;
  white-space: nowrap;
  word-wrap: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 12px 16px !important;
}

:deep(.ant-table) {
  min-width: 100%;
}

:deep(.ant-table-container) {
  overflow-x: auto;
}

.charge-list-table {
  min-height: 400px;
}

.charge-list-table :deep(.ant-table-body) {
  min-height: 350px;
}

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

.mt-3 {
  margin-top: 12px;
}

.matching-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.matching-height-card :deep(.ant-card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-cell-content {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: var(--glass-bg-light) !important;
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-input-number-input) {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  color: var(--white-color);
}

:deep(.ant-input:focus),
:deep(.ant-input-number:focus),
:deep(.ant-input-number-focused) {
  background: var(--glass-bg-light);
  border-color: var(--glass-blue-border);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

:deep(.ant-input[readonly]) {
  cursor: default;
  background: var(--glass-bg-dark) !important;
}

:deep(.ant-input-number-handler-wrap) {
  display: none !important;
}

:deep(.ant-tag) {
  border: none;
  font-weight: 500;
}

.status-complete,
:deep(.ant-tag.status-complete),
:deep(.ant-tag[class*="complete"]) {
  background-color: #10b981 !important;
  border-color: #10b981 !important;
  color: #ffffff !important;
  font-weight: 600;
}

/* Override Ant Design green tag for complete status */
:deep(.ant-tag-green),
:deep(.ant-tag[data-color="green"]) {
  background-color: #10b981 !important;
  border-color: #10b981 !important;
  color: #ffffff !important;
}

.request-charge-btn {
  height: 40px;
  padding: 4px 8px;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.request-charge-text {
  display: inline-block;
  white-space: normal;
  line-height: 1.2;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
}

:deep(.ant-btn-primary) {
  background: var(--glass-green) !important;
  border-color: var(--glass-green-border) !important;
}

:deep(.ant-btn-primary:hover) {
  background: var(--glass-green-light) !important;
  border-color: var(--glass-green-border) !important;
}

:deep(.ant-btn-dangerous) {
  background: var(--glass-red) !important;
  border-color: var(--glass-red-border) !important;
}

:deep(.ant-btn-dangerous:hover) {
  background: var(--glass-red-light) !important;
  border-color: var(--glass-red-border) !important;
}

.deposit-account-info {
  margin-top: 16px;
}

.deposit-account-content {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}

.deposit-account-text {
  color: var(--white-color);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
}
</style>

<style>
.main-container:has(.add-fund-page) {
  max-width: 1600px !important;
}

@media (max-width: 1600px) {
  .main-container:has(.add-fund-page) {
    max-width: 95% !important;
  }
}

@media (max-width: 768px) {
  .main-container:has(.add-fund-page) {
    max-width: 100% !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}
</style>
