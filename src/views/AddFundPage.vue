<template>
  <div class="add-fund-page">
    <div class="bg-primary-light radius-2 p-5 mt-5">
      <a-card title="Add Funds" class="game-result-card">
        <a-space direction="vertical" size="large" class="w-100">
          <!-- Balance Display -->
          <div class="balance-display">
            <div class="balance-label">Current Balance</div>
            <div class="balance-amount">{{ balance.toLocaleString() }} {{ currency }}</div>
          </div>

          <!-- Amount Selection -->
          <div>
            <div class="section-title">Select Amount</div>
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
            <div class="section-title">Or Enter Custom Amount</div>
            <a-input-number
              v-model:value="customAmount"
              :min="1000"
              :max="10000000"
              :step="1000"
              class="w-100 mt-3"
              placeholder="Enter amount"
              size="large"
              @change="handleCustomAmountChange"
            />
          </div>

          <!-- Payment Method -->
          <div>
            <div class="section-title">Payment Method</div>
            <a-radio-group v-model:value="paymentMethod" class="w-100 mt-3">
              <a-row :gutter="[16, 16]">
                <a-col :span="12" v-for="method in paymentMethods" :key="method.value">
                  <a-radio-button :value="method.value" class="payment-method-btn w-100">
                    <div class="payment-method-content">
                      <span class="payment-icon">{{ method.icon }}</span>
                      <span>{{ method.label }}</span>
                    </div>
                  </a-radio-button>
                </a-col>
              </a-row>
            </a-radio-group>
          </div>

          <!-- Action Button -->
          <div class="text-center">
            <button
              class="glass-action-btn glass-action-green px-5 py-3 fs-3 font-bold cursor-pointer"
              :disabled="!canProceed"
              @click="handleAddFund"
            >
              Add Funds
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
const balance = ref(0);
const currency = ref('¥');
const selectedAmount = ref(null);
const customAmount = ref(null);
const paymentMethod = ref('bank_transfer');
const loading = ref(false);

// ✅ constants
const quickAmounts = [10000, 50000, 100000, 200000, 500000, 1000000];
const paymentMethods = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'crypto', label: 'Cryptocurrency', icon: '₿' },
  { value: 'e_wallet', label: 'E-Wallet', icon: '📱' },
];

const canProceed = computed(() => {
  return (selectedAmount.value || customAmount.value) && paymentMethod.value;
});

// ✅ methods
const handleCustomAmountChange = (value) => {
  if (value) {
    selectedAmount.value = null;
    customAmount.value = value;
  }
};

const handleAddFund = async () => {
  const amount = selectedAmount.value || customAmount.value;
  
  if (!amount || amount < 1000) {
    return message.error('Minimum amount is 1,000');
  }

  loading.value = true;
  try {
    // TODO: Replace with actual API endpoint when available
    const result = await postData(apiLink.add_fund || 'customer/fund/add', {
      amount: amount,
      payment_method: paymentMethod.value,
    });

    if (result.status) {
      message.success('Fund request submitted successfully!');
      selectedAmount.value = null;
      customAmount.value = null;
      fetchBalance();
    } else {
      message.error(result.message || 'Failed to add funds');
    }
  } catch (error) {
    console.error('Error adding funds:', error);
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
        balance.value = result.data.user.own_money || 0;
        currency.value = result.data.user.currency || '¥';
      } else {
        console.warn('User balance not found in API response:', result.data);
        balance.value = 0;
      }
    } else {
      console.error('Failed to fetch balance:', result.message);
      balance.value = 0;
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    balance.value = 0;
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

:deep(.ant-input-number:focus),
:deep(.ant-input-number-focused) {
  border-color: var(--glass-blue-border);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}
</style>

