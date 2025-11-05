<template>
  <div class="customer-center-page">
    <div class="bg-primary-light radius-2 p-5 mt-5">
      <a-card title="Customer Support Center" class="game-result-card">
        <a-space direction="vertical" size="large" class="w-100">
          <!-- Quick Actions -->
          <div>
            <div class="section-title">Quick Actions</div>
            <a-row :gutter="[16, 16]" class="mt-3">
              <a-col
                v-for="action in quickActions"
                :key="action.key"
                :xs="24"
                :sm="12"
                :md="8"
              >
                <div class="quick-action-card" @click="handleQuickAction(action)">
                  <div class="action-icon">{{ action.icon }}</div>
                  <div class="action-title">{{ action.title }}</div>
                  <div class="action-desc">{{ action.description }}</div>
                </div>
              </a-col>
            </a-row>
          </div>

          <!-- FAQ Section -->
          <div>
            <div class="section-title">Frequently Asked Questions</div>
            <a-collapse
              v-model:activeKey="activeFaqKeys"
              class="faq-collapse mt-3"
            >
              <a-collapse-panel
                v-for="faq in faqs"
                :key="faq.id"
                :header="faq.question"
                class="faq-item"
              >
                <p>{{ faq.answer }}</p>
              </a-collapse-panel>
            </a-collapse>
          </div>

          <!-- Contact Form -->
          <div>
            <div class="section-title">Contact Us</div>
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
                  @click="handleSubmitContact"
                  :disabled="!canSubmit"
                >
                  <span>Send Message</span>
                  <span class="btn-icon">→</span>
                </button>
              </a-space>
            </div>
          </div>

          <!-- Support Channels -->
          <div>
            <div class="section-title">Support Channels</div>
            <a-row :gutter="[16, 16]" class="mt-3">
              <a-col
                v-for="channel in supportChannels"
                :key="channel.key"
                :xs="24"
                :sm="12"
                :md="6"
              >
                <div class="support-channel-card">
                  <div class="channel-icon">{{ channel.icon }}</div>
                  <div class="channel-title">{{ channel.title }}</div>
                  <div class="channel-value">{{ channel.value }}</div>
                  <div class="channel-hours">{{ channel.hours }}</div>
                </div>
              </a-col>
            </a-row>
          </div>
        </a-space>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { postData } from '@/helpers/Axios.js';
import { apiLink } from '@/utils/api-link.js';

// ✅ state
const activeFaqKeys = ref([]);
const contactType = ref('general');
const contactName = ref('');
const contactEmail = ref('');
const contactMessage = ref('');

const canSubmit = computed(() => {
  return contactName.value && contactEmail.value && contactMessage.value;
});

// ✅ constants
const quickActions = [
  {
    key: 'ticket',
    icon: '🎫',
    title: 'Create Ticket',
    description: 'Submit a support ticket',
  },
  {
    key: 'live_chat',
    icon: '💬',
    title: 'Live Chat',
    description: 'Chat with our support team',
  },
  {
    key: 'email',
    icon: '📧',
    title: 'Send Email',
    description: 'Email us your inquiry',
  },
  {
    key: 'phone',
    icon: '📞',
    title: 'Call Us',
    description: 'Phone support available',
  },
  {
    key: 'faq',
    icon: '❓',
    title: 'View FAQ',
    description: 'Browse common questions',
  },
  {
    key: 'guide',
    icon: '📚',
    title: 'User Guide',
    description: 'Learn how to use platform',
  },
];

const faqs = [
  {
    id: 1,
    question: 'How do I deposit funds into my account?',
    answer: 'You can deposit funds through multiple methods including bank transfer, credit card, cryptocurrency, and e-wallet. Go to the Add Funds page and select your preferred payment method.',
  },
  {
    id: 2,
    question: 'How long does withdrawal take?',
    answer: 'Withdrawal processing time varies by method. Bank transfers typically take 3-5 business days, while e-wallets and cryptocurrency withdrawals are usually processed within 24 hours.',
  },
  {
    id: 3,
    question: 'What is the minimum withdrawal amount?',
    answer: 'The minimum withdrawal amount is 10,000 of your account currency. This may vary depending on your withdrawal method.',
  },
  {
    id: 4,
    question: 'How do I place a bet?',
    answer: 'Select your betting option (Odd/Even, Under/Over, etc.), choose your bet amount, and click "Start Bet". Make sure you have sufficient balance in your account.',
  },
  {
    id: 5,
    question: 'Can I cancel my bet?',
    answer: 'Yes, you can cancel your bet during the betting window (3 minutes to 1.5 minutes before game ends). Use the cancel button in your betting history.',
  },
  {
    id: 6,
    question: 'How do I view my betting history?',
    answer: 'Navigate to the Bet History page from the main menu to view all your past bets, including amounts, results, and earnings.',
  },
];

