<template>
  <BannerCard
    :loading="loading"
    :today-no="todayNo"
    :total-no="totalNo"
    :own-money="ownMoney"
    :remain-time="remainTime"
    @update:remain-time="(val) => (remainTime = val)"
  />

  <div class="bg-primary-light radius-1 p-5 mt-5">
    <a-row :gutter="[15, 15]">
      <!-- Left side: 60% (14.4/24 ≈ 60%) -->
      <a-col :xs="24" :lg="14" class="flex flex-column gap-4">
        <BettingOption
          :betting-remain-time="remainTime"
          @start-betting="startBetting"
        />
      </a-col>
      <!-- Right side: 40% (9.6/24 ≈ 40%) -->
      <a-col :xs="24" :lg="10">
        <BettingProgress
          :previous-game-id="previousGameId"
          :next-game-id="nextGameId"
          :game-result="gameResult"
          :remain-time="remainTime"
          :game-id="gameId"
          :number-list="numberList"
          :today-no="todayNo"
          :total-no="totalNo"
          :betting-history="bettingHistory"
          :loading="loading"
          @cancel-betting="cancelBetting"
          @previous-game="previousGame"
          @next-game="nextGame"
        />
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import BannerCard from '@/components/Headers/BannerCard.vue';
import BettingOption from '@/components/Home/BettingOption.vue';
import BettingProgress from '@/components/Home/BettingProgress.vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link';
import { socket } from '@/plugins/socket.js';
import { message } from 'ant-design-vue';

// ✅ state
const gameId = ref('');
const gameResult = ref(null);
const numberList = ref([]);
const loading = ref(false);
const remainTime = ref(0);
const todayNo = ref(0);
const totalNo = ref(0);
const ownMoney = ref(0);
const bettingHistory = ref([]);
const previousGameId = ref(null);
const nextGameId = ref(null);

// ✅ methods
const fetchData = async (currentGameId) => {
  loading.value = true;
  const result = await getData(
    `${apiLink.get_betting_info}?gameId=${currentGameId}`
  );

  if (result.status) {
    const { game, pendingBet, user, aroundGameId } = result.data;
    previousGameId.value = aroundGameId.previousGameId;
    nextGameId.value = aroundGameId.nextGameId;
    gameId.value = game.id;
    gameResult.value = game;
    numberList.value = game.list;
    remainTime.value = game.remain_time;
    todayNo.value = game.today_no || 0;
    totalNo.value = game.total_no || 0;
    ownMoney.value = user.own_money || 0;

    // pending bets
    bettingHistory.value = pendingBet.map((el) => {
      return {
        id: el._id,
        bet_amount: el.bet_amount,
        type: el.betting_type,
        benefit: el.betting_rate,
        number_sort: el.number_sort,
        win: el.win || false,
        earning_amount: el.earning_amount || 0,
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
      win: false,
      earning_amount: 0,
    });

    ownMoney.value = ownMoney.value - bettingData.bettingAmount;
  }
};

const cancelBetting = async ({ id }) => {
  // Can only cancel during betting window: 3 mins (180s) to 1.5 mins (90s)
  if (remainTime.value < 90 || remainTime.value > 180) {
    message.error('Cannot cancel betting outside the betting window');
    return;
  }

  const result = await postData(apiLink.cancel_bet, { id: id });
  if (result.status) {
    bettingHistory.value = bettingHistory.value.filter(
      (item) => item.id !== id
    );

    ownMoney.value = ownMoney.value + result.data.bettingAmount;
  }
};

const previousGame = () => fetchData(previousGameId.value);
const nextGame = () => fetchData(nextGameId.value);

const handleStartGame = ({ game_id }) => {
  message.success(`Started new game: ${game_id}`);
  fetchData(game_id);
};

const handleEndGame = ({ game_id }) => {
  message.success(`Game ended: ${game_id}`);
  fetchData(game_id);
};

onMounted(() => {
  fetchData('');

  socket.on('start_game', handleStartGame);
  socket.on('end_game', handleEndGame);
});

onBeforeUnmount(() => {
  socket.off('start_game', handleStartGame);
  socket.off('end_game', handleEndGame);
});
</script>
