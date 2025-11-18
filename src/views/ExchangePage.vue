<template>
  <div class="exchange-money-page">
    <div class="bg-primary-light radius-2 p-3 mt-2">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :lg="18">
          <a-card :title="getTranslation('money_exchanged_list')" class="game-result-card matching-height-card">
            <a-table
              :columns="exchangeListColumns"
              :data-source="exchangeList"
              :loading="loadingHistory"
              :pagination="false"
              size="middle"
              :bordered="false"
              class="exchange-list-table"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'index'">
                  <span class="table-cell-content">{{ record.index }}</span>
                </template>
                <template v-else-if="column.key === 'exchangeAmount'">
                  <span class="table-cell-content">{{ record.exchangeAmount.toLocaleString() }} {{ trlang.currency }}</span>
                </template>
                <template v-else-if="column.key === 'exchangerName'">
                  <span class="table-cell-content">{{ record.exchangerName || '*' }}</span>
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
                    @click="handleCancelExchange(record)"
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
          <a-card :title="getTranslation('request_money_exchange')" class="game-result-card matching-height-card">
            <a-space direction="vertical" size="middle" class="w-100">
              <div class="instruction-text">
                <p>
                  {{ getTranslation('exchange_instruction_text') }}
                </p>
            </div>

              <div>
                <div class="section-title">{{ getTranslation('exchange_amount_selection') }}</div>
                <div class="mo-buttons-container mt-2">
                  <button
                    v-for="moAmount in moAmounts"
                    :key="moAmount.value"
                    class="mo-btn glass-btn cursor-pointer"
                    :class="{ 'mo-btn-active': selectedMoAmount === moAmount.value }"
                    @click="selectMoAmount(moAmount.value)"
                  >
                    {{ moAmount.label }}
                  </button>
                  <button
                    class="mo-btn glass-btn glass-action-pink cursor-pointer"
                    @click="resetExchangeAmount"
                  >
                    {{ getTranslation('reset') }}
                  </button>
                </div>
          </div>

          <div>
                <div class="section-title">{{ getTranslation('exchange_money') }}</div>
                <a-row :gutter="[8, 8]" class="mt-2">
                  <a-col :xs="16" :sm="18">
            <a-input-number
                      v-model:value="exchangeAmount"
                      :min="exchangeMin"
              :max="exchangeMax"
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
                      class="w-100 glass-action-green request-exchange-btn"
                      size="large"
                      :loading="loading"
                      :disabled="!exchangeAmount || exchangeAmount <= 0 || !exchangeSecureCode || !isWithinExchangeTimeRange"
                      @click="handleRequestExchange"
                    >
                      <span class="request-exchange-text">{{ getTranslation('request_exchange') }}</span>
                    </a-button>
                  </a-col>
                </a-row>
            </div>

              <div>
                <div class="section-title">{{ getTranslation('exchange_secure_code') }}</div>
                <a-input
                  v-model:value="exchangeSecureCode"
                  :placeholder="getTranslation('enter_secure_code')"
                  class="mt-2"
                  size="large"
                  :maxlength="50"
                />
          </div>

              <div>
                <div class="section-title">{{ getTranslation('bank_number') }}</div>
                <a-input
                  v-model:value="bankNumber"
                  type="text"
                  class="mt-2"
                  size="large"
                  :placeholder="getTranslation('enter_bank_number')"
                />
              </div>

              <div v-if="exchangeSettings.exchange_timezone && !isWithinExchangeTimeRange" class="warning-text text-danger">
                {{ exchangeSettings.exchange_impossible_timezone_message || getTranslation('exchange_not_available_at_this_time') }}
              </div>
              <div v-if="exchangeSettings.exchange_min || exchangeSettings.exchange_max" class="warning-text" style="margin-top: 8px;">
                <strong>{{ getTranslation('exchange_amount_selection') }}:</strong>
                <span v-if="exchangeSettings.exchange_min">
                  {{ getTranslation('minimum') }}: {{ exchangeSettings.exchange_min.toLocaleString() }} {{ trlang.currency }}
                </span>
                <span v-if="exchangeSettings.exchange_min && exchangeSettings.exchange_max"> / </span>
                <span v-if="exchangeSettings.exchange_max">
                  {{ getTranslation('maximum') }}: {{ exchangeSettings.exchange_max.toLocaleString() }} {{ trlang.currency }}
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
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

