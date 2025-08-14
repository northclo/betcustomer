<template>
	<div class="bannercard-wrapper">
        <a-flex class="game-info" justify="space-between">
            <a-flex class="current-game-index game-info-col">
                <div class="sp-icon">
                    {{ trlang.game_index }}
                </div>
                <a-flex class="game-index-number" align="flex-end">
                    <div class="game-index-num">
                        1508830 {{ trlang.index_unit }}
                    </div>
                    <div class="game-index-day">
                        ({{ trlang.per_day }} 279 {{ trlang.index_unit }})
                    </div>
                </a-flex>
            </a-flex>
            <a-flex class="time-intro game-info-col">
                <div class="sp-icon">
                    {{ trlang.time_intro }}
                </div>
                <a-flex class="current-time" align="flex-end">
                    {{ formattedTime }} <span class="time-counter">{{ counterText }}</span>
                </a-flex>
            </a-flex>
            <a-flex class="fund-store-amount game-info-col">
                <div class="sp-icon">
                    {{ trlang.store_amount }}
                </div>
                <a-flex class="store-amount-val" align="flex-end">
                    879,450 {{ trlang.currency }}
                </a-flex>
            </a-flex>
            <a-flex class="store-name game-info-col">
                <a class="store-name-link" :href="trlang.store_name_link" target="_blank">
                    <div class="store-icon">
                        <img src="../../assets/images/sp.png" />
                    </div>
                    <div class="store-name-title">
                        {{ trlang.store_name }}
                    </div>
                </a>
            </a-flex>
            <div class="partner-dashboard game-info-col">
                <div class="partner-info">
                    Test
                </div>
                <button class="goto-partner-dash">
                    {{ trlang.partner_dashboard }}
                </button>
            </div>
            <a-flex class="noted-messages game-info-col" align="center">
                <div class="msg-icon">
                    <img src="../../assets/images/msg-icon.png" />
                </div>
                <div class="msg-number">
                    0
                </div>
            </a-flex>
        </a-flex>
	</div>
</template>

<script>

export default ({
        name: 'BannerCard',
		inject: ['langState'],
        data() {
            return {
                formattedTime: '',
                clockInterval: null,
                counterText: '',
                counterInterval: null
            };
        },
		props: {
		},
        computed: {
			trlang() {
				return this.langState.translations
			}
		},
		methods: {
            updateTokyoTime() {
                this.formattedTime = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Asia/Tokyo',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).format(new Date());
            },
            updateCounter() {
                const now = new Date();
                const secondsSince5min = (now.getMinutes() % 5) * 60 + now.getSeconds();
                const remainingSeconds = (5 * 60) - secondsSince5min;

                const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
                const seconds = String(remainingSeconds % 60).padStart(2, '0');
                this.counterText = `${minutes}:${seconds}`;
            }
		},
		mounted: function(){
            this.updateTokyoTime();
            this.updateCounter();
            this.clockInterval = setInterval(() => {
                this.updateTokyoTime();
                this.updateCounter();
            }, 1000);

		},
		beforeUnmount() {
            clearInterval(this.clockInterval);
		},
	})
</script>