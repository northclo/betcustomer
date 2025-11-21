<template>
  <a-layout class="flex justify-center items-center h-100vh bg-none">
    <a-space
      direction="vertical"
      size="middle"
      class="w-100"
      style="max-width: 500px"
    >
      <div>
        <a-typography-title :level="2" class="text-white text-center">
          {{ trlang.running_ball }}
        </a-typography-title>
        <a-typography-title :level="5" class="text-white text-center m-auto">
          {{ trlang.create_account }}
        </a-typography-title>
      </div>

      <a-alert
        v-if="membershipSignupMessage"
        :message="membershipSignupMessage"
        type="info"
        show-icon
        class="mb-2"
      />

      <a-alert
        v-if="membershipApproval"
        :message="trlang.registration_pending_approval"
        type="warning"
        show-icon
        class="mb-2"
      />

      <a-alert
        v-if="!isRegistrationEnabled"
        :message="trlang.membership_registration_disabled"
        type="error"
        show-icon
        class="mb-2"
      />

      <div v-if="isRegistrationEnabled" class="register-form">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.email }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input v-model:value="email" :placeholder="trlang.input_email" />
            </div>
          </a-col>

          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.nickname }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input v-model:value="nickname" :placeholder="trlang.input_nickname" />
            </div>
          </a-col>

          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.password }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input-password
                v-model:value="password"
                :placeholder="trlang.input_password"
              />
            </div>
          </a-col>

          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.confirm_password }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input-password
                v-model:value="confirmPassword"
                :placeholder="trlang.confirm_password_placeholder"
              />
            </div>
          </a-col>

          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.real_name }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input v-model:value="realName" :placeholder="trlang.input_real_name" />
            </div>
          </a-col>

          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.bank_id }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-select
                v-model:value="bankId"
                :placeholder="trlang.select_bank"
                :options="bankOptions"
                class="w-100 glass-select bank-select"
                dropdown-class-name="glass-select-dropdown"
              >
                <template #suffixIcon>
                  <span class="glass-select__icon">▾</span>
                </template>
              </a-select>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.bank_number }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input v-model:value="bankNumber" :placeholder="trlang.input_bank_number" />
            </div>
          </a-col>

          <a-col :xs="24" :sm="12">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.bank_owner_name }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input v-model:value="bankOwnerName" :placeholder="trlang.input_bank_owner_name" />
            </div>
          </a-col>

          <a-col v-if="requiresRecommender" :xs="24">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.recommender_code }}
                <span class="text-danger">*</span>
              </a-typography-text>
              <a-input
                v-model:value="recommenderCode"
                :placeholder="trlang.input_recommender_code"
              />
            </div>
          </a-col>

          <a-col v-if="canSelectReferrer && !requiresRecommender" :xs="24">
            <div class="form-field">
              <a-typography-text class="text-white">
                {{ trlang.recommender_code }}
                <span class="text-muted">({{ trlang.optional }})</span>
              </a-typography-text>
              <a-input
                v-model:value="recommenderCode"
                :placeholder="trlang.input_recommender_code"
              />
            </div>
          </a-col>
        </a-row>

        <div v-if="captchaShow" class="mt-4">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="text-center mb-4" style="cursor: pointer;" @click="loadCaptcha" v-html="captcha" />
          <a-input
            v-model:value="captchaInput"
            :placeholder="trlang.enter_captcha"
            required
          />
        </div>

        <div class="mt-4">
          <div class="mb-4">
            <a-checkbox v-model:checked="acceptedTerms" class="text-white">
              {{ trlang.accept_terms_and_conditions }}
              <span class="text-danger">*</span>
            </a-checkbox>
          </div>

          <a-button
            class="w-100 bg-primary text-white"
            :loading="registering"
            :disabled="!acceptedTerms"
            @click="register"
          >
            {{ trlang.register }}
          </a-button>
        </div>
      </div>

      <div class="text-center">
        <a-typography-text class="text-white">
          {{ trlang.already_have_account }}
          <a class="text-primary" style="cursor: pointer;" @click="goToLogin">
            {{ trlang.login }}
          </a>
        </a-typography-text>
      </div>
    </a-space>
  </a-layout>
</template>

<script setup>
import { ref, inject, onMounted, computed } from 'vue';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { getData, postData } from '@/helpers/Axios';
import { apiLink } from '@/utils/api-link';
import { checkValidEmail } from '@/helpers/Common.js';

