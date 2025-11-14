<template>
  <a-space v-if="!loading" direction="vertical" size="middle">
    <div v-for="item in bettingOptions" :key="item.key">
      <div class="glass-label radius-top-2 text-white w-fit mb-2 p-2">
        {{ item.label }}
      </div>
      <a-row class="gap-2 glass-card p-4 radius-2 flex-col sm:flex-row">
        <a-col
          v-for="child in item.child"
          :key="child.key"
          :xs="24"
          :sm="Math.floor(24 / item.child.length)"
          :class="[
            'glass-option-btn flex-1 text-white flex justify-between items-center cursor-pointer p-3',
            child.radius,
            `glass-option-${child.bgColor}`,
            bettingType === child.key ? 'glass-option-active' : '',
          ]"
          @click="setBettingOption(child)"
        >
          <div class="fs-4 font-bold">
            {{ child.label }}
          </div>
          <div class="fs-4">
            {{ child.rate }}
          </div>
        </a-col>
      </a-row>
    </div>

    <div v-if="numberSort.length !== 0">
      <div class="glass-label radius-top-2 text-white w-fit mb-2 p-2">
        {{ trlang.number_sort }}
      </div>
      <a-flex class="glass-card py-2 px-2 md:p-4" justify="center" gap="middle">
        <a-input
          v-for="index in numberSort.length"
          :key="index"
          v-model:value="numberSort[index - 1]"
          class="text-center"
          style="width: 40px"
        />
      </a-flex>
    </div>

    <div class="glass-card p-4 radius-2">
      <a-row :gutter="[15, 8]">
        <a-col
          v-for="item in bettingAmountOptions"
          :key="item"
          :xs="24"
          :sm="Math.floor(24 / bettingAmountOptions.length)"
        >
          <button
            class="glass-btn w-100 p-3 fs-3 font-bold cursor-pointer"
            @click="setBetAmount(item)"
          >
            {{ item }}
          </button>
        </a-col>
      </a-row>

      <a-row :gutter="[15, 12]" class="pt-5">
        <!-- Reset -->
        <a-col :xs="24" :md="5">
          <button
            class="glass-action-btn glass-action-pink text-white w-100 radius-1 cursor-pointer h-100 shadow-dark py-2"
            @click="resetBettingAmount"
          >
            {{ trlang.amount_reset }}
          </button>
        </a-col>

        <!-- Percentage, Benefit, Betting Amount -->
        <a-col :xs="24" :md="14">
          <a-flex justify="space-between" class="gap-2 flex-col sm:flex-row">
            <div class="flex flex-1">
              <a-typography-text
                class="glass-info-label flex-1 flex items-center justify-center text-white"
              >
                {{ trlang.percentage }}
              </a-typography-text>
              <a-typography-text
                class="glass-info-value p-3 flex items-center justify-center text-white"
              >
                {{ bettingRate || '0.0' }}
              </a-typography-text>
            </div>

            <div class="flex flex-1">
              <a-typography-text
                class="glass-info-label flex-1 flex items-center justify-center text-white"
              >
                {{ trlang.benefit }}
              </a-typography-text>
              <a-typography-text
                class="glass-info-value p-3 flex items-center justify-center text-white"
              >
                {{ Math.floor(benefitAmount) }}
              </a-typography-text>
            </div>

            <a-input-number
              v-model:value="bettingAmount"
              class="fs-4 benefit-amount"
            />
          </a-flex>

          <button
            class="glass-action-btn glass-action-blue w-100 text-white radius-1 p-3 mt-5 cursor-pointer"
            @click="resetBetting"
          >
            {{ trlang.bet_reset }}
          </button>
        </a-col>

        <!-- Start Bet -->
        <a-col :xs="24" :md="5">
          <button
            class="glass-action-btn glass-action-green text-white w-100 radius-1 cursor-pointer h-100 shadow-dark py-2"
            @click="startBetting"
          >
            {{ trlang.start_bet }}
          </button>
        </a-col>
      </a-row>
    </div>
  </a-space>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue';
import { message } from 'ant-design-vue';
import { getData } from '@/helpers/Axios.js';
import { apiLink } from '../../utils/api-link';

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

// ✅ constants
const BET_AMOUNTS = [10000, 20000, 50000, 100000];

// ✅ props
const props = defineProps({
  bettingRemainTime: { type: Number, default: 0 },
});

// ✅ states
const bettingOptions = ref([]);
const bettingAmountOptions = ref(BET_AMOUNTS);
const bettingAmount = ref(0);
const bettingType = ref('');
const bettingRate = ref(0);
const benefitAmount = computed(() => bettingAmount.value * bettingRate.value);
const numberSort = ref([]);
const loading = ref(false);

const emit = defineEmits(['startBetting']);