// ✅ constants
const MO_VALUE = 10000; // MO means 10,000
const moAmounts = computed(() => [
  { label: getTranslation('mo_1'), value: 1 * MO_VALUE },
  { label: getTranslation('mo_3'), value: 3 * MO_VALUE },
  { label: getTranslation('mo_5'), value: 5 * MO_VALUE },
  { label: getTranslation('mo_10'), value: 10 * MO_VALUE },
  { label: getTranslation('mo_50'), value: 50 * MO_VALUE },
  { label: getTranslation('mo_100'), value: 100 * MO_VALUE },
]);

// ✅ state
const loading = ref(false);
const loadingHistory = ref(false);
const exchangeList = ref([]);
const exchangeAmount = ref(null);
const exchangeSecureCode = ref('');
const selectedMoAmount = ref(null);
const availableBalance = ref(0);
const bankNumber = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalPages = ref(1);
const exchangeSettings = ref({
  exchange_min: null,
  exchange_max: null,
  exchange_timezone: false,
  exchange_start_time: null,
  exchange_end_time: null,
  exchange_impossible_timezone_message: '',
  exchange_restriction: 'impossible',
  exchange_restriction_use: false,
  exchange_restriction_limit: null,
  charge_restriction_use: false,
  charge_restriction_limit: null,
  exchange_complete_message: '',
});

// ✅ computed

const pageNumbers = computed(() => {
  return Array.from({ length: totalPages.value }, (_, i) => i + 1);
});

const exchangeMin = computed(() => {
  return exchangeSettings.value.exchange_min ?? 0;
});

const exchangeMax = computed(() => {
  return Math.min(
    exchangeSettings.value.exchange_max ?? availableBalance.value,
    availableBalance.value
  );
});

