<template>
  <div class="add-fund-page">
    <div class="bg-primary-light radius-2 p-5 mt-5">
      <a-card :title="trlang.add_funds" class="game-result-card">
        <a-space direction="vertical" size="large" class="w-100">
          <!-- Balance Display -->
          <div class="balance-display">
            <div class="balance-label">{{ trlang.current_balance }}</div>
            <div class="balance-amount">
              {{ balance.toLocaleString() }} {{ trlang.currency }}
            </div>
            <div class="pending-amount" v-if="pendingAddBalance > 0">
              {{ trlang.pending_approval }}:
              {{ pendingAddBalance.toLocaleString() }} {{ trlang.currency }}
            </div>
          </div>

          <!-- Amount Selection -->
          <div>
            <div class="section-title">{{ trlang.select_amount }}</div>
            <a-row :gutter="[16, 16]" class="mt-3">
              <a-col
                v-for="amount in quickAmounts"
                :key="amount"
                :span="8"
              >
                <button
                  class="amount-btn glass-btn w-100 p-3 cursor-pointer"
                  :class="{ 'amount-btn-active': selectedAmount === amount }"
                  @click="selectedAmount = amount"
                >
                  {{ amount.toLocaleString() }}
                </button>
              </a-col>
            </a-row>
          </div>

          <!-- Custom Amount Input -->
          <div>
            <div class="section-title">{{ trlang.enter_custom_amount }}</div>
            <a-input-number
              v-model:value="customAmount"
              :min="1"
              :max="10000000"
              :step="1"
              :controls="false"
              class="w-100 mt-3"
              :placeholder="trlang.enter_amount"
              size="large"
              @change="handleCustomAmountChange"
              @keypress="handleKeyPress"
              @paste="handlePaste"
            />
          </div>

          <!-- Action Button -->
          <div class="text-center">
            <button
              class="glass-action-btn glass-action-green text-white px-5 py-3 fs-3 font-bold cursor-pointer"
              :disabled="!canProceed || loading"
              @click="handleAddFund"
            >
              {{ loading ? trlang.processing : trlang.add_funds }}
            </button>
          </div>
        </a-space>
      </a-card>
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

// ✅ state
const balance = ref(0);
const pendingAddBalance = ref(0);
const selectedAmount = ref(null);
const customAmount = ref(null);
const loading = ref(false);

// ✅ constants
const MIN_ADD_AMOUNT = 1;
const quickAmounts = [1, 10, 20, 50, 100, 200];
const canProceed = computed(() => {
  return Boolean(selectedAmount.value || customAmount.value);
});

// ✅ methods
const validateAmount = (amount) => {
  if (!amount) {
    return { valid: false, error: formatTranslation('minimum_amount_is', { amount: MIN_ADD_AMOUNT }) };
  }
  
  const numAmount = Number(amount);
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return { valid: false, error: getTranslation('invalid_amount') };
  }
  
  if (numAmount < MIN_ADD_AMOUNT || numAmount > 10000000) {
    return { 
      valid: false, 
      error: formatTranslation('amount_must_be_between', { min: MIN_ADD_AMOUNT, max: 10000000 }) 
    };
  }
  
  return { valid: true, value: numAmount };
};

const handleKeyPress = (event) => {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  
  if (event.ctrlKey || event.metaKey || allowedKeys.includes(event.key)) {
    return;
  }
  
  const char = event.key || String.fromCharCode(event.which || event.keyCode);
  if (!/[\d.]/.test(char)) {
    event.preventDefault();
  }
};

const handlePaste = (event) => {
  event.preventDefault();
  const pastedText = (event.clipboardData || window.clipboardData).getData('text');
  const sanitized = pastedText.replace(/[^\d.]/g, '');
  if (sanitized) {
    customAmount.value = Number(sanitized) || null;
    selectedAmount.value = null;
  }
};

const handleCustomAmountChange = (value) => {
  selectedAmount.value = null;
  customAmount.value = value;
};

const handleAddFund = async () => {
  const amount = selectedAmount.value || customAmount.value;
  const validation = validateAmount(amount);
  
  if (!validation.valid) {
    return message.error(validation.error);
  }

  loading.value = true;
  try {
    const result = await postData(apiLink.add_fund, {
      amount: validation.value,
    });

    if (result.status) {
      message.success(
        result.message || getTranslation('fund_request_submitted')
      );
      selectedAmount.value = null;
      customAmount.value = null;
      fetchBalance();
    } else {
      message.error(
        result.message || getTranslation('failed_to_add_funds')
      );
    }
  } catch (error) {
    console.error('Error adding funds:', error);
    message.error(
      getTranslation('unexpected_error_try_again')
    );
  } finally {
    loading.value = false;
  }
};

const fetchBalance = async () => {
  try {
    const result = await getData(apiLink.get_betting_info);
    if (result.status && result.data) {
      const userData = result.data.user || {};
      const latestBalance = userData.own_money || 0;

      if (typeof latestBalance !== 'undefined') {
        balance.value = latestBalance || 0;
        pendingAddBalance.value = userData.pending_addfund_balance ?? 0;
      } else {
        console.warn('User balance not found in API response:', result.data);
        balance.value = 0;
        pendingAddBalance.value = 0;
      }
    } else {
      console.error('Failed to fetch balance:', result.message);
      balance.value = 0;
      pendingAddBalance.value = 0;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    balance.value = 0;
    pendingAddBalance.value = 0;
  }
};

// ✅ lifecycle
onMounted(() => {
  fetchBalance();
});
</script>

<style scoped>
.add-fund-page {
  min-height: 80vh;
}

.balance-display {
  text-align: center;
  padding: 30px;
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
}

.balance-label {
  color: var(--white-color);
  font-size: 16px;
  margin-bottom: 10px;
  opacity: 0.8;
}

.balance-amount {
  color: var(--white-color);
  font-size: 36px;
  font-weight: 700;
}

.pending-amount {
  margin-top: 8px;
  color: var(--white-color);
  font-size: 16px;
  opacity: 0.8;
}

.section-title {
  color: var(--white-color);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.amount-btn {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid var(--glass-border);
  color: var(--white-color);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.amount-btn:hover {
  background: var(--glass-bg-light);
  border-color: var(--glass-blue-border);
  transform: translateY(-2px);
  box-shadow: var(--glass-shadow);
}

.amount-btn-active {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.4) !important;
}

.payment-method-btn {
  height: 60px;
  border-radius: 12px;
}

.payment-method-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
}

.payment-icon {
  font-size: 24px;
}

:deep(.ant-radio-button-wrapper) {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid var(--glass-border) !important;
  color: var(--white-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-radio-button-wrapper:hover) {
  background: var(--glass-bg-light);
  border-color: var(--glass-blue-border) !important;
}

:deep(.ant-radio-button-wrapper-checked) {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.3) !important;
}

:deep(.ant-input-number),
:deep(.ant-input-number-input) {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  color: var(--white-color);
  font-size: 18px;
}

:deep(.ant-input-number input) {
  color: var(--white-color);
}

:deep(.ant-input-number input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.ant-input-number:focus),
:deep(.ant-input-number-focused) {
  border-color: var(--glass-blue-border);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

/* Hide spinner arrows */
:deep(.ant-input-number-handler-wrap) {
  display: none !important;
}

:deep(.ant-input-number-input-wrap) {
  padding-right: 0 !important;
}
</style>

