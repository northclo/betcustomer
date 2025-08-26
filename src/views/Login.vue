<template>
    <div class="justify-center h-100vh">
        <div>
            <a-space direction="vertical" size="middle" class="w-100 text-center">
                <div>
                    <a-typography-title :level="2" class="text-white">
                        {{ trlang.running_ball }}
                    </a-typography-title>
                    <a-typography-title :level="4" class="text-white mb-0">
                        {{ trlang.login_to_account }}
                    </a-typography-title>
                    <div>
                        <a-typography-text class="text-white fs-5">
                            {{ trlang.do_not_have_account }}
                        </a-typography-text>
                        <a href="/auth/register">
                            <button class="transparent-background border-0 text-main fs-5 cursor-pointer">
                                {{ trlang.register_now }}
                            </button>
                        </a>
                    </div>
                </div>
                <div class="text-start">
                    <a-typography-text class="text-white">{{ trlang.email }}</a-typography-text>
                    <a-input-password v-model:value="value3" :placeholder="trlang.input_email"
                        :visibility-toggle="false" />
                </div>
                <div class="text-start">
                    <a-typography-text class="text-white">{{ trlang.password }}</a-typography-text>
                    <a-input-password v-model:value="value" :placeholder="trlang.input_password" />
                </div>
                <button class="w-100 pt-2 pb-2 mt-5 radius-2 cursor-pointer">{{ trlang.login }}</button>
            </a-space>
        </div>
    </div>
</template>

<script>

export default {
    name: 'LoginPage',
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
}
</script>
