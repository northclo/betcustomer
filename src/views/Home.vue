<template>
  <div class="home-container">
    <a-row :gutter="15">
        <a-col :span="16" class="bet-percentage-info">
            <div class="percentage-info-container">
                <div class="card-title">
                    {{ trlang.normal_bet }}
                </div>
                <a-row :gutter="8">
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-odd">
                        <div class="bet-btn-title">{{ trlang.odd }}</div>
                        <div class="bet-percentage">1.95</div>
                      </a>
                    </a-col>
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-even">
                        <div class="bet-btn-title">{{ trlang.even }}</div>
                        <div class="bet-percentage">1.95</div>
                      </a>
                    </a-col>
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-under">
                        <div class="bet-btn-title">{{ trlang.under }}</div>
                        <div class="bet-percentage">1.95</div>
                      </a>
                    </a-col>
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-over">
                        <div class="bet-btn-title">{{ trlang.over }}</div>
                        <div class="bet-percentage">1.95</div>
                      </a>
                    </a-col>
                </a-row>
            </div>
            <div class="percentage-info-container combined-bet">
                <div class="card-title">
                    {{ trlang.combine_bet }}
                </div>
                <a-row :gutter="8">
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-odd main-background">
                        <div class="bet-btn-title">{{ trlang.odd_under }}</div>
                        <div class="bet-percentage">2.45</div>
                      </a>
                    </a-col>
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-even pink-background">
                        <div class="bet-btn-title">{{ trlang.odd_over }}</div>
                        <div class="bet-percentage">2.45</div>
                      </a>
                    </a-col>
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-under main-background">
                        <div class="bet-btn-title">{{ trlang.even_under }}</div>
                        <div class="bet-percentage">2.45</div>
                      </a>
                    </a-col>
                    <a-col :span="6" class="bet-btn">
                      <a class="bet-type-over pink-background">
                        <div class="bet-btn-title">{{ trlang.even_over }}</div>
                        <div class="bet-percentage">2.45</div>
                      </a>
                    </a-col>
                </a-row>
            </div>
            <div class="percentage-info-container number-match-bet">
                <div class="card-title">
                    {{ trlang.number_match }}
                </div>
                <a-row :gutter="8">
                    <a-col :span="8" class="bet-btn">
                      <a class="bet-num-13 red-background">
                        <div class="bet-btn-title">{{ trlang.number_13 }}</div>
                        <div class="bet-percentage">9.5</div>
                      </a>
                    </a-col>
                    <a-col :span="8" class="bet-btn">
                      <a class="bet-num-14 yellow-background">
                        <div class="bet-btn-title">{{ trlang.number_14 }}</div>
                        <div class="bet-percentage">19.5</div>
                      </a>
                    </a-col>
                    <a-col :span="8" class="bet-btn">
                      <a class="bet-num-16 main-background">
                        <div class="bet-btn-title">{{ trlang.number_16 }}</div>
                        <div class="bet-percentage">999</div>
                      </a>
                    </a-col>
                </a-row>
            </div>
            <div class="percentage-info-container">
                <a-row :gutter="15">
                    <a-col :span="6">
                      <button class="bet-amount-btn">
                        {{ trlang.amount_1 }}
                      </button>
                    </a-col>
                    <a-col :span="6">
                      <button class="bet-amount-btn">
                        {{ trlang.amount_2 }}
                      </button>
                    </a-col>
                    <a-col :span="6">
                      <button class="bet-amount-btn">
                        {{ trlang.amount_5 }}
                      </button>
                    </a-col>
                    <a-col :span="6">
                      <button class="bet-amount-btn">
                        {{ trlang.amount_10 }}
                      </button>
                    </a-col>
                </a-row>
                <a-row :gutter="15" class="bet-action-container">
                    <a-col :span="5">
                      <button class="bet-action-btn reset-bet-amount">
                        {{ trlang.bet_amount_reset }}
                      </button>
                    </a-col>
                    <a-col :span="14">
                      <a-flex justify="space-between">
                        <div class="bet-choosed-option">

                        </div>
                        <div class="bet-percentage-val">
                            <div class="value-title">{{ trlang.bet_percentage }}</div>
                            <div class="value-info">0.0</div>
                        </div>
                        <div class="bet-percentage-val">
                            <div class="value-title">{{ trlang.benefit_amount }}</div>
                            <div class="value-info">0</div>
                        </div>
                        <a-input-number
                          :formatter="value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                          :parser="value => value.replace(/\$\s?|(,*)/g, '')"
                          class="benefit-amount"
                          id="benefit-amount"
                        />
                      </a-flex>
                      <button class="bet-reset-action">
                          {{ trlang.bet_reset }}
                      </button>
                    </a-col>
                    <a-col :span="5">
                      <button class="bet-action-btn start-betting">
                        {{ trlang.start_betting }}
                      </button>
                    </a-col>
                </a-row>
            </div>
        </a-col>
        <a-col :span="8" class="game-progress">
          col-12
        </a-col>
    </a-row>
  </div>
