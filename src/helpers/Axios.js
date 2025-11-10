import axios from "axios";
import { message } from "ant-design-vue";
import httpStatusCodes from 'http-status-codes'
import router from '@/Router'
import { config } from "@/config/index.js";

/**
 * @summary
 * This feature checks response of axios is success.
 * If result is success, return response data from backend and if result is failed, return error message.
 *
 * @param {function} fn
 */
const handleError =
    (fn) =>
        async (...params) => {
            try {
                return await fn(...params);
            } catch (error) {
                if (error.response) {
                    // in the case of unautherized user
                    if (error.response.status == httpStatusCodes.UNAUTHORIZED) {
                        router.push('/auth/login')
                    }
                    message.error(`${error.response.data.message}`);
                    return {
                        status: false,
                    };
                } else {
                    message.error("No response from server. Please check your network.");
                    return {
                        status: false,
                    };
                }
            }
        };

export const getData = handleError(async (url) => {
    let token = localStorage.getItem('token');

    const res = await axios.get(`${config.baseURL}${url}`, {
        headers: {
            authorization: token
        },
        timeout: 5000
    })

    return {
        status: true,
        message: res.data.message,
        data: res.data.data
    }
})

export const postData = handleError(async (url, data = {}) => {
    let token = localStorage.getItem('token');

    const res = await axios.post(`${config.baseURL}${url}`, data, {
        headers: {
            authorization: token
        },
        timeout: 5000,
    });

    return {
        status: true,
        message: res.data.message,
        data: res.data.data,
    };
});

export const putData = handleError(async (url, data = {}) => {
    let token = localStorage.getItem('token');

    const res = await axios.put(`${config.baseURL}${url}`, data, {
        headers: {
            authorization: token
        },
        timeout: 5000,
    });

    return {
        status: true,
        message: res.data.message,
        data: res.data.data,
    };
});

export const deleteData = handleError(async (url) => {
    let token = localStorage.getItem('token');

    const res = await axios.delete(`${config.baseURL}${url}`, {
        headers: {
            authorization: token
        },
        timeout: 5000
    })

    return {
        status: true,
        message: res.data.message,
        data: res.data.data,
    };
})