// Helper function to normalize rate values from API
// API may return values as: 193 (representing 1.93%), 1.93 (direct), or 0.0193 (decimal)
const normalizeRate = (value) => {
  if (typeof value !== 'number') return value;
  // If value is > 10, it's likely in format like 193 (representing 1.93%), divide by 100
  if (value > 10) return value / 100;
  // If value is < 0.1, it might be in decimal format like 0.0193, multiply by 100
  if (value < 0.1) return value * 100;
  // Otherwise, use value directly (already in correct format like 1.93)
  return value;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const result = await getData(apiLink.get_init_betting_option);

    if (result.status) {
      // build betting options
      bettingOptions.value = [
        {
          key: 'normal',
          label: trlang.value.normal,
          child: [
            {
              key: 'odd',
              label: trlang.value.odd,
              rate: normalizeRate(result.data.odd),
              bgColor: 'success',
              radius: 'radius-left-2',
            },
            {
              key: 'even',
              label: trlang.value.even,
              rate: normalizeRate(result.data.even),
              bgColor: 'danger',
            },
            {
              key: 'under',
              label: trlang.value.under,
              rate: normalizeRate(result.data.under),
              bgColor: 'success',
            },
            {
              key: 'over',
              label: trlang.value.over,
              rate: normalizeRate(result.data.over),
              bgColor: 'danger',
              radius: 'radius-right-2',
            },
          ],
        },
        {
          key: 'combined',
          label: trlang.value.combined,
          child: [
            {
              key: 'odd_under',
              label: trlang.value.odd_under,
              rate: normalizeRate(result.data.odd_under),
              bgColor: 'primary',
              radius: 'radius-left-2',
            },
            {
              key: 'odd_over',
              label: trlang.value.odd_over,
              rate: normalizeRate(result.data.odd_over),
              bgColor: 'pink',
            },
            {
              key: 'even_under',
              label: trlang.value.even_under,
              rate: normalizeRate(result.data.even_under),
              bgColor: 'primary',
            },
            {
              key: 'even_over',
              label: trlang.value.even_over,
              rate: normalizeRate(result.data.even_over),
              bgColor: 'pink',
              radius: 'radius-right-2',
            },
          ],
        },
        {
          key: 'number_match',
          label: trlang.value.number_match,
          child: [
            {
              key: 'number_13',
              label: trlang.value.number_13,
              rate: normalizeRate(result.data.match_number1),
              bgColor: 'danger',
              radius: 'radius-left-2',
            },
            {
              key: 'number_14',
              label: trlang.value.number_14,
              rate: normalizeRate(result.data.match_number2),
              bgColor: 'success',
            },
            {
              key: 'number_16',
              label: trlang.value.number_16,
              rate: normalizeRate(result.data.match_number3),
              bgColor: 'primary',
              radius: 'radius-right-2',
            },
          ],
        },
      ];
    } else {
      console.error('Failed to fetch betting options:', result);
      message.error(getTranslation('failed_to_load_betting_options'));
    }
  } catch (error) {
    console.error('Error fetching betting options:', error);
    message.error(getTranslation('error_loading_betting_options'));
  } finally {
    loading.value = false;
  }
};

const setBettingOption = (item) => {
  bettingType.value = item.key;
  bettingRate.value = item.rate;
  // Show number input form when number 13, 14, or 16 is selected
  const lengthMap = { number_13: 3, number_14: 4, number_16: 6 };
  if (lengthMap[item.key]) {
    numberSort.value = Array(lengthMap[item.key]).fill('');
  } else {
    numberSort.value = [];
  }
};

const setBetAmount = (amount) => {
  bettingAmount.value += amount;
};

const resetBettingAmount = () => {
  bettingAmount.value = 0;
};

const resetBetting = () => {
  bettingAmount.value = 0;
  bettingRate.value = 0;
  numberSort.value = [];
};

const startBetting = async () => {
  // Betting window: 3 mins (180s) to 1.5 mins (90s) - can bet and cancel
  // After 1.5 mins (90s) - block betting
  const remainTime = props.bettingRemainTime || 0;
  if (remainTime < 90 || remainTime > 180) {
    const timeMsg =
      remainTime === 0
        ? getTranslation('no_active_game')
        : remainTime > 180
          ? formatTranslation('betting_not_available_yet', {
              minutes: Math.ceil((remainTime - 180) / 60),
            })
          : formatTranslation('betting_window_closed', {
              minutes: Math.ceil((90 - remainTime) / 60),
            });
    return message.error(timeMsg);
  }

  if (!bettingAmount.value || !bettingRate.value)
    return message.error(trlang.value.you_should_set_betting_amount_and_type);

  if (numberSort.value.length !== 0) {
    const noDuplicates =
      new Set(numberSort.value).size === numberSort.value.length;
    if (!noDuplicates)
      return message.error(trlang.value.number_should_not_be_duplicate);

    const notNumber = numberSort.value.filter(
      (item) => isNaN(Number(item)) || item === '' || item === null
    );
    if (notNumber.length > 0)
      return message.error(trlang.value.number_should_be_number);

    const notMatch = numberSort.value.filter((item) => item < 1 || item > 6);
    if (notMatch.length > 0)
      return message.error(trlang.value.number_should_be_from_1_to_6);
  }

  emit('startBetting', {
    bettingAmount: bettingAmount.value,
    bettingType: bettingType.value,
    bettingRate: bettingRate.value,
    numberSort: numberSort.value,
  });

  resetBetting();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.glass-label {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow-soft);
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-lg);
  -webkit-backdrop-filter: var(--blur-lg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-card:hover {
  box-shadow: var(--glass-shadow-strong);
  transform: translateY(-2px);
}

.glass-btn {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  color: var(--white-color);
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--glass-shadow-soft);
}