</template>

<script>

import moment from 'moment';

export default {
  name: 'HomePage',
  inject: ['langState'],
  data() {
    return {
        benefitAmount: 1000
    };
  },
  computed: {
    trlang() {
      return this.langState.translations
    }
	},
  mounted(){
    this.initDate();
  },
  methods: {
      moment,
      initDate:async function(){
        this.selectedStartDate = new Date();
      }
  },
}
</script>

<style>
  .home-container {
    background: rgba(187, 222, 251, 0.3);
    border-radius: 5px;
    padding: 20px 16px;
  }
  .percentage-info-container {
    padding: 15px;
    border-radius: 8px;
    background: var(--black-background);
    position: relative;
    margin-top: 30px;
  }

  .bet-btn a {
    display: flex;
    padding: 12px;
    align-items: center;
    justify-content: space-between;
    background: var(--green-color);
    color: white
  }

  .bet-btn a.bet-type-even {
    background: var(--red-color);
  }

  .bet-btn a.bet-type-odd,
  .bet-num-13 {
    border-radius: 8px 0px 0px 8px;
  }

  .bet-btn a.bet-type-over,
  .bet-num-16 {
    border-radius: 0px 8px 8px 0px;
    background: var(--red-color);
  }
  .bet-btn-title {
    font-weight: 600;
    font-size: 20px;
  }
  .bet-percentage {
    font-size: 16px;
  }
  .combined-bet {
    margin-top: 50px;

  }
  .card-title {
    background-color: var(--black-background);
    position: absolute;
    padding: 5px 10px 5px 10px;
    top: -30px;
    left: 15px;
    color: white;
    border-radius: 5px 5px 0px 0px;
  }
  .number-match-bet {
    margin-top: 50px;
  }
  button.bet-amount-btn {
    width: 100%;
    padding: 10px;
    color: var(--main-dark-color);
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
  }
  .bet-action-container {
    padding-top: 16px;
  }
  .benefit-amount {
    padding: 3px;
    width: 120px;
    border-radius: 1px;
  }

  .benefit-amount input {
    font-size: 16px !important;
    font-weight: 600;
    height: 35px !important;
  }
  .bet-percentage-val {
    display: flex;
    align-items: center;
    color: white;
  }

  .value-title {
    padding: 10px;
    background: var(--main-color);
    border: 1px solid var(--main-color);
  }

  .value-info {
    border: 1px solid var(--main-color);
    padding: 10px;
  }

  .bet-action-btn{
    width: 100%;
    height: 100%;
    cursor: pointer;
    font-size: 16px;
    color: white;
    border: none;
    border-radius: 5px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  }
  .bet-reset-action{
    width: 100%;
    height: 50px;
    margin-top: 12px;
    cursor: pointer;
    border: none;
    background: var(--main-color);
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    border-radius: 5px;
    color: white;
    font-size: 16px;
  }
  .reset-bet-amount {
    background: var(--pink-color);
  }
  .start-betting {
    background: var(--green-color);
  }

  .bet-choosed-option{
    width: 60px;
    text-align: center;
  }
</style>

