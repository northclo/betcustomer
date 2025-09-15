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
        </div>
        <div class="text-start">
          <a-typography-text class="text-white">
            {{ trlang.email }}
          </a-typography-text>
          <a-input v-model:value="email" :placeholder="trlang.input_email" />
        </div>
        <div class="text-start">
          <a-typography-text class="text-white">
            {{ trlang.password }}
          </a-typography-text>
          <a-input-password v-model:value="password" :placeholder="trlang.input_password" />
        </div>
        <button class="w-100 pt-2 pb-2 mt-5 radius-2 cursor-pointer" @click="login">
          {{ trlang.login }}
        </button>
      </a-space>
    </div>
  </div>
</template>

<script>
import { message } from 'ant-design-vue';

import { checkValidEmail } from '../helpers/commond/check-valid-email';
import { api } from '../helpers/Api';

export default {
  name: 'LoginPage',
  inject: ['langState'],
  data() {
    return {
      email: '',
      password: '',
    };
  },
  computed: {
    trlang() {
      return this.langState.translations;
    },
  },
  methods: {
    async login() {
      console.log('here is ');
      if (!this.email || !this.password) {
        message.error(this.trlang.fill_email_password);
        return;
      }

      if (!checkValidEmail(this.email)) {
        message.error(this.trlang.not_correct_email);
        return;
      }

      console.log('here is login action');

      try {
        let response = await api.login({
          email: this.email,
          password: this.password,
        });

        localStorage.setItem('token', response.data.token);

        this.$router.push('/');
      } catch (error) {
        message.error(error.response.data.message);
      }
    },
  },
};
</script>
