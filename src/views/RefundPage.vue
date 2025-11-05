<template>
  <div class="refund-page">
    <div class="bg-primary-light radius-2 p-5 mt-5">
      <a-card title="Withdraw Funds" class="game-result-card">
        <a-space direction="vertical" size="large" class="w-100">
          <!-- Balance Display -->
          <div class="balance-display">
            <div class="balance-label">Available Balance</div>
            <div class="balance-amount">{{ availableBalance.toLocaleString() }} {{ currency }}</div>
            <div class="balance-note">Minimum withdrawal: 10,000 {{ currency }}</div>
          </div>

          <!-- Withdrawal Amount -->
          <div>
            <div class="section-title">Withdrawal Amount</div>
            <a-input-number
              v-model:value="withdrawalAmount"
              :min="10000"
              :max="availableBalance"
              :step="1000"
              class="w-100 mt-3"
              placeholder="Enter withdrawal amount"
              size="large"
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

          <!-- Withdrawal Method -->
          <div>
            <div class="section-title">Withdrawal Method</div>
            <a-radio-group v-model:value="withdrawalMethod" class="w-100 mt-3">
              <a-row :gutter="[16, 16]">
                <a-col :span="12" v-for="method in withdrawalMethods" :key="method.value">
                  <a-radio-button :value="method.value" class="withdrawal-method-btn w-100">
                    <div class="payment-method-content">
                      <span class="payment-icon">{{ method.icon }}</span>
                      <span>{{ method.label }}</span>
                    </div>
                  </a-radio-button>
                </a-col>
              </a-row>
            </a-radio-group>
          </div>

          <!-- Account Details -->
          <div v-if="withdrawalMethod">
            <div class="section-title">Account Details</div>
            <a-space direction="vertical" class="w-100 mt-3" size="middle">
              <a-input
                v-model:value="accountNumber"
                placeholder="Account Number / Wallet Address"
                size="large"
              />
              <a-input
                v-model:value="accountName"
                placeholder="Account Holder Name"
                size="large"
              />
              <a-input
                v-if="withdrawalMethod === 'bank_transfer'"
                v-model:value="bankName"
                placeholder="Bank Name"
                size="large"
              />
            </a-space>
          </div>

          <!-- Action Button -->
          <div class="text-center">
            <button
              class="glass-action-btn glass-action-green px-5 py-3 fs-3 font-bold cursor-pointer"
              :disabled="!canWithdraw"
              @click="handleWithdraw"
            >
              Request Withdrawal
            </button>
          </div>
        </a-space>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

// ✅ state
const availableBalance = ref(0);
const currency = ref('¥');
const withdrawalAmount = ref(null);
const withdrawalMethod = ref('bank_transfer');
const accountNumber = ref('');
const accountName = ref('');
const bankName = ref('');
const loading = ref(false);

// ✅ constants
const withdrawalMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'e_wallet', label: 'E-Wallet', icon: '📱' },
];

const canWithdraw = computed(() => {
  return withdrawalAmount.value &&
         withdrawalAmount.value >= 10000 &&
         withdrawalAmount.value <= availableBalance.value &&
         withdrawalMethod.value &&
         accountNumber.value &&
         accountName.value;
});

// ✅ methods
const setPercentAmount = (percent) => {
  withdrawalAmount.value = Math.floor((availableBalance.value * percent) / 100);
};

const handleWithdraw = async () => {
  if (!canWithdraw.value) {
    return message.error('Please fill all required fields');
  }

  loading.value = true;
  try {
    // TODO: Replace with actual API endpoint when available
    const result = await postData(apiLink.withdraw || 'customer/fund/withdraw', {
      amount: withdrawalAmount.value,
      withdrawal_method: withdrawalMethod.value,
      account_number: accountNumber.value,
      account_name: accountName.value,
      bank_name: bankName.value,
    });

    if (result.status) {
      message.success('Withdrawal request submitted successfully!');
      withdrawalAmount.value = null;
      accountNumber.value = '';
      accountName.value = '';
      bankName.value = '';
      fetchBalance();
    } else {
      message.error(result.message || 'Failed to process withdrawal');
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    message.error('An error occurred. Please try again.');
  } finally {
    loading.value = false;
  }
};

const fetchBalance = async () => {
  try {
    const result = await getData(apiLink.get_betting_info);
    if (result.status && result.data) {
      // Check if user data exists in response
      if (result.data.user && typeof result.data.user.own_money !== 'undefined') {
        availableBalance.value = result.data.user.own_money || 0;
        currency.value = result.data.user.currency || '¥';
      } else {
        console.warn('User balance not found in API response:', result.data);
        availableBalance.value = 0;
      }
    } else {
      console.error('Failed to fetch balance:', result.message);
      availableBalance.value = 0;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    availableBalance.value = 0;
  }
};

// ✅ lifecycle
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
  transform: translateY(-2px);
}

.withdrawal-method-btn {
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

:deep(.ant-input:focus),
:deep(.ant-input-number:focus),
:deep(.ant-input-number-focused) {
  border-color: var(--glass-blue-border);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

:deep(.ant-tag) {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  padding: 4px 12px;
}
</style>

