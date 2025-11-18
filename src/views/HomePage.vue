<template>
  <div class="home-page-container">
    <div class="bg-primary-light radius-1 p-3 mt-2">
      <a-row :gutter="[15, 15]">
        <a-col :xs="24" :lg="14" class="flex flex-column gap-2">
          <BettingOption
          :betting-remain-time="remainTime"
          :game-activated="gameActivated"
          :inactive-message="inactiveMessage"
          @start-betting="startBetting"
        />
        </a-col>
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
    
    <div class="bg-primary-light radius-1 p-3 mt-2">
      <BettingHistorySection
        :betting-history="bettingHistory"
        :game-result="gameResult"
        :remain-time="remainTime"
        :loading="loading"
        @cancel-betting="cancelBetting"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref } from 'vue';
import BettingOption from '@/components/Home/BettingOption.vue';
import BettingProgress from '@/components/Home/BettingProgress.vue';
import BettingHistorySection from '@/components/Home/BettingHistorySection.vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link';
import { socket } from '@/plugins/socket.js';
import { message } from 'ant-design-vue';

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
const gameActivated = ref(true);
const inactiveMessage = ref('');

// ✅ methods
const fetchData = async (currentGameId) => {
  loading.value = true;
  const result = await getData(
    `${apiLink.get_betting_info}?gameId=${currentGameId}`
  );

  if (result.status) {
    const { game, pendingBet, user, aroundGameId, gameSetting } = result.data;
    previousGameId.value = aroundGameId?.previousGameId || null;
    nextGameId.value = aroundGameId?.nextGameId || null;
    gameId.value = game?.id || '';
    gameResult.value = game || null;
    numberList.value = game?.list || [];
    remainTime.value = game?.remain_time || 0;
    todayNo.value = game?.today_no || 0;
    totalNo.value = game?.total_no || 0;
    ownMoney.value = user?.own_money || 0;
    
    gameActivated.value = gameSetting?.activate !== false;
    inactiveMessage.value = gameSetting?.inactive_message || '';
    
    if (!gameActivated.value && inactiveMessage.value) {
      message.warning(inactiveMessage.value);
    }

    // pending bets
    bettingHistory.value = (pendingBet || []).map((el) => {
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
  const originalBalance = ownMoney.value;
  
  ownMoney.value = ownMoney.value - bettingData.bettingAmount;
  
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
    
    await fetchData(gameId.value);
  } else {
    ownMoney.value = originalBalance;
  }
};

const cancelBetting = async ({ id }) => {
  // Can only cancel during betting window: 3 mins (180s) to 1.5 mins (90s)
  if (remainTime.value < 90 || remainTime.value > 180) {
    message.error(getTranslation('cannot_cancel_betting_outside_window'));
    return;
  }

  const result = await postData(apiLink.cancel_bet, { id: id });
  if (result.status) {
    bettingHistory.value = bettingHistory.value.filter(
      (item) => item.id !== id
    );

    ownMoney.value = ownMoney.value + result.data.bettingAmount;
  } else {
    await fetchData(gameId.value);
  }
};

const previousGame = () => fetchData(previousGameId.value);
const nextGame = () => fetchData(nextGameId.value);

const handleStartGame = ({ game_id }) => {
  message.success(
    formatTranslation('started_new_game', { gameId: game_id })
  );
  fetchData(game_id);
};

const handleEndGame = ({ game_id }) => {
  message.success(
    formatTranslation('game_ended', { gameId: game_id })
  );
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

<style scoped>
.home-page-container {
  width: 100%;
}

/* Make columns equal height */
:deep(.ant-row) {
  display: flex;
  align-items: stretch;
}

:deep(.ant-col) {
  display: flex;
  flex-direction: column;
}

/* Ensure BettingOption and BettingProgress cards have same height */
:deep(.ant-col .bg-primary-light) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
