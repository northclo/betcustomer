<template>
  <div class="customer-center-page">
    <div class="bg-primary-light radius-2 p-5 mt-5">
      <a-card title="Contact Us" class="game-result-card">
          <!-- Contact Form -->
          <div>
            <div class="contact-form mt-3">
              <a-space direction="vertical" class="w-100" size="middle">
                <a-input
                  v-model:value="contactName"
                  placeholder="Your Name"
                  size="large"
                />
                <a-input
                  v-model:value="contactEmail"
                  placeholder="Your Email"
                  size="large"
                />
                <a-textarea
                  v-model:value="contactMessage"
                  placeholder="Your Message"
                  :rows="6"
                  size="large"
                />
                <button
                  class="send-message-btn"
                  type="button"
                  @click="handleSubmitContact"
                  :disabled="!canSubmit"
                  :aria-busy="isSubmitting"
                >
                  <span>{{ isSubmitting ? 'Sending...' : 'Send Message' }}</span>
                  <span v-if="!isSubmitting" class="btn-icon">→</span>
                </button>
              </a-space>
            </div>
          </div>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { message } from 'ant-design-vue';
import { postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

const contactName = ref('');
const contactEmail = ref('');
const contactMessage = ref('');
const isSubmitting = ref(false);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const canSubmit = computed(() => {
  return (
    !isSubmitting.value &&
    contactName.value.trim().length > 0 &&
    contactEmail.value.trim().length > 0 &&
    contactMessage.value.trim().length > 0
  );
});

const resetForm = () => {
  contactName.value = '';
  contactEmail.value = '';
  contactMessage.value = '';
};

const handleSubmitContact = async () => {
  if (isSubmitting.value) {
    return;
  }

  const name = contactName.value.trim();
  const email = contactEmail.value.trim();
  const messageBody = contactMessage.value.trim();

  if (!name || !email || !messageBody) {
    message.error('Please fill in all fields');
    return;
  }

  if (!emailPattern.test(email)) {
    message.error('Please enter a valid email address');
    return;
  }

  isSubmitting.value = true;

  try {
    const result = await postData(apiLink.submit_contact, {
      type: 'general',
      name,
      email,
      message: messageBody,
    });

    if (result?.status) {
      message.success('Your message has been sent successfully! We will get back to you soon.');
      resetForm();
    }
  } catch (error) {
    console.error('Error submitting contact form:', error);
    message.error('An error occurred. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.customer-center-page {
  min-height: 80vh;
}

:deep(.ant-collapse) {
  background: transparent;
  border: none;
}


.contact-form {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 30px;
  box-shadow: var(--glass-shadow);
}

.send-message-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.9));
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid rgba(16, 185, 129, 0.5);
  color: var(--white-color);
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  margin-top: 10px;
}

.send-message-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
  border-color: rgba(16, 185, 129, 0.7);
  background: linear-gradient(135deg, rgba(16, 185, 129, 1), rgba(5, 150, 105, 1));
}

.send-message-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.send-message-btn .btn-icon {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.send-message-btn:hover:not(:disabled) .btn-icon {
  transform: translateX(4px);
}

:deep(.ant-input:hover) {
  border-color: var(--glass-blue-border) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.ant-input:focus) {
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.ant-input::placeholder),
:deep(.ant-input) {
  color: var(--white-color) !important;
  opacity: 0.9;
}

:deep(.ant-input::placeholder) {
  opacity: 0.6;
}

:deep(.ant-input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 2px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
}

:deep(.ant-textarea) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 2px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  border-radius: 12px !important;
}

:deep(.ant-input:hover),
:deep(.ant-textarea:hover) {
  border-color: var(--glass-blue-border) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.ant-input:focus),
:deep(.ant-textarea:focus) {
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}
</style>

