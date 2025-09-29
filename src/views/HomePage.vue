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
          :bettingRemainTime="remainTime"
          @startBetting="startBetting"
        />
      </a-col>
      <a-col :span="9">
        <BettingProgress
          :gameId="gameId"
          :todayNo="todayNo"
          :totalNo="totalNo"
          :bettingHistory="bettingHistory"
          :loading="loading"
          @cancelBetting="cancelBetting"
          @previousGame="previousGame"
          @nextGame="nextGame"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import BannerCard from '@/components/Headers/BannerCard.vue';
import BettingOption from '@/components/Home/BettingOption.vue';
import BettingProgress from '@/components/Home/BettingProgress.vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link';
import { message } from 'ant-design-vue';
import { socket } from '@/plugins/socket.js';

// ✅ state
const gameId = ref('');
const loading = ref(false);
const remainTime = ref(0);
const todayNo = ref(0);
const totalNo = ref(0);
const ownMoney = ref(0);
const bettingHistory = ref([]);

// ✅ methods
const fetchData = async (currentGameId, nextGame) => {
  loading.value = true;
  const result = await getData(
    `${apiLink.get_betting_info}?gameId=${currentGameId || ''}&nextGame=${
      nextGame || ''
    }`
  );

  if (result.status) {
    const { game, pendingBet, user } = result.data;
    gameId.value = game.id;
    remainTime.value = game.remain_time;
    todayNo.value = game.today_no || 0;
    totalNo.value = game.total_no || 0;
    ownMoney.value = user.ownMoney || 0;

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
    game_id: gameId.value,
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

const previousGame = () => fetchData(gameId.value, -1);
const nextGame = () => fetchData(gameId.value, 1);

onMounted(() => {
  fetchData();
  socket.on('end_game', () => {
    getGameResult();
  });
});
</script>
