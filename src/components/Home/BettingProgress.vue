<template>
  <a-space direction="vertical" class="w-100">
    <a-card :title="trlang.game_results" class="game-result-card">
      <a-typography-text class="text-white fs-3">
        <span class="fs-1">{{ totalNo }}</span>
        {{ trlang.round }} ({{ todayNo }} {{ trlang.round }})
      </a-typography-text>

      <a-layout
        class="bg-none flex flex-row justify-between items-center px-5 mt-5 mb-5"
      >
        <LeftOutlined
          :class="selectedBettingId ? 'text-white cursor-pointer' : ''"
          @click="previousResult"
        />
        <a-typography-text v-if="!selectedBettingId" class="text-white fs-2">
          {{ trlang.betting_available }}
        </a-typography-text>
        <a-layout-content
          v-else
          class="flex-1 flex justify-center flex-wrap gap-2"
        >
          <template v-for="item in activeBetting?.bet" :key="item.key">
            <a-button :class="item.win ? 'active game-btn' : 'game-btn'">
              {{ trlang[item.type] }}
            </a-button>
          </template>
        </a-layout-content>
        <RightOutlined
          :class="
            selectedBettingId !== dataSource[0]?.id
              ? 'text-white cursor-pointer'
              : ''
          "
          @click="nextResult"
        />
      </a-layout>

      <a-layout
        class="flex flex-row justify-center gap-5 p-2 w-100 radius-bottom-1"
        style="background: #111316; border-top: 1px solid #000"
      >
        <a-typography-text class="text-white fs-3">
          <span class="text-warning me-2">{{ trlang.total_betting }}</span>
          {{ totalBettingAmount.toLocaleString() }}
        </a-typography-text>
        <a-typography-text class="text-white fs-3">
          <span class="text-warning me-2">{{ trlang.total_earning }}</span>
          {{ totalEarningAmount.toLocaleString() }}
        </a-typography-text>
      </a-layout>
    </a-card>

    <!-- Recent Bets -->
    <a-card :title="trlang.recent_betting_history" class="game-result-card">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        row-key="key"
        class="w-100 mt-2"
        :scroll="dataSource.length ? { x: 'max-content' } : undefined"
        :pagination="false"
        :rowClassName="
          (record) => (record.id === selectedBettingId ? 'active' : '')
        "
        :customRow="customRow"
      >
        <template #emptyText>
          <a-spin v-if="loading" />
          <span v-else>{{ trlang.no_data }}</span>
        </template>

        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'id'">
            {{ dataSource.length - index }}
          </template>
          <template v-else-if="column.key === 'bet_amount'">
            {{ record.bet_amount.toLocaleString() }}
          </template>
          <template v-else-if="column.key === 'bet_info'">
            {{ trlang[record.type] }}
            <span class="ms-5">{{ record.benefit }}</span>
          </template>
          <template v-else-if="column.key === 'result'">
            <a-button
              class="w-100"
              @click="emit('cancelBetting', { id: record.id })"
            >
              Cancel
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </a-space>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

// ✅ constants
const DEFAULT_COLUMNS = (t) => [
  { key: 'id', title: 'ID', dataIndex: 'id' },
  { key: 'bet_amount', title: t.bet_amount, dataIndex: 'bet_amount' },
  { key: 'bet_info', title: t.bet_info, dataIndex: 'bet_info' },
  { key: 'result', title: t.result, dataIndex: 'result' },
];

const emit = defineEmits(['cancelBetting']);

// ✅ props
const props = defineProps({
  todayNo: { type: Number, default: 0 },
  totalNo: { type: Number, default: 0 },
  loading: { type: Boolean, default: true },
  bettingHistory: { type: Array },
});

// ✅ state
const totalBettingAmount = computed(() =>
  dataSource.value.reduce((sum, el) => sum + el.bet_amount, 0)
);
const totalEarningAmount = ref(0);
const columns = ref(DEFAULT_COLUMNS(trlang.value));
const dataSource = computed(() => props.bettingHistory || []);
const selectedBettingId = ref(null);
const activeBetting = ref({});

const navigateResult = (direction) => {
  const _selectedBettingId = selectedBettingId.value;
  const index = dataSource.value.findIndex(
    (el) => el.id === _selectedBettingId
  );

  if (index !== -1) {
    const newIndex = index + direction;

    if (direction === +1 && newIndex >= dataSource.value.length) {
      selectedBettingId.value = null;
      activeBetting.value = {};
      return;
    }

    const nextRecord = dataSource.value[newIndex];
    if (nextRecord) {
      selectedBettingId.value = nextRecord.id;
      buildActiveBetting(nextRecord);
    }
  } else if (direction < 0) {
    const lastRecord = dataSource.value.at(-1);
    if (lastRecord) {
      selectedBettingId.value = lastRecord.id;
      buildActiveBetting(lastRecord);
    }
  }
};

const previousResult = () => navigateResult(+1);
const nextResult = () => navigateResult(-1);

const customRow = (record) => {
  return {
    onClick: () => {
      if (selectedBettingId.value === record.id) {
        selectedBettingId.value = null;
        activeBetting.value = {};
      } else {
        selectedBettingId.value = record.id;
        buildActiveBetting(record);
      }
    },
  };
};

const buildActiveBetting = (record) => {
  const specialTypes = ['number_13', 'number_14', 'number_16'];
  console.log(record.type);

  if (specialTypes.includes(record.type)) {
    activeBetting.value = {
      bet: [{ type: record.type, win: false }],
      numberSort: record.number_sort,
    };
  } else {
    activeBetting.value = {
      bet: record.type.split('_').map((t) => ({ type: t, win: false })),
      numberSort: [],
    };
  }
};
</script>
