<template>
  <div class="refund-page">
    <div class="bg-primary-light radius-2 p-5 mt-5">
      <a-card :title="trlang.withdraw_funds" class="game-result-card">
        <a-space direction="vertical" size="large" class="w-100">
          <!-- Balance Display -->
          <div class="balance-display">
            <div class="balance-label">
              {{ trlang.available_balance }}
            </div>
            <div class="balance-amount">
              {{ availableBalance.toLocaleString() }} {{ trlang.currency }}
            </div>
          </div>

          <!-- Withdrawal Amount -->
          <div>
            <div class="section-title">
              {{ trlang.withdrawal_amount }}
            </div>
            <a-input-number
              v-model:value="withdrawalAmount"
              :min="1"
              :max="availableBalance"
              :step="1"
              :controls="false"
              class="w-100 mt-3 custom-withdrawal-input"
              :placeholder="trlang.enter_withdrawal_amount"
              size="large"
              @change="handleWithdrawalAmountChange"
              @keypress="handleKeyPress"
              @paste="handlePaste"
            />
            <div class="amount-options mt-3">
              <button
                v-for="percent in [25, 50, 75, 100]"
                :key="percent"
                class="percent-btn glass-btn"
                @click="setPercentAmount(percent)"
              >
                {{ percent }}%
              </button>
            </div>
          </div>

          <!-- Action Button -->
          <div class="text-center">
            <button
              class="glass-action-btn glass-action-green text-white px-5 py-3 fs-3 font-bold cursor-pointer"
              :disabled="!canWithdraw || loading"
              @click="handleWithdraw"
            >
              {{ loading ? trlang.processing : trlang.request_withdrawal }}
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

const availableBalance = ref(0);
const withdrawalAmount = ref(null);
const loading = ref(false);

const MIN_WITHDRAW_AMOUNT = 1;

const canWithdraw = computed(() => {
  return withdrawalAmount.value &&
         withdrawalAmount.value >= MIN_WITHDRAW_AMOUNT &&
         withdrawalAmount.value <= availableBalance.value;
});

const validateAmount = (amount) => {
  if (!amount) {
    return { valid: false, error: formatTranslation('minimum_amount_is', { amount: MIN_WITHDRAW_AMOUNT }) };
  }
  
  const numAmount = Number(amount);
  if (isNaN(numAmount) || !isFinite(numAmount)) {
    return { valid: false, error: getTranslation('invalid_amount') };
  }
  
  if (numAmount < MIN_WITHDRAW_AMOUNT) {
    return { 
      valid: false, 
      error: formatTranslation('minimum_amount_is', { amount: MIN_WITHDRAW_AMOUNT }) 
    };
  }
  
  if (numAmount > availableBalance.value) {
    return { valid: false, error: getTranslation('insufficient_balance') };
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
    withdrawalAmount.value = Number(sanitized) || null;
  }
};

const handleWithdrawalAmountChange = (value) => {
  withdrawalAmount.value = value;
};

const setPercentAmount = (percent) => {
  withdrawalAmount.value = Math.max(
    MIN_WITHDRAW_AMOUNT,
    Math.floor((availableBalance.value * percent) / 100)
  );
};

const handleWithdraw = async () => {
  const validation = validateAmount(withdrawalAmount.value);
  
  if (!validation.valid) {
    return message.error(validation.error);
  }

  loading.value = true;
  try {
    const result = await postData(apiLink.withdraw, {
      amount: validation.value,
    });

    if (result.status) {
      message.success(
        result.message ||
          getTranslation('withdrawal_request_submitted')
      );
      withdrawalAmount.value = null;
      if (result.data) {
        availableBalance.value = result.data.balance ?? availableBalance.value;
      } else {
        fetchBalance();
      }
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    message.error(error.message || getTranslation('operation_failed'));
  } finally {
    loading.value = false;
  }
};

const fetchBalance = async () => {
  try {
    const result = await getData(apiLink.get_betting_info);
    if (result.status && result.data) {
      if (result.data.user) {
        const userData = result.data.user;
        availableBalance.value = userData.own_money || 0;
      } else {
        console.warn('User balance not found in API response:', result.data);
        availableBalance.value = 0;
      }
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
    availableBalance.value = 0;
  }
};

onMounted(() => {
  fetchBalance();
});
</script>

<style scoped>
.refund-page {
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
  margin-bottom: 10px;
}

.pending-amount {
  color: var(--white-color);
  font-size: 16px;
  opacity: 0.8;
  margin-bottom: 6px;
}

.balance-note {
  color: var(--white-color);
  font-size: 14px;
  opacity: 0.7;
}

.section-title {
  color: var(--white-color);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.amount-options {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.percent-btn {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid var(--glass-border);
  color: var(--white-color);
  border-radius: 10px;
  padding: 8px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.percent-btn:hover {
  background: var(--glass-blue-light);
  border-color: var(--glass-blue-border);
}

:deep(.ant-input),
:deep(.ant-input-number),
:deep(.ant-input-number-input) {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  color: var(--white-color);
  font-size: 16px;
}

:deep(.ant-input-number input) {
  color: var(--white-color);
}

/* Placeholder styling */
:deep(.ant-input-number input::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.ant-input:focus),
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

:deep(.ant-tag) {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  padding: 4px 12px;
}
</style>