const router = useRouter();

const langState = inject('langState');
const membershipSettings = inject('membershipSettings', ref(null));
const trlang = computed(() => langState?.translations || {});

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const nickname = ref('');
const realName = ref('');
const bankId = ref(null);
const bankNumber = ref('');
const bankOwnerName = ref('');
const recommenderCode = ref('');
const captchaShow = ref(false);
const captcha = ref('');
const captchaText = ref('');
const captchaInput = ref('');
const acceptedTerms = ref(false);
const registering = ref(false);
const securityEnabled = ref(true);
const bankOptions = ref([]);

const membershipRegistration = computed(() => {
  return membershipSettings?.value?.membership_registration || 'no_use';
});

const membershipApproval = computed(() => {
  return membershipSettings?.value?.membership_approval ?? true;
});

const membershipSignupMessage = computed(() => {
  return membershipSettings?.value?.membership_signup_message || '';
});

const isRegistrationEnabled = computed(() => {
  return membershipRegistration.value !== 'no_use';
});

const requiresRecommender = computed(() => {
  return membershipRegistration.value === 'recommender';
});

const canSelectReferrer = computed(() => {
  return membershipRegistration.value === 'select_referrer';
});

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
      
      // Load bank options
      if (result.data.deposit_banks && Array.isArray(result.data.deposit_banks)) {
        bankOptions.value = result.data.deposit_banks
          .filter(bank => bank && bank.trim() !== '')
          .map(bankName => ({
            value: bankName,
            label: bankName,
          }));
      } else {
        bankOptions.value = [];
      }
      
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

const goToLogin = () => {
  router.push('/auth/login');
};

const register = async () => {
  if (!isRegistrationEnabled.value) {
    return message.error(trlang.value.membership_registration_disabled);
  }

  if (!email.value || !password.value || !nickname.value || !realName.value) {
    return message.error(trlang.value.please_fill_required_fields);
  }

  if (!bankId.value || !bankNumber.value || !bankOwnerName.value) {
    return message.error(trlang.value.bank_information_required);
  }

  if (!checkValidEmail(email.value)) {
    return message.error(trlang.value.not_correct_email);
  }

  if (password.value !== confirmPassword.value) {
    return message.error(trlang.value.passwords_do_not_match);
  }

  if (password.value.length < 6) {
    return message.error(trlang.value.password_min_length);
  }

  if (!acceptedTerms.value) {
    return message.error(trlang.value.must_accept_terms);
  }

  if (requiresRecommender.value && !recommenderCode.value) {
    return message.error(trlang.value.recommender_code_required);
  }

  if (captchaShow.value) {
    if (!captchaInput.value || captchaText.value !== captchaInput.value) {
      await getCaptcha();
      return message.error(trlang.value.captcha_is_wrong);
    }
  }

  registering.value = true;

  try {
    const payload = {
      email: email.value.toLowerCase(),
      password: password.value,
      nickname: nickname.value,
      real_name: realName.value,
      bank_id: bankId.value,
      bank_number: bankNumber.value,
      bank_owner_name: bankOwnerName.value,
    };

    if (recommenderCode.value) {
      payload.recommender_code = recommenderCode.value;
    }

    if (captchaShow.value && captchaInput.value) {
      payload.captcha = captchaInput.value;
      if (captchaText.value) {
        payload.captcha_text = captchaText.value;
      }
    }

    const res = await postData(apiLink.register, payload);

    if (res.status) {
      message.success(trlang.value.registration_success_pending_approval);
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      message.error(res.message || trlang.value.registration_failed);
      if (securityEnabled.value) {
        await getCaptcha();
      }
    }
  } catch (error) {
    console.error('Registration error:', error);
    message.error(trlang.value.registration_failed);
    if (securityEnabled.value) {
      await getCaptcha();
    }
  } finally {
    registering.value = false;
  }
};

onMounted(async () => {
  if (!isRegistrationEnabled.value) {
    message.warning(trlang.value.membership_registration_disabled);
  }
  await fetchSecuritySetting();
});
</script>
<style scoped>
.bank-select {
  background: transparent !important;
  color: red !important;
}

.bank-select :deep(.ant-select-selector) {
  height: 32px !important;
  border-radius: 6px !important;
  background: transparent !important;

}
</style>
