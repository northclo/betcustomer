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
        <div>
          <LeftOutlined
            v-if="previousGameId"
            class="text-white cursor-pointer"
            @click="emit('previousGame')"
          />
        </div>
        <a-typography-text v-if="!game?.list.length" class="text-white fs-2">
          {{
            remainTime > 0 && remainTime < 180
              ? trlang.betting_available
              : trlang.no_available_betting
          }}
        </a-typography-text>
        <div v-else>
          <a-layout-content class="flex-1 flex justify-center flex-wrap gap-2">
            <a-button :class="game?.odd ? 'active game-btn' : 'game-btn'">
              {{ trlang.odd }}
            </a-button>
            <a-button :class="game?.under ? 'active game-btn' : 'game-btn'">
              {{ trlang.under }}
            </a-button>
          </a-layout-content>
        </div>
        <div>
          <RightOutlined
            v-if="nextGameId"
            class="text-white cursor-pointer"
            @click="emit('nextGame')"
          />
        </div>
      </a-layout>
      <a-flex justify="center">
        <div class="mt-5 flex gap-5">
          <a-button
            v-for="item in game?.list"
            :key="item"
            :class="'running-ball running-ball' + item"
          >
            {{ item }}
          </a-button>
        </div>
      </a-flex>

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
            <a-tooltip :title="String(record.number_sort)" color="#0086e3">
              {{ trlang[record.type] }}
              <span class="ms-5">{{ record.benefit }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.key === 'result'">
            <a-typography-text
              v-if="game?.list?.length !== 0"
              class="text-white"
            >
              {{ record?.earning_amount }}
            </a-typography-text>
            <a-button
              v-else
              class="w-100"
              @click="emit('cancelBetting', { id: record.id })"
            >
              {{ trlang.cancel }}
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

const emit = defineEmits(['cancelBetting', 'previousGame', 'nextGame']);

// ✅ props
const props = defineProps({
  previousGameId: { type: String },
  nextGameId: { type: String },
  gameResult: { type: Object },
  remainTime: { type: Number, default: 0 },
  gameId: { type: String },
  numberList: { type: Array },
  todayNo: { type: Number, default: 0 },
  totalNo: { type: Number, default: 0 },
  loading: { type: Boolean, default: true },
  bettingHistory: { type: Array },
});

// ✅ state
const totalBettingAmount = computed(() =>
  dataSource.value.reduce((sum, el) => sum + el.bet_amount, 0)
);
const totalEarningAmount = computed(() =>
  dataSource.value.reduce((sum, el) => sum + el?.earning_amount, 0)
);
const columns = ref(DEFAULT_COLUMNS(trlang.value));
const dataSource = computed(() => props.bettingHistory || []);
const game = computed(() => props.gameResult);
</script>
