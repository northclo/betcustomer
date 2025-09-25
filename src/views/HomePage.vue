<template>
  <BannerCard
    :loading="loading"
    :today_no="todayNo"
    :total_no="totalNo"
    :own_money="ownMoney"
    :remain_time="remainTime"
    @update:remain_time="(val) => (remainTime = val)"
  />

  <div class="bg-primary-light radius-1 p-5 mt-5">
    <a-row :gutter="15">
      <a-col :span="15" class="flex flex-column gap-4">
        <BettingOption
          :bettingOptions="bettingOptions"
          :loading="loading"
          :bettingRemainTime="remainTime"
          @startBetting="startBetting"
        />
      </a-col>
      <a-col :span="9">
        <BettingProgress
          :todayNo="todayNo"
          :totalNo="totalNo"
          :bettingHistory="bettingHistory"
          :loading="loading"
          @cancelBetting="cancelBetting"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue';
import BannerCard from '@/components/Headers/BannerCard.vue';
import BettingOption from '@/components/Home/BettingOption.vue';
import BettingProgress from '@/components/Home/BettingProgress.vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link';
import { message } from 'ant-design-vue';
import { socket } from '@/plugins/socket.js';

// ✅ i18n
const langState = inject('langState');
const trlang = computed(() => langState?.translations || {});

// ✅ state
const bettingId = ref('');
const bettingOptions = ref([{ child: [] }]);
const loading = ref(false);
const remainTime = ref(0);
const todayNo = ref(0);
const totalNo = ref(0);
const ownMoney = ref(0);
const bettingHistory = ref([]);

// ✅ methods
const fetchData = async () => {
  loading.value = true;
  const result = await getData(apiLink.get_betting_info);

  if (result.status) {
    const { option: o, game, pendingBet, user } = result.data;
    bettingId.value = game.id;
    remainTime.value = game.remain_time;
    todayNo.value = game.today_no || 0;
    totalNo.value = game.total_no || 0;
    ownMoney.value = user.ownMoney || 0;

    // build betting options
    bettingOptions.value = [
      {
        key: 'normal',
        label: trlang.value.normal,
        child: [
          {
            key: 'odd',
            label: trlang.value.odd,
            rate: o.odd / 100,
            bgColor: 'success',
            radius: 'radius-left-2',
          },
          {
            key: 'even',
            label: trlang.value.even,
            rate: o.even / 100,
            bgColor: 'danger',
          },
          {
            key: 'under',
            label: trlang.value.under,
            rate: o.under / 100,
            bgColor: 'success',
          },
          {
            key: 'over',
            label: trlang.value.over,
            rate: o.over / 100,
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
            rate: o.odd_under / 100,
            bgColor: 'primary',
            radius: 'radius-left-2',
          },
          {
            key: 'odd_over',
            label: trlang.value.odd_over,
            rate: o.odd_over / 100,
            bgColor: 'pink',
          },
          {
            key: 'even_under',
            label: trlang.value.even_under,
            rate: o.even_under / 100,
            bgColor: 'primary',
          },
          {
            key: 'even_over',
            label: trlang.value.even_over,
            rate: o.even_over / 100,
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
            rate: o.match_number1 / 100,
            bgColor: 'danger',
            radius: 'radius-left-2',
          },
          {
            key: 'number_14',
            label: trlang.value.number_14,
            rate: o.match_number2 / 100,
            bgColor: 'success',
          },
          {
            key: 'number_16',
            label: trlang.value.number_16,
            rate: o.match_number3 / 100,
            bgColor: 'primary',
            radius: 'radius-right-2',
          },
        ],
      },
    ];

    // pending bets
    bettingHistory.value = pendingBet.map((el) => {
      return {
        id: el._id,
        bet_amount: el.bet_amount,
        type: el.betting_type,
        benefit: el.betting_rate,
        number_sort: el.number_sort,
        result: 0,
      };
    });
  }

  loading.value = false;
};

const startBetting = async (bettingData) => {
  const result = await postData(apiLink.start_bet, {
    game_id: bettingId.value,
    bettingAmount: bettingData.bettingAmount,
    bettingType: bettingData.bettingType,
    bettingRate: bettingData.bettingRate,
    numberSort: bettingData.numberSort,
  });

  if (result.status) {
    bettingHistory.value.unshift({
      id: result.data._id,
      bet_amount: result.data.bet_amount,
      type: result.data.betting_type,
      benefit: result.data.betting_rate,
      result: 0,
      number_sort: result.data.number_sort,
    });
  }
};

const cancelBetting = async ({ id }) => {
  const result = await postData(apiLink.cancel_bet, { id: id });
  if (result.status) {
    bettingHistory.value = bettingHistory.value.filter(
      (item) => item.id !== id
    );
  }
};

const getGameResult = async () => {
  const result = await getData(apiLink.get_game_result);

  if (result.status) {
    message.success('game is ended');
  }
};

onMounted(() => {
  fetchData();
  socket.on('end_game', () => {
    getGameResult();
  });
});
</script>
