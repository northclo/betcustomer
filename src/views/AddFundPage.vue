<template>
  <div class="bg-primary-light radius-2 p-3 mt-2">
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :lg="18">
        <a-card :title="getTranslation('money_charged_list')" class="game-result-card matching-height-card">
          <div class="table-container">
            <a-table
              :columns="chargeListColumns"
              :data-source="chargeList"
              :loading="loadingHistory"
              :pagination="false"
              size="middle"
              :bordered="false"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'index'">
                  <span class="table-cell-content">{{ (pagination.page - 1) * pagination.limit + index + 1 }}</span>
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
                    @click="handleCancelCharge(record)"
                  >
                    {{ getTranslation('cancel') }}
                  </a-button>
                  <span v-else class="text-gray">-</span>
                </template>
              </template>
              <template #emptyText>
                <div class="text-center text-white py-1">
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
        <a-card :title="getTranslation('request_money_charging')" class="game-result-card matching-height-card">
          <a-space direction="vertical" size="small" class="w-100">
            <div class="instruction-text">
              <p>
                {{ getTranslation('charge_instruction_text') }}
              </p>
            </div>

            <div class="warning-text">
              <strong>{{ getTranslation('before_process_charging_warning') }}</strong>
            </div>

            <div>
              <div class="section-title">
                {{ getTranslation('charge_amount_selection') }}
              </div>
              <div class="mo-buttons-container mt-1">
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
                  @click="resetChargeAmount"
                >
                  {{ getTranslation('reset') }}
                </button>
              </div>
            </div>

            <div>
              <div class="section-title">
                {{ getTranslation('charge_money') }}
              </div>
              <a-row :gutter="[8, 8]" class="mt-1">
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
                    :disabled="!chargeAmount || chargeAmount <= 0 || !bankNumber || !bankNumber.trim() || !isWithinChargeTimeRange"
                    @click="handleRequestCharging"
                  >
                    <span class="request-charge-text">{{ getTranslation('request_charge') }}</span>
                  </a-button>
                </a-col>
              </a-row>
            </div>

            <div>
              <div class="section-title">
                {{ getTranslation('bank_number') }}
              </div>
              <a-input
                v-model:value="bankNumber"
                type="text"
                class="mt-1"
                size="large"
                :placeholder="getTranslation('enter_bank_number')"
              />
            </div>

            <div v-if="depositAccount" class="mt-2">
              <div class="section-title">
                {{ getTranslation('deposit_account_information') }}
              </div>
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
</template>

<script setup>
import { ref, computed, onMounted, inject, reactive } from 'vue';
import { message } from 'ant-design-vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

const langState = inject('langState');
const siteText = inject('siteText', { value: {} });
const trlang = computed(() => langState?.translations || {});

const getTranslation = (key) =>
  trlang.value?.[key] ?? key;

const depositAccount = computed(() => {
  return siteText.value?.deposit_account_information || '';
});

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
const chargeList = ref([]);
const chargeAmount = ref(null);
const selectedMoAmount = ref(null);
const bankNumber = ref('');
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
});
const chargeSettings = ref({
  charge_min: null,
  charge_max: null,
  charge_timezone: false,
  charge_start_time: null,
  charge_end_time: null,
  charge_impossible_timezone_message: '',
  charge_complete_message: '',
});

const pageSizeOptions = computed(() => [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]);

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

const chargeListColumns = computed(() => [
  {
    title: getTranslation('no'),
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
  const currentAmount = chargeAmount.value || 0;
  chargeAmount.value = currentAmount + amount;
};

const resetChargeAmount = () => {
  selectedMoAmount.value = null;
  chargeAmount.value = null;
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

  if (!bankNumber.value || !bankNumber.value.trim()) {
    message.error(getTranslation('bank_number_required'));
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
      bank_number: bankNumber.value.trim(),
    });

    if (result.status) {
      const successMessage = result.data?.message || 
                             chargeSettings.value.charge_complete_message || 
                             getTranslation('fund_request_submitted');
      message.success(successMessage);
      resetChargeAmount();
      bankNumber.value = '';
      fetchChargeHistory(pagination.page, pagination.limit);
    }
  } catch (error) {
    console.error('Error requesting charging:', error);
    message.error(error.message || getTranslation('operation_failed'));
  } finally {
    loading.value = false;
  }
};

const handleCancelCharge = async (record) => {
  if (record.status !== 'WAIT') {
    return message.warning(getTranslation('only_pending_charges_can_be_cancelled'));
  }

  record.cancelling = true;
  try {
    const result = await postData(apiLink.cancel_fund, {
      transactionId: record._id,
    });
    
    if (result.status) {
      message.success(result.message || getTranslation('fund_request_cancelled'));
      fetchChargeHistory(pagination.page, pagination.limit);
    }
  } catch (error) {
    console.error('Error cancelling charge:', error);
    message.error(error.message || getTranslation('operation_failed'));
  } finally {
    record.cancelling = false;
  }
};

const fetchChargeHistory = async (page = 1, pageSize = 10) => {
  loadingHistory.value = true;
  try {
    const result = await getData(`${apiLink.get_fund_history}?page=${page}&limit=${pageSize}`);
    
    if (result.status && result.data) {
      const data = Array.isArray(result.data) ? result.data : (result.data.data || []);
      const paginationData = result.data.pagination || {};
      
      chargeList.value = data.map((item) => ({
        _id: item._id,
        chargeAmount: item.amount || 0,
        chargerName: item.user_nickname || '*',
        requestDate: item.createdAt,
        status: item.status || 'WAIT',
        cancelling: false,
      }));

      if (paginationData.total !== undefined && paginationData.total !== null) {
        pagination.total = paginationData.total;
      } else {
        pagination.total = chargeList.value.length;
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
      chargeList.value = [];
      pagination.total = 0;
      pagination.totalPages = 1;
    }
  } catch (error) {
    console.error('Error fetching charge history:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
    chargeList.value = [];
    pagination.total = 0;
    pagination.totalPages = 1;
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
    message.error(error.message || getTranslation('failed_to_fetch_data'));
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
    message.error(error.message || getTranslation('failed_to_fetch_data'));
  }
};

const handlePaginationChange = (page) => {
  pagination.page = page;
  fetchChargeHistory(page, pagination.limit);
};

const handlePageSizeChange = (pageSize) => {
  pagination.limit = pageSize;
  pagination.page = 1;
  fetchChargeHistory(1, pageSize);
};

onMounted(() => {
  fetchChargeHistory(pagination.page, pagination.limit);
  fetchBankNumber();
  fetchChargeSettings();
});
</script>

<style scoped>
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
  font-weight: 600;
  color: #ffffff !important;
}

.deposit-account-content {
  background: var(--glass-bg-light);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  padding: 6px 8px;
  margin-top: 4px;
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

