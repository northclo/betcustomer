<template>
  <div class="home-page-container">
    <div class="bg-primary-light radius-1 p-3 mt-2">
      <a-row :gutter="[15, 15]">
        <a-col :xs="24" :lg="14" class="flex flex-column gap-2">
          <BettingOption
          :betting-remain-time="remainTime"
          :game-activated="gameActivated"
          :inactive-message="inactiveMessage"
          :loading="startBettingLoading"
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
            :cancel-loading="cancelLoading"
            @cancel-betting="cancelBetting"
            @previous-game="previousGame"
            @next-game="nextGame"
          />
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import BettingOption from '@/components/Home/BettingOption.vue';
import BettingProgress from '@/components/Home/BettingProgress.vue';
import { getData, postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link';
import { socket } from '@/plugins/socket.js';
import { message } from 'ant-design-vue';
import { getCurrentTime } from '@/helpers/Common.js';

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

const gameId = ref('');
const gameResult = ref(null);
const numberList = ref([]);
const loading = ref(false);
const remainTime = ref(0);
const targetTimestamp = ref(0);
const todayNo = ref(0);
const totalNo = ref(0);
const ownMoney = ref(0);
const bettingHistory = ref([]);
const previousGameId = ref(null);
const nextGameId = ref(null);
const gameActivated = ref(true);
const inactiveMessage = ref('');
const cancelLoading = ref(false);
const startBettingLoading = ref(false);
let remainTimeInterval = null;

const fetchData = async (currentGameId) => {
  loading.value = true;
  try {
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
      targetTimestamp.value = game?.target_timestamp || 0;
      todayNo.value = game?.today_no || 0;
      totalNo.value = game?.total_no || 0;
      ownMoney.value = user?.own_money || 0;
      
      updateRemainTime();
      
      gameActivated.value = gameSetting?.activate !== false;
      inactiveMessage.value = gameSetting?.inactive_message || '';
      
      if (!gameActivated.value && inactiveMessage.value) {
        message.warning(inactiveMessage.value);
      }

      bettingHistory.value = (pendingBet || []).map((el) => {
        return {
          id: el._id,
          bet_amount: el.bet_amount,
          type: el.betting_type,
          benefit: el.betting_rate,
          betting_rate: el.betting_rate,
          number_sort: el.number_sort,
          win: el.win || false,
          earning_amount: el.earning_amount || 0,
          betting_status: el.betting_status || 'wait',
          createdAt: el.createdAt || new Date(),
          result: 0,
        };
      });
    }
  } catch (error) {
    console.error('Error fetching game data:', error);
    message.error(error.message || getTranslation('failed_to_fetch_data'));
  } finally {
    loading.value = false;
  }
};

const startBetting = async (bettingData) => {
  const originalBalance = ownMoney.value;
  startBettingLoading.value = true;
  
  try {
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
        betting_rate: result.data.betting_rate,
        result: 0,
        number_sort: result.data.number_sort,
        win: false,
        earning_amount: 0,
        createdAt: new Date(),
      });
      
      await fetchData(gameId.value);
      message.success(getTranslation('bet_placed_successfully'));
    } else {
      ownMoney.value = originalBalance;
    }
  } catch (error) {
    console.error('Error placing bet:', error);
    ownMoney.value = originalBalance;
    message.error(error.message || getTranslation('operation_failed'));
  } finally {
    startBettingLoading.value = false;
  }
};

const cancelBetting = async ({ id }) => {
  if (remainTime.value < 90 || remainTime.value > 180) {
    message.error(getTranslation('cannot_cancel_betting_outside_window'));
    return;
  }

  cancelLoading.value = true;
  try {
    const result = await postData(apiLink.cancel_bet, { id: id });
    if (result.status) {
      bettingHistory.value = bettingHistory.value.filter(
        (item) => item.id !== id
      );

      ownMoney.value = ownMoney.value + result.data.bettingAmount;
      message.success(getTranslation('bet_cancelled_successfully'));
    } else {
      await fetchData(gameId.value);
    }
  } catch (error) {
    console.error('Error cancelling bet:', error);
    message.error(error.message || getTranslation('operation_failed'));
    await fetchData(gameId.value);
  } finally {
    cancelLoading.value = false;
  }
};

const previousGame = () => fetchData(previousGameId.value);
const nextGame = () => fetchData(nextGameId.value);

const updateRemainTime = () => {
  if (!targetTimestamp.value || targetTimestamp.value <= 0) {
    remainTime.value = 0;
    return;
  }
  
  const currentTime = getCurrentTime();
  console.log('currentTime', currentTime)
  console.log('currentTime date', new Date(currentTime))
  console.log('targetTimestamp date', new Date(targetTimestamp.value))
  console.log('targetTimestamp', targetTimestamp.value)
  const remaining = Math.floor((targetTimestamp.value - currentTime) / 1000);
  remainTime.value = Math.max(0, remaining);
};

const startRemainTimeInterval = () => {
  stopRemainTimeInterval();
  updateRemainTime();
  remainTimeInterval = setInterval(() => {
    updateRemainTime();
  }, 1000);
};

const stopRemainTimeInterval = () => {
  if (remainTimeInterval) {
    clearInterval(remainTimeInterval);
    remainTimeInterval = null;
  }
};

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

watch(
  () => targetTimestamp.value,
  () => {
    startRemainTimeInterval();
  }
);

onMounted(() => {
  fetchData('');
  startRemainTimeInterval();

  socket.on('start_game', handleStartGame);
  socket.on('end_game', handleEndGame);
});

onBeforeUnmount(() => {
  stopRemainTimeInterval();
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
