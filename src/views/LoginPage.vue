<template>
  <a-layout class="flex justify-center items-center h-100vh bg-none">
    <a-space
      direction="vertical"
      size="middle"
      class="w-100"
      style="max-width: 300px"
    >
      <div>
        <a-typography-title :level="2" class="text-white text-center">
          {{ trlang.running_ball }}
        </a-typography-title>
        <a-typography-title :level="5" class="text-white text-center m-auto">
          {{ trlang.login_to_your_account }}
        </a-typography-title>
      </div>

      <div>
        <a-typography-text class="text-white">
          {{ trlang.email }}
        </a-typography-text>
        <a-input v-model:value="email" :placeholder="trlang.input_email" />
      </div>

      <div>
        <a-typography-text class="text-white">
          {{ trlang.password }}
        </a-typography-text>
        <a-input-password
          v-model:value="password"
          :placeholder="trlang.input_password"
        />
      </div>

      <div v-if="captchaShow">
        <!-- eslint-disable vue/html-self-closing, vue/no-v-html -->
        <div
          class="text-center mb-4"
          @click="loadCaptcha"
          v-html="captcha"
          style="cursor: pointer;"
        ></div>
        <!-- eslint-enable vue/html-self-closing, vue/no-v-html -->
        <a-input
          v-model:value="captchaInput"
          :placeholder="trlang.enter_captcha"
          required
        />
      </div>

      <div v-if="retry" class="flex flex-column">
        <a-typography-text class="text-danger">
          {{ trlang.your_login_attempt_has_failed_3_times_or_more }}
        </a-typography-text>
        <a-typography-text class="text-danger">
          {{ trlang.please_try_again_later }}:
          {{
            Math.floor(retryRemainedTime / 60)
              ? Math.floor(retryRemainedTime / 60) + trlang.min
              : ''
          }}
          {{
            retryRemainedTime % 60 ? (retryRemainedTime % 60) + trlang.sec : ''
          }}
        </a-typography-text>
      </div>

      <a-row class="w-100" justify="space-between" align="middle">
        <a-checkbox v-model:checked="remember" class="text-white">
          {{ trlang.remember_me }}
        </a-checkbox>
      </a-row>

      <a-button class="w-100 bg-primary text-white" @click="login">
        {{ trlang.login }}
      </a-button>

      <div v-if="isRegistrationEnabled" class="text-center">
        <a-typography-text class="text-white">
          {{ trlang.dont_have_account }} 
          <a @click="goToRegister" class="text-primary" style="cursor: pointer;">
            {{ trlang.sign_up }}
          </a>
        </a-typography-text>
      </div>
    </a-space>
  </a-layout>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getData, postData } from '@/helpers/Axios';
import { apiLink } from '@/utils/api-link';
import { checkValidEmail } from '@/helpers/Common.js';

/* Router */
const router = useRouter();

const langState = inject('langState');
const membershipSettings = inject('membershipSettings', ref(null));
const trlang = computed(() => langState?.translations || {});

const isRegistrationEnabled = computed(() => {
  if (!membershipSettings?.value) return false;
  return membershipSettings.value.membership_registration !== 'no_use';
});

/* Reactive states */
const email = ref('');
const password = ref('');
const remember = ref(false);
const captchaShow = ref(false);
const captcha = ref('');
const captchaText = ref('');
const captchaInput = ref('');
const retry = ref(false);
const retryRemainedTime = ref(0);
const securityEnabled = ref(true);

let retryTimer = null;

/* Helpers */
const getCaptcha = async () => {
  const result = await getData(apiLink.get_captcha);
  if (result.status) {
    captchaText.value = result.data.text;
    captcha.value = result.data.data;
    captchaShow.value = true;
  }
};

const loadCaptcha = async () => {
  await getCaptcha();
};

const fetchSecuritySetting = async () => {
  try {
    const result = await getData(apiLink.get_site_setting);
    if (result.status && result.data) {
      securityEnabled.value = result.data.security ?? true;
      
      if (securityEnabled.value) {
        await getCaptcha();
      }
    }
  } catch (error) {
    console.error('Error fetching security setting:', error);
    securityEnabled.value = true;
    await getCaptcha();
  }
};

const handleLoginFailed = () => {
  const failed = Number(localStorage.getItem('login_failed')) || 0;
  localStorage.setItem('login_failed', failed + 1);
  localStorage.setItem('last_login_failed_time', Date.now());

  if (failed >= 2 && !retry.value) {
    retry.value = true;
    retryRemainedTime.value = 120;
  }

  getCaptcha();
};

const initRetryState = () => {
  const lastFailed =
    Number(localStorage.getItem('last_login_failed_time')) || 0;
  const loginFailed = Number(localStorage.getItem('login_failed')) || 0;
  const diff = (Date.now() - lastFailed) / 1000;

  if (diff < 120 && loginFailed > 2) {
    retry.value = true;
    retryRemainedTime.value = Math.floor(120 - diff);
  }

  retryTimer = setInterval(() => {
    if (retry.value && retryRemainedTime.value > 0) {
      retryRemainedTime.value -= 1;
    } else {
      retry.value = false;
    }
  }, 1000);
};

const saveCredentials = () => {
  if (remember.value) {
    localStorage.setItem('email', email.value);
    localStorage.setItem('password', password.value);
  } else {
    localStorage.removeItem('email');
    localStorage.removeItem('password');
  }
};

/* Load saved data on mount */
onMounted(async () => {
  const savedEmail = localStorage.getItem('email');
  const savedPassword = localStorage.getItem('password');

  if (savedEmail && savedPassword) {
    email.value = savedEmail;
    password.value = savedPassword;
    remember.value = true;
  }

  initRetryState();
  
  await fetchSecuritySetting();
});

onUnmounted(() => {
  if (retryTimer) clearInterval(retryTimer);
});

const goToRegister = () => {
  router.push('/auth/register');
};

/* Login method */
const login = async () => {
  if (retry.value) return;

  if (!email.value || !password.value) {
    return message.error(trlang.value.fill_email_password);
  }
  if (!checkValidEmail(email.value)) {
    return message.error(trlang.value.not_correct_email);
  }
  if (captchaShow.value) {
    if (!captchaInput.value || captchaText.value !== captchaInput.value) {
      handleLoginFailed();
      return message.error(trlang.value.captcha_is_wrong);
    }
  }

  const res = await postData(apiLink.login, {
    email: email.value.toLowerCase(),
    password: password.value,
  });

  if (res.status) {
    localStorage.setItem('token', res.data.token);
    saveCredentials();
    localStorage.removeItem('login_failed');
    router.push('/');
  } else {
    handleLoginFailed();
  }
};
</script>