const supportChannels = [
  {
    key: 'email',
    icon: '📧',
    title: 'Email Support',
    value: 'support@bettingplatform.com',
    hours: '24/7 Available',
  },
  {
    key: 'live_chat',
    icon: '💬',
    title: 'Live Chat',
    value: 'Available Now',
    hours: 'Mon-Sun 9AM-11PM',
  },
  {
    key: 'phone',
    icon: '📞',
    title: 'Phone Support',
    value: '+1-800-123-4567',
    hours: 'Mon-Fri 9AM-6PM',
  },
  {
    key: 'ticket',
    icon: '🎫',
    title: 'Support Ticket',
    value: 'Submit Ticket',
    hours: '24/7 Available',
  },
];

// ✅ methods
const handleQuickAction = (action) => {
  switch (action.key) {
    case 'ticket':
      // Scroll to contact form
      document.querySelector('.contact-form')?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'faq':
      // Expand first FAQ
      activeFaqKeys.value = [1];
      document.querySelector('.faq-collapse')?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'live_chat':
      message.info('Live chat feature coming soon!');
      break;
    default:
      message.info(`${action.title} feature coming soon!`);
  }
};

const handleSubmitContact = async () => {
  if (!contactName.value || !contactEmail.value || !contactMessage.value) {
    return message.error('Please fill in all fields');
  }

  try {
    // TODO: Replace with actual API endpoint when available
    const result = await postData(apiLink.submit_contact || 'customer/support/contact', {
      type: 'general',
      name: contactName.value,
      email: contactEmail.value,
      message: contactMessage.value,
    });

    if (result.status) {
      message.success('Your message has been sent successfully! We will get back to you soon.');
      contactName.value = '';
      contactEmail.value = '';
      contactMessage.value = '';
      contactType.value = 'general';
    } else {
      message.error(result.message || 'Failed to send message');
    }
  } catch (error) {
    console.error('Error submitting contact form:', error);
    message.error('An error occurred. Please try again.');
  }
};

onMounted(() => {
  // Initialize
});
</script>

<style scoped>
.customer-center-page {
  min-height: 80vh;
}

.section-title {
  color: var(--white-color);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
}

.quick-action-card {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 25px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: var(--glass-shadow-soft);
}

.quick-action-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--glass-shadow);
  border-color: var(--glass-border-light);
  background: var(--glass-bg-light);
}

.action-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.action-title {
  color: var(--white-color);
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.action-desc {
  color: var(--white-color);
  font-size: 14px;
  opacity: 0.7;
}

.faq-collapse {
  background: transparent;
  border: none;
}

:deep(.ant-collapse) {
  background: transparent;
  border: none;
}

:deep(.ant-collapse-item) {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
}

:deep(.ant-collapse-header) {
  background: transparent;
  color: var(--white-color) !important;
  font-weight: 600;
  padding: 16px 20px !important;
}

:deep(.ant-collapse-content) {
  background: var(--glass-bg-dark);
  border-top: 1px solid var(--glass-border);
}

:deep(.ant-collapse-content-box) {
  padding: 20px !important;
  color: var(--white-color);
  opacity: 0.9;
  line-height: 1.8;
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

.support-channel-card {
  background: var(--glass-bg);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--glass-shadow-soft);
}

.support-channel-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--glass-shadow);
  border-color: var(--glass-border-light);
}

.channel-icon {
  font-size: 40px;
  margin-bottom: 15px;
}

.channel-title {
  color: var(--white-color);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
}

