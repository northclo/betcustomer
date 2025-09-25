<template>
  <a-space v-if="!loading" direction="vertical" size="middle">
    <div v-for="item in bettingOptions" :key="item.key">
      <div class="radius-top-2 text-white bg-black w-fit ms-5 p-2">
        {{ item.label }}
      </div>
      <a-row class="gap-2 bg-black p-4 radius-2">
        <a-col
          v-for="child in item.child"
          :key="child.key"
          :span="24 / item.child.length"
          :class="[
            'flex-1 text-white flex justify-between items-center cursor-pointer p-3',
            child.radius,
            `bg-${child.bgColor}`,
          ]"
          @click="setBettingOption(child)"
        >
          <div class="fs-3 font-bold">{{ child.label }}</div>
          <div class="fs-4">{{ child.rate }}</div>
        </a-col>
      </a-row>
    </div>

    <div v-if="numberSort.length !== 0">
      <div class="radius-top-2 text-white bg-black w-fit ms-5 p-2">
        {{ trlang.number_sort }}
      </div>
      <a-flex class="bg-black p-4" justify="center" gap="middle">
        <a-input
          v-for="index in numberSort.length"
          :key="index"
          class="text-center"
          style="width: 40px"
          v-model:value="numberSort[index - 1]"
        />
      </a-flex>
    </div>

    <div class="bg-black p-4 radius-2">
      <a-row :gutter="15">
        <a-col
          v-for="item in bettingAmountOptions"
          :key="item"
          :span="24 / bettingAmountOptions.length"
        >
          <button
            class="w-100 p-3 fs-3 font-bold text-dark-main cursor-pointer"
            @click="setBetAmount(item)"
          >
            {{ item }}
          </button>
        </a-col>
      </a-row>

      <a-row :gutter="15" class="pt-5">
        <!-- Reset -->
        <a-col :span="5">
          <button
            class="bg-pink text-white w-100 radius-1 cursor-pointer h-100 shadow-dark"
            @click="resetBettingAmount"
          >
            {{ trlang.amount_reset }}
          </button>
        </a-col>

        <!-- Percentage, Benefit, Betting Amount -->
        <a-col :span="14">
          <a-flex justify="space-between" class="gap-2">
            <div class="flex flex-1">
              <a-typography-text
                class="flex-1 bg-primary flex items-center justify-center text-white"
              >
                {{ trlang.percentage }}
              </a-typography-text>
              <a-typography-text
                class="border-primary p-3 flex items-center justify-center text-white"
              >
                {{ bettingRate }}
              </a-typography-text>
            </div>

            <div class="flex flex-1">
              <a-typography-text
                class="flex-1 bg-primary flex items-center justify-center text-white"
              >
                {{ trlang.benefit }}
              </a-typography-text>
              <a-typography-text
                class="border-primary p-3 flex items-center justify-center text-white"
              >
                {{ Math.floor(benefitAmount) }}
              </a-typography-text>
            </div>

            <a-input-number
              class="flex-1 fs-4 benefit-amount"
              v-model:value="bettingAmount"
            />
          </a-flex>

          <button
            class="w-100 bg-primary text-white radius-1 p-3 mt-5 cursor-pointer"
            @click="resetBetting"
          >
            {{ trlang.bet_reset }}
          </button>
        </a-col>

        <!-- Start Bet -->
        <a-col :span="5">
          <button
            class="bg-success text-white w-100 radius-1 cursor-pointer h-100 shadow-dark"
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
import { computed, inject, ref } from 'vue';
import { message } from 'ant-design-vue';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

// ✅ constants
const BET_AMOUNTS = [10000, 20000, 50000, 100000];

// ✅ props
const props = defineProps({
  bettingOptions: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  bettingRemainTime: { type: Number, default: 0 },
});

// ✅ states
const bettingAmountOptions = ref(BET_AMOUNTS);
const bettingAmount = ref(0);
const bettingType = ref('');
const bettingRate = ref(0);
const benefitAmount = computed(() => bettingAmount.value * bettingRate.value);
const numberSort = ref([]);

const emit = defineEmits(['startBetting']);

const setBettingOption = (item) => {
  bettingType.value = item.key;
  bettingRate.value = item.rate;
  const lengthMap = { number_13: 3, number_14: 4, number_16: 6 };
  numberSort.value = Array(lengthMap[item.key] || 0).fill(0);
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
  if (props.bettingRemainTime < 90) return;

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
</script>
