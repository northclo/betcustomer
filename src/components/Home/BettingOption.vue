<template>
  <a-space v-if="!fetchLoading" direction="vertical" size="small">
    <div v-for="item in bettingOptions" :key="item.key">
      <div class="glass-label radius-top-2 text-white w-fit mb-2 p-2">
        {{ item.label }}
      </div>
      <a-row class="gap-2 glass-card p-2 radius-2 flex-col sm:flex-row">
        <a-col
          v-for="child in item.child"
          :key="child.key"
          :xs="24"
          :sm="Math.floor(24 / item.child.length)"
          :class="[
            'glass-option-btn flex-1 text-white flex items-center justify-center cursor-pointer p-2',
            child.radius,
            `glass-option-${child.bgColor}`,
            bettingType === child.key ? 'glass-option-active' : '',
          ]"
          @click="setBettingOption(child)"
        >
          <span class="fs-4 font-bold">
            {{ child.label }} {{ child.rate }}
          </span>
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

    <div class="glass-card p-3 radius-2">
      <a-row :gutter="[12, 6]">
        <a-col
          v-for="item in bettingAmountOptions"
          :key="item"
          :xs="24"
          :sm="Math.floor(24 / bettingAmountOptions.length)"
        >
          <button
            class="glass-btn w-100 p-2 fs-3 font-bold cursor-pointer"
            @click="setBetAmount(item)"
          >
            {{ item }}
          </button>
        </a-col>
      </a-row>

      <a-row :gutter="[12, 8]" class="pt-3">
        <a-col :xs="24" :md="5">
          <button
            class="glass-action-btn glass-action-pink text-white w-100 radius-1 cursor-pointer h-100 shadow-dark py-2"
            @click="resetBettingAmount"
          >
            {{ trlang.amount_reset }}
          </button>
        </a-col>

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
              :step="betUnitStep"
              :min="0"
              :precision="0"
              @change="handleBetAmountChange"
            />
          </a-flex>

          <button
            class="glass-action-btn glass-action-blue w-100 text-white radius-1 p-3 mt-5 cursor-pointer"
            @click="resetBetting"
          >
            {{ trlang.bet_reset }}
          </button>
        </a-col>

        <a-col :xs="24" :md="5">
          <a-button
            class="glass-action-btn glass-action-green text-white w-100 radius-1 cursor-pointer h-100 shadow-dark py-2"
            :disabled="!props.gameActivated || props.loading"
            :loading="props.loading"
            @click="startBetting"
          >
            {{ trlang.start_bet }}
          </a-button>
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

const BET_AMOUNTS = [10000, 20000, 50000, 100000];

const props = defineProps({
  bettingRemainTime: { type: Number, default: 0 },
  gameActivated: { type: Boolean, default: true },
  inactiveMessage: { type: String, default: '' },
  loading: { type: Boolean, default: false },
});

const bettingOptions = ref([]);
const bettingAmountOptions = ref(BET_AMOUNTS);
const bettingAmount = ref(0);
const bettingType = ref('');
const bettingRate = ref(0);
const benefitAmount = computed(() => bettingAmount.value * bettingRate.value);
const numberSort = ref([]);
const fetchLoading = ref(false);
const bettingLimits = ref(null);

const betUnitStep = computed(() => {
  if (bettingLimits.value && bettingLimits.value.bet_money_unit) {
    return Number(bettingLimits.value.bet_money_unit) || 1;
  }
  return 1;
});

const roundToBetUnit = (value) => {
  if (!value || value <= 0) return 0;
  if (!bettingLimits.value || !bettingLimits.value.bet_money_unit) return value;
  
  const betUnit = Number(bettingLimits.value.bet_money_unit);
  if (betUnit <= 0) return value;
  
  return Math.round(value / betUnit) * betUnit;
};

const handleBetAmountChange = (value) => {
  if (value === null || value === undefined) {
    bettingAmount.value = 0;
    return;
  }
  
  const rounded = roundToBetUnit(value);
  if (rounded !== value) {
    bettingAmount.value = rounded;
    if (rounded > 0) {
      message.info(
        formatTranslation('bet_amount_adjusted_to_unit', { 
          amount: rounded.toLocaleString(),
          unit: betUnitStep.value 
        })
      );
    }
  }
};

const emit = defineEmits(['startBetting']);

const normalizeRate = (value) => {
  if (typeof value !== 'number') return value;
  if (value > 10) return value / 100;
  if (value < 0.1) return value * 100;
  return value;
};

