import axios from 'axios';
import { message } from 'ant-design-vue';

let baseURL = 'https://api.vuecollection.com/';
if (process.env.NODE_ENV === "development") {
  baseURL = 'http://localhost:3000/';
}

const handleError = fn => async (...params) => {
  try {
    return await fn(...params);
  } catch (error) {
    if (error.response) {
      message.error(`${error.response.status}: ${error.response.statusText}`);
    } else {
      message.error('Network error');
    }
    // Re-throw if you want caller to handle it too
    throw error;
  }
};

export const api = {
  login: handleError(async (payload) => {
    payload.email = payload.email.toLowerCase();
    const res = await axios.post(baseURL + 'auth/', payload);
    return res.data;
  }),

  resendVerify: handleError(async (payload) => {
    payload.email = payload.email.toLowerCase();
    const res = await axios.post(baseURL + 'usersResend/', payload);
    return res.data;
  }),

  verifyEmail: handleError(async (token, email) => {
    const res = await axios.get(baseURL + `verify-email?token=${token}&email=${email}`);
    return res.data;
  }),
};