.glass-btn:hover {
  background: var(--glass-bg-light);
  transform: translateY(-2px);
  box-shadow: var(--glass-shadow);
}

:deep(.ant-input-number),
:deep(.ant-input) {
  background: var(--glass-bg-dark);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: var(--white-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-input-number:focus),
:deep(.ant-input:focus) {
  background: var(--glass-bg-light);
  border-color: var(--glass-border-light);
  box-shadow: var(--glass-shadow-soft);
}

:deep(.ant-input-number-input) {
  background: transparent;
  color: var(--white-color);
}

/* Glassmorphism Betting Option Buttons */
.glass-option-btn {
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid !important;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--glass-shadow-soft);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.glass-option-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glass-shadow);
}

.glass-option-btn > * {
  position: relative;
  z-index: 1;
}

/* Color Variants */
.glass-option-success {
  background: var(--glass-green) !important;
  border-color: var(--glass-green-border) !important;
}

.glass-option-success:hover {
  background: var(--glass-green-light) !important;
  border-color: var(--glass-green-border) !important;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

.glass-option-danger {
  background: var(--glass-red) !important;
  border-color: var(--glass-red-border) !important;
}

.glass-option-danger:hover {
  background: var(--glass-red-light) !important;
  border-color: var(--glass-red-border) !important;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.glass-option-primary {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
}

.glass-option-primary:hover {
  background: var(--glass-blue-light) !important;
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
}

.glass-option-pink {
  background: var(--glass-pink) !important;
  border-color: var(--glass-pink-border) !important;
}

.glass-option-pink:hover {
  background: var(--glass-pink-light) !important;
  border-color: var(--glass-pink-border) !important;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.3);
}

/* Active State - Enhanced Selected Effect */
.glass-option-active {
  transform: scale(1.05);
  border-width: 3px !important;
  position: relative;
  font-weight: 700;
}

.glass-option-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  background: inherit;
  opacity: 0.3;
  animation: pulse-glow 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.02);
  }
}

.glass-option-active.glass-option-success {
  background: var(--glass-green-active) !important;
  border-color: var(--glass-green-active-border) !important;
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.6), 
              0 0 15px rgba(16, 185, 129, 0.4),
              inset 0 0 15px rgba(16, 185, 129, 0.2) !important;
}

.glass-option-active.glass-option-danger {
  background: var(--glass-red-active) !important;
  border-color: var(--glass-red-active-border) !important;
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), 
              0 0 15px rgba(239, 68, 68, 0.4),
              inset 0 0 15px rgba(239, 68, 68, 0.2) !important;
}

.glass-option-active.glass-option-primary {
  background: var(--glass-blue-active) !important;
  border-color: var(--glass-blue-active-border) !important;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.6), 
              0 0 15px rgba(99, 102, 241, 0.4),
              inset 0 0 15px rgba(99, 102, 241, 0.2) !important;
}

.glass-option-active.glass-option-pink {
  background: var(--glass-pink-active) !important;
  border-color: var(--glass-pink-active-border) !important;
  box-shadow: 0 0 30px rgba(236, 72, 153, 0.6), 
              0 0 15px rgba(236, 72, 153, 0.4),
              inset 0 0 15px rgba(236, 72, 153, 0.2) !important;
}

/* Action Buttons */
.glass-action-btn {
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--glass-shadow-soft);
  font-weight: 600;
}

.glass-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glass-shadow);
}

.glass-action-pink {
  background: var(--glass-pink) !important;
  border-color: var(--glass-pink-border) !important;
}

.glass-action-pink:hover {
  background: var(--glass-pink-light) !important;
  box-shadow: 0 0 20px rgba(236, 72, 153, 0.4);
}

.glass-action-blue {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
}

.glass-action-blue:hover {
  background: var(--glass-blue-light) !important;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
}

.glass-action-green {
  background: var(--glass-green) !important;
  border-color: var(--glass-green-border) !important;
}

.glass-action-green:hover {
  background: var(--glass-green-light) !important;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
}

/* Info Display */
.glass-info-label {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  border-right: none;
  border-radius: 10px 0 0 10px;
  box-shadow: var(--glass-shadow-soft);
}

.glass-info-value {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  border-left: none;
  border-radius: 0 10px 10px 0;
  box-shadow: var(--glass-shadow-soft);
}

.benefit-amount {
  width: 100%;
}

@media (min-width: 576px) {
  .benefit-amount {
    width: 90px;
  }
}
</style>