const fetchData = async () => {
  fetchLoading.value = true;
  try {
    const result = await getData(apiLink.get_init_betting_option);

    if (result.status) {
      bettingLimits.value = result.data.bettingLimits || null;

      if (bettingLimits.value && bettingLimits.value.bet_money_unit) {
        const betUnit = Number(bettingLimits.value.bet_money_unit);
        if (betUnit > 0) {
          bettingAmountOptions.value = BET_AMOUNTS.map(amount => 
            Math.round(amount / betUnit) * betUnit
          ).filter((amount, index, self) => 
            amount > 0 && self.indexOf(amount) === index
          );
        }
      } else {
        bettingAmountOptions.value = BET_AMOUNTS;
      }

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
    }
  } catch (error) {
    console.error('Error fetching betting options:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
  } finally {
    fetchLoading.value = false;
  }
};

const setBettingOption = (item) => {
  bettingType.value = item.key;
  bettingRate.value = item.rate;
  const lengthMap = { number_13: 3, number_14: 4, number_16: 6 };
  if (lengthMap[item.key]) {
    numberSort.value = Array(lengthMap[item.key]).fill('');
  } else {
    numberSort.value = [];
  }
};

const setBetAmount = (amount) => {
  const newAmount = bettingAmount.value + amount;
  bettingAmount.value = roundToBetUnit(newAmount);
};

const resetBettingAmount = () => {
  bettingAmount.value = 0;
};

const resetBetting = () => {
  bettingAmount.value = 0;
  bettingType.value = '';
  bettingRate.value = 0;
  numberSort.value = [];
};

const startBetting = async () => {
  if (!props.gameActivated) {
    const messageText = props.inactiveMessage || getTranslation('game_is_currently_disabled');
    return message.error(messageText);
  }

  if (!bettingAmount.value || !bettingRate.value)
    return message.error(trlang.value.you_should_set_betting_amount_and_type);

  if (bettingLimits.value) {
    const amount = Number(bettingAmount.value);
    const rate = Number(bettingRate.value);
    const potentialEarning = amount * rate;

    if (bettingLimits.value.bet_money_unit) {
      const betUnit = Number(bettingLimits.value.bet_money_unit);
      if (betUnit > 0 && amount % betUnit !== 0) {
        return message.error(
          formatTranslation('bet_amount_must_be_multiple_of_unit', { unit: betUnit })
        );
      }
    }

    if (bettingLimits.value.onetime_bet_min !== null && bettingLimits.value.onetime_bet_min > 0) {
      if (amount < bettingLimits.value.onetime_bet_min) {
        return message.error(
          formatTranslation('bet_amount_below_minimum', { min: bettingLimits.value.onetime_bet_min })
        );
      }
    }

    if (bettingLimits.value.onetime_bet_max !== null && bettingLimits.value.onetime_bet_max > 0) {
      if (amount > bettingLimits.value.onetime_bet_max) {
        return message.error(
          formatTranslation('bet_amount_exceeds_maximum', { max: bettingLimits.value.onetime_bet_max })
        );
      }
    }

    if (bettingLimits.value.onetime_earning_max !== null && bettingLimits.value.onetime_earning_max > 0) {
      if (potentialEarning > bettingLimits.value.onetime_earning_max) {
        return message.error(
          formatTranslation('potential_earning_exceeds_maximum', { max: bettingLimits.value.onetime_earning_max })
        );
      }
    }
  }

  let processedNumberSort = [];
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

    processedNumberSort = numberSort.value.map((item) => Number(item));
    const notMatch = processedNumberSort.filter((item) => !Number.isInteger(item) || item < 1 || item > 6);
    if (notMatch.length > 0)
      return message.error(trlang.value.number_should_be_from_1_to_6);
  }

  emit('startBetting', {
    bettingAmount: bettingAmount.value,
    bettingType: bettingType.value,
    bettingRate: bettingRate.value,
    numberSort: processedNumberSort,
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
  border: 1px solid var(--glass-border);
}

.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
}

.glass-btn {
  background: var(--glass-bg-dark);
  border: 1px solid var(--glass-border);
  color: var(--white-color);
  border-radius: 4px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.glass-btn:hover {
  background: var(--glass-bg-light);
}

:deep(.ant-input-number),
:deep(.ant-input) {
  background: var(--glass-bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 4px;
  color: var(--white-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.ant-input-number:focus),
:deep(.ant-input:focus) {
  background: var(--glass-bg-light);
  border-color: var(--glass-border-light);
}

:deep(.ant-input-number-input) {
  background: transparent;
  color: var(--white-color);
}

/* Glassmorphism Betting Option Buttons */
.glass-option-btn {
  border: 2px solid !important;
  border-radius: 4px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  min-height: 48px;
  white-space: nowrap;
}

.glass-option-btn > span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
}

.glass-option-danger {
  background: var(--glass-red) !important;
  border-color: var(--glass-red-border) !important;
}

.glass-option-danger:hover {
  background: var(--glass-red-light) !important;
  border-color: var(--glass-red-border) !important;
}

.glass-option-primary {
  background: var(--glass-blue) !important;
  border-color: var(--glass-blue-border) !important;
}

.glass-option-primary:hover {
  background: var(--glass-blue-light) !important;
  border-color: var(--glass-blue-border) !important;
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
  position: relative;
  font-weight: 700;
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
  border: 2px solid;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
  box-shadow: var(--glass-shadow-soft);
  font-weight: 600;
}

.glass-action-btn:hover {
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
  border: 1px solid var(--glass-border);
  border-right: none;
  border-radius: 4px 0 0 4px;
  box-shadow: var(--glass-shadow-soft);
}

.glass-info-value {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-left: none;
  border-radius: 0 4px 4px 0;
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