const isWithinExchangeTimeRange = computed(() => {
  if (!exchangeSettings.value.exchange_timezone) return true;
  
  const startTime = exchangeSettings.value.exchange_start_time;
  const endTime = exchangeSettings.value.exchange_end_time;
  
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
const exchangeListColumns = computed(() => [
  {
    title: getTranslation('index'),
    key: 'index',
    width: 80,
    align: 'center',
  },
  {
    title: getTranslation('exchange_amount'),
    key: 'exchangeAmount',
    align: 'center',
    width: 160,
    ellipsis: true,
  },
  {
    title: getTranslation('exchanger_name'),
    key: 'exchangerName',
    align: 'center',
    width: 130,
    ellipsis: true,
  },
  {
    title: getTranslation('exchange_request_date'),
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
  exchangeAmount.value = amount;
};

const resetExchangeAmount = () => {
  selectedMoAmount.value = null;
  exchangeAmount.value = null;
  exchangeSecureCode.value = '';
};


const validateExchangeAmount = () => {
  if (!exchangeAmount.value || exchangeAmount.value <= 0) {
    message.error(getTranslation('please_enter_valid_exchange_amount'));
    return false;
  }

  if (!exchangeSecureCode.value || exchangeSecureCode.value.trim() === '') {
    message.error(getTranslation('please_enter_exchange_secure_code'));
    return false;
  }

  if (exchangeAmount.value > availableBalance.value) {
    message.error(getTranslation('insufficient_balance'));
    return false;
  }

  if (exchangeSettings.value.exchange_min !== null && exchangeAmount.value < exchangeSettings.value.exchange_min) {
    message.error(
      getTranslation('minimum_exchange_amount').replace('{amount}', exchangeSettings.value.exchange_min.toLocaleString())
    );
    return false;
  }

  if (exchangeSettings.value.exchange_max !== null && exchangeAmount.value > exchangeSettings.value.exchange_max) {
    message.error(
      getTranslation('maximum_exchange_amount').replace('{amount}', exchangeSettings.value.exchange_max.toLocaleString())
    );
    return false;
  }

  if (!isWithinExchangeTimeRange.value) {
    const errorMessage = exchangeSettings.value.exchange_impossible_timezone_message || 
                        getTranslation('exchange_not_available_at_this_time');
    message.error(errorMessage);
    return false;
  }

  return true;
};

const handleRequestExchange = async () => {
  if (!validateExchangeAmount()) {
    return;
  }

  loading.value = true;
  try {
    const result = await postData(apiLink.exchange, {
      amount: exchangeAmount.value,
      secure_code: exchangeSecureCode.value,
    });

    if (result.status) {
      const successMessage = result.data?.message || 
                             exchangeSettings.value.exchange_complete_message || 
                             getTranslation('exchange_request_submitted');
      message.success(successMessage);
      resetExchangeAmount();
      fetchExchangeHistory();
      fetchBalance();
    } else {
      message.error(
        result.message || getTranslation('failed_to_process_exchange')
      );
    }
  } catch (error) {
    console.error('Error requesting exchange:', error);
    message.error(getTranslation('unexpected_error_try_again'));
  } finally {
    loading.value = false;
  }
};

const handleCancelExchange = async (record) => {
  if (record.status !== 'PENDING') {
    return message.warning(getTranslation('only_pending_exchanges_can_be_cancelled'));
  }

  record.cancelling = true;
  try {
    const result = await postData(apiLink.cancel_exchange, {
      transactionId: record._id,
    });

    if (result.status) {
      message.success(result.message || getTranslation('exchange_request_cancelled'));
      fetchExchangeHistory();
      fetchBalance();
    } else {
      message.error(result.message || getTranslation('failed_to_cancel_exchange_request'));
    }
  } catch (error) {
    console.error('Error cancelling exchange:', error);
    message.error(getTranslation('failed_to_cancel_exchange_request'));
  } finally {
    record.cancelling = false;
  }
};

const fetchExchangeHistory = async () => {
  loadingHistory.value = true;
  try {
    const result = await getData(`${apiLink.get_exchange_history}?page=${currentPage.value}&limit=${pageSize.value}`);
    
    if (result.status && result.data) {
      const data = Array.isArray(result.data) ? result.data : (result.data.data || []);
      const pagination = result.data.pagination || {};
      
      exchangeList.value = data.map((item, index) => ({
        _id: item._id,
        index: (currentPage.value - 1) * pageSize.value + index + 1,
        exchangeAmount: item.original_amount || item.amount || 0,
        exchangerName: item.payment_method || '*',
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
      exchangeList.value = [];
      totalPages.value = 1;
    }
  } catch (error) {
    console.error('Error fetching exchange history:', error);
    exchangeList.value = [];
    totalPages.value = 1;
  } finally {
    loadingHistory.value = false;
  }
};

const fetchBalance = async () => {
  try {
    const result = await getData(apiLink.get_betting_info);
    if (result.status && result.data && result.data.user) {
      availableBalance.value = result.data.user.own_money || 0;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
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

const fetchExchangeSettings = async () => {
  try {
    const result = await getData(apiLink.get_site_setting);
    if (result.status && result.data) {
      exchangeSettings.value = {
        exchange_min: result.data.exchange_min ?? null,
        exchange_max: result.data.exchange_max ?? null,
        exchange_timezone: result.data.exchange_timezone ?? false,
        exchange_start_time: result.data.exchange_start_time ?? null,
        exchange_end_time: result.data.exchange_end_time ?? null,
        exchange_impossible_timezone_message: result.data.exchange_impossible_timezone_message || '',
        exchange_restriction: result.data.exchange_restriction ?? 'impossible',
        exchange_restriction_use: result.data.exchange_restriction_use ?? false,
        exchange_restriction_limit: result.data.exchange_restriction_limit ?? null,
        charge_restriction_use: result.data.charge_restriction_use ?? false,
        charge_restriction_limit: result.data.charge_restriction_limit ?? null,
        exchange_complete_message: result.data.exchange_complete_message || '',
      };
    }
  } catch (error) {
    console.error('Error fetching exchange settings:', error);
  }
};

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchExchangeHistory();
  }
};

// ✅ lifecycle
onMounted(() => {
  fetchExchangeHistory();
  fetchBalance();
  fetchBankNumber();
  fetchExchangeSettings();
});
</script>

<style scoped>
.exchange-money-page {
  min-height: 80vh;
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

.mo-buttons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
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
  padding: 8px 12px;
  flex: 1 1 calc(25% - 6px);
  min-width: calc(25% - 6px);
  max-width: calc(25% - 6px);
}

/* Force 4 buttons per row on desktop - creates 2 rows (4 + 3) */
@media (min-width: 993px) {
  .mo-btn:nth-child(4n+1) {
    flex-basis: calc(25% - 6px);
  }
  .mo-btn:nth-child(4n+2) {
    flex-basis: calc(25% - 6px);
  }
  .mo-btn:nth-child(4n+3) {
    flex-basis: calc(25% - 6px);
  }
  .mo-btn:nth-child(4n) {
    flex-basis: calc(25% - 6px);
  }
}

@media (max-width: 768px) {
  .mo-btn {
    flex: 1 1 calc(33.33% - 6px);
    min-width: calc(33.33% - 6px);
    max-width: calc(33.33% - 6px);
  }
}

@media (min-width: 769px) and (max-width: 992px) {
  .mo-btn {
    flex: 1 1 calc(25% - 6px);
    min-width: calc(25% - 6px);
    max-width: calc(25% - 6px);
  }
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

.exchange-list-table {
  min-height: 400px;
}

.exchange-list-table :deep(.ant-table-body) {
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

:deep(.ant-input::placeholder),
:deep(.ant-input-number-input::placeholder) {
  color: rgba(255, 255, 255, 0.7) !important;
  opacity: 1 !important;
}

:deep(.ant-input:focus),
:deep(.ant-input-number:focus),
:deep(.ant-input-number-focused) {
  background: var(--glass-bg-light);
  border-color: var(--glass-blue-border);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

:deep(.ant-input:focus::placeholder),
:deep(.ant-input-number-input:focus::placeholder) {
  color: rgba(255, 255, 255, 0.8) !important;
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

.request-exchange-btn {
  height: 40px;
  padding: 4px 8px;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.request-exchange-text {
  display: inline-block;
  white-space: normal;
  line-height: 1.2;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #ffffff !important;
}

:deep(.ant-btn-primary) {
  background: var(--glass-green) !important;
  border-color: var(--glass-green-border) !important;
  color: #ffffff !important;
}

:deep(.ant-btn-primary:hover) {
  background: var(--glass-green-light) !important;
  border-color: var(--glass-green-border) !important;
  color: #ffffff !important;
}

:deep(.ant-btn-primary:disabled) {
  color: rgba(255, 255, 255, 0.5) !important;
}

.request-exchange-btn :deep(.ant-btn-primary) {
  color: #ffffff !important;
}

.request-exchange-btn :deep(.ant-btn-primary:hover:not(:disabled)) {
  color: #ffffff !important;
}

:deep(.ant-btn-dangerous) {
  background: var(--glass-red) !important;
  border-color: var(--glass-red-border) !important;
}

:deep(.ant-btn-dangerous:hover) {
  background: var(--glass-red-light) !important;
  border-color: var(--glass-red-border) !important;
}
</style>

<style>
/* Override main-container max-width for ExchangeMoneyPage only */
.main-container:has(.exchange-money-page) {
  max-width: 1600px !important;
}

@media (max-width: 1600px) {
  .main-container:has(.exchange-money-page) {
    max-width: 95% !important;
  }
}

@media (max-width: 768px) {
  .main-container:has(.exchange-money-page) {
    max-width: 100% !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}
</style>
