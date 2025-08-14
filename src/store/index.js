import { createStore } from 'vuex';
import { setStore, getStore } from '@/config/utils';

const user = getStore('user');
const currency = getStore('currency');
const bookListInfo = getStore('bookListInfo');

export default createStore({
  state() {
    return {
      loginUser: user,
      selectedCurrency: currency,
      selectedBookListInfo: bookListInfo
    };
  },
  mutations: {
    setLoginUser(state, user) {
      state.loginUser = user;
      setStore('user', user);
    },
    setCurrency(state, currency) {
      state.selectedCurrency = currency;
      setStore('currency', currency);
    },
    setBookListInfo(state, bookListInfo) {
      state.selectedBookListInfo = bookListInfo;
      setStore('bookListInfo', bookListInfo);
    }
  },
  actions: {
    // your async actions here if any
  },
  getters: {
    getLoginUserInfo(state) {
      return state.loginUser;
    },
    getCurrencyInfo(state) {
      return state.selectedCurrency;
    },
    getBookListInfo(state) {
      return state.selectedBookListInfo;
    }
  }
});