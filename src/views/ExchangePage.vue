<template>
  <div class="exchange-money-page">
    <div class="bg-primary-light radius-2 p-3 mt-2">
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :lg="18">
          <a-card :title="getTranslation('money_exchanged_list')" class="game-result-card matching-height-card">
            <div class="table-container">
              <a-table
                :columns="exchangeListColumns"
                :data-source="exchangeList"
                :loading="loadingHistory"
                :pagination="false"
                size="middle"
                :bordered="false"
              >
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'index'">
                    <span class="table-cell-content">{{ (pagination.page - 1) * pagination.limit + index + 1 }}</span>
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
                      :class="record.status === 'COMPLETE' ? 'status-complete' : ''"
                    >
                      {{ getStatusText(record.status) }}
                    </a-tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <a-button
                      v-if="record.status === 'WAIT'"
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
                  <div class="text-center text-white py-4">
                    {{ getTranslation('no_data') }}
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
                <div class="section-title">
                  {{ getTranslation('exchange_amount_selection') }}
                </div>
                <div class="mo-buttons-container mt-2">
                  <button
                    v-for="moAmount in moAmounts"
                    :key="moAmount.value"
                    class="mo-btn glass-btn cursor-pointer"
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
                <div class="section-title">
                  {{ getTranslation('exchange_money') }}
                </div>
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
                      :disabled="!exchangeAmount || exchangeAmount <= 0 || !exchangeSecureCode || !exchangeSecureCode.trim() || !bankNumber || !bankNumber.trim() || !isWithinExchangeTimeRange"
                      @click="handleRequestExchange"
                    >
                      <span class="request-exchange-text">{{ getTranslation('request_exchange') }}</span>
                    </a-button>
                  </a-col>
                </a-row>
            </div>

              <div>
                <div class="section-title">
                  {{ getTranslation('exchange_secure_code') }}
                </div>
                <a-input
                  v-model:value="exchangeSecureCode"
                  type="password"
                  :placeholder="getTranslation('enter_secure_code')"
                  class="mt-2"
                  size="large"
                  :maxlength="50"
                />
          </div>

              <div>
                <div class="section-title">
                  {{ getTranslation('bank_number') }}
                </div>
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
import { ref, computed, onMounted, inject, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

const MO_VALUE = 10000;
const moAmounts = computed(() => [
  { label: getTranslation('mo_1'), value: 1 * MO_VALUE },
  { label: getTranslation('mo_3'), value: 3 * MO_VALUE },
  { label: getTranslation('mo_5'), value: 5 * MO_VALUE },
  { label: getTranslation('mo_10'), value: 10 * MO_VALUE },
  { label: getTranslation('mo_50'), value: 50 * MO_VALUE },
  { label: getTranslation('mo_100'), value: 100 * MO_VALUE },
]);

const loading = ref(false);
const loadingHistory = ref(false);
const exchangeList = ref([]);
const exchangeAmount = ref(null);
const exchangeSecureCode = ref('');
const selectedMoAmount = ref(null);
const availableBalance = ref(0);
const bankNumber = ref('');
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});
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

const pageSizeOptions = computed(() => [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]);

const exchangeMin = computed(() => {
  return exchangeSettings.value.exchange_min ?? 0;
});

const exchangeMax = computed(() => {
  const balance = availableBalance.value || 0;
  const settingMax = exchangeSettings.value.exchange_max;
  
  if (settingMax !== null && settingMax !== undefined) {
    return Math.min(settingMax, balance || 10000000);
  }
  
  return balance || 10000000;
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

const exchangeListColumns = computed(() => [
  {
    title: getTranslation('no'),
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
    WAIT: getTranslation('in_request'),
    COMPLETE: getTranslation('complete'),
    CANCEL: getTranslation('rejected'),
  };
  return statusMap[status] || status;
};

const getStatusColor = (status) => {
  const colorMap = {
    WAIT: 'orange',
    COMPLETE: 'complete',
    CANCEL: 'red',
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
  bankNumber.value = '';
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

  if (!bankNumber.value || !bankNumber.value.trim()) {
    message.error(getTranslation('bank_number_required'));
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
      secure_code: exchangeSecureCode.value.trim(),
      bank_number: bankNumber.value.trim(),
    });

    if (result.status) {
      const successMessage = result.data?.message || 
                             exchangeSettings.value.exchange_complete_message || 
                             getTranslation('exchange_request_submitted');
      message.success(successMessage);
      resetExchangeAmount();
      fetchExchangeHistory(pagination.page, pagination.limit);
      fetchBalance();
    }
  } catch (error) {
    console.error('Error requesting exchange:', error);
    message.error(error.message || getTranslation('operation_failed'));
  } finally {
    loading.value = false;
  }
};

const handleCancelExchange = async (record) => {
  if (record.status !== 'WAIT') {
    return message.warning(getTranslation('only_pending_exchanges_can_be_cancelled'));
  }

  record.cancelling = true;
  try {
    const result = await postData(apiLink.cancel_exchange, {
      transactionId: record._id,
    });

    if (result.status) {
      message.success(result.message || getTranslation('exchange_request_cancelled'));
      fetchExchangeHistory(pagination.page, pagination.limit);
      fetchBalance();
    }
  } catch (error) {
    console.error('Error cancelling exchange:', error);
    message.error(error.message || getTranslation('operation_failed'));
  } finally {
    record.cancelling = false;
  }
};

const fetchExchangeHistory = async (page = 1, pageSize = 10) => {
  loadingHistory.value = true;
  try {
    const result = await getData(`${apiLink.get_exchange_history}?page=${page}&limit=${pageSize}`);
    
    if (result.status && result.data) {
      const data = Array.isArray(result.data) ? result.data : (result.data.data || []);
      const paginationData = result.data.pagination || {};
      
      exchangeList.value = data.map((item) => ({
        _id: item._id,
        exchangeAmount: item.amount || 0,
        exchangerName: item.user_nickname || '*',
        requestDate: item.createdAt,
        status: item.status || 'WAIT',
        cancelling: false,
      }));

      if (paginationData.total !== undefined && paginationData.total !== null) {
        pagination.total = paginationData.total;
      } else {
        pagination.total = exchangeList.value.length;
      }
      
      if (paginationData.totalPages !== undefined && paginationData.totalPages !== null) {
        pagination.totalPages = paginationData.totalPages;
      } else {
        pagination.totalPages = Math.ceil(pagination.total / pageSize) || 1;
      }
      
      if (paginationData.page !== undefined && paginationData.page !== null) {
        pagination.page = paginationData.page;
      } else {
        pagination.page = page;
      }
      pagination.limit = paginationData.pageSize || pageSize;
    } else {
      exchangeList.value = [];
      pagination.total = 0;
      pagination.totalPages = 1;
    }
  } catch (error) {
    console.error('Error fetching exchange history:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
    exchangeList.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
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
    message.error(error.message || getTranslation('failed_to_fetch_data'));
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
    message.error(error.message || getTranslation('failed_to_fetch_data'));
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
    message.error(error.message || getTranslation('failed_to_fetch_data'));
  }
};

const handlePaginationChange = (page) => {
  pagination.page = page;
  fetchExchangeHistory(page, pagination.limit);
};

const handlePageSizeChange = (pageSize) => {
  pagination.limit = pageSize;
  pagination.page = 1;
  fetchExchangeHistory(1, pageSize);
};

onMounted(() => {
  fetchExchangeHistory(pagination.page, pagination.limit);
  fetchBalance();
  fetchBankNumber();
  fetchExchangeSettings();
});
</script>

<style scoped>
.exchange-money-page {
  min-height: 80vh;
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
</style>