.channel-value {
  color: var(--white-color);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  background: var(--gradient-emerald);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.channel-hours {
  color: var(--white-color);
  font-size: 12px;
  opacity: 0.7;
}

.contact-form {
  background: var(--glass-bg-light);
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 35px;
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

:deep(.ant-select-selector) {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: var(--blur-sm);
  -webkit-backdrop-filter: var(--blur-sm);
  border: 2px solid var(--glass-border) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  font-size: 15px !important;
}

:deep(.ant-select-selector *) {
  color: #ffffff !important;
}

:deep(.ant-select-selection-item),
:deep(.ant-select-selection-placeholder),
:deep(.ant-select-selection-search-input),
:deep(.ant-select-selection-search-input input),
:deep(.ant-select-selection-search-input input::placeholder) {
  color: #ffffff !important;
  opacity: 1 !important;
}

:deep(.ant-select-selection-item) {
  color: #ffffff !important;
  opacity: 1 !important;
  font-weight: 500;
  line-height: 1.5;
}

:deep(.ant-select-selection-placeholder) {
  color: #ffffff !important;
  opacity: 0.7 !important;
}

:deep(.ant-select-selection-search-input) {
  color: #ffffff !important;
}

:deep(.ant-select-selection-search-input input) {
  color: #ffffff !important;
  opacity: 1 !important;
}

:deep(.ant-select-selection-search-input input::placeholder) {
  color: #ffffff !important;
  opacity: 0.7 !important;
}

:deep(.ant-select-selection-overflow) {
  color: #ffffff !important;
}

:deep(.ant-select-selection-overflow-item) {
  color: #ffffff !important;
}

:deep(.ant-select-selector .ant-select-selection-item) {
  color: #ffffff !important;
  opacity: 1 !important;
}

:deep(.ant-select-selection-item span),
:deep(.ant-select-selection-item > span),
:deep(.ant-select-selection-item *) {
  color: #ffffff !important;
}

:deep(.ant-select-selector *) {
  color: #ffffff !important;
}

:deep(.ant-select-selection-item),
:deep(.ant-select-selection-item *),
:deep(.ant-select-selection-item span),
:deep(.ant-select-selection-item > span),
:deep(.ant-select-selection-item .ant-select-selection-item-content),
:deep(.ant-select-selection-item-content) {
  color: #ffffff !important;
  opacity: 1 !important;
  font-weight: 500;
}

:deep(.ant-select-selection-search-input input) {
  color: #ffffff !important;
  opacity: 1 !important;
}

:deep(.ant-select-selection-search-input input::placeholder) {
  color: #ffffff !important;
  opacity: 0.7 !important;
}

:deep(.ant-select-selection-overflow-item),
:deep(.ant-select-selection-overflow-item span),
:deep(.ant-select-selection-overflow-item *) {
  color: #ffffff !important;
}

/* Force white color for ALL text inside select selector */
:deep(.ant-select-selector) {
  color: #ffffff !important;
}

:deep(.ant-select-selector *) {
  color: #ffffff !important;
}

:deep(.ant-select-selector .ant-select-selection-item),
:deep(.ant-select-selector .ant-select-selection-item *),
:deep(.ant-select-selector .ant-select-selection-item span) {
  color: #ffffff !important;
  opacity: 1 !important;
}

:deep(.ant-select-selector:hover) {
  border-color: var(--glass-blue-border) !important;
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: var(--glass-blue-border) !important;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4) !important;
  background: rgba(255, 255, 255, 0.08) !important;
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

:deep(.ant-select-arrow) {
  color: var(--white-color) !important;
  opacity: 0.8;
}

:deep(.ant-input::placeholder),
:deep(.ant-input) {
  color: var(--white-color) !important;
  opacity: 0.9;
}

:deep(.ant-input::placeholder) {
  opacity: 0.6;
}

:deep(.ant-select-dropdown) {
  background: var(--glass-bg-dark) !important;
  backdrop-filter: var(--blur-md);
  -webkit-backdrop-filter: var(--blur-md);
  border: 1px solid var(--glass-border) !important;
  border-radius: 12px !important;
  box-shadow: var(--glass-shadow) !important;
}

:deep(.ant-select-item) {
  color: var(--white-color) !important;
  background: transparent !important;
}

:deep(.ant-select-item:hover),
:deep(.ant-select-item-option-active) {
  background: rgba(255, 255, 255, 0.05) !important;
}

:deep(.ant-select-item-option-selected) {
  background: rgba(99, 102, 241, 0.2) !important;
  color: var(--white-color) !important;
  font-weight: 600;
}

:deep(.ant-select-item-option-selected .ant-select-item-option-content) {
  color: var(--white-color) !important;
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

:deep(.ant-input-number),
:deep(.ant-input-number-input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 2px solid var(--glass-border) !important;
  color: var(--white-color) !important;
  border-radius: 12px !important;
}
</style>

