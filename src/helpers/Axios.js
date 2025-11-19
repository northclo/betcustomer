import axios from "axios";
import { message } from "ant-design-vue";
import httpStatusCodes from 'http-status-codes'
import router from '@/Router'
import { config } from "@/config/index.js";
import translations from "@/lang/en.js";

const ENABLE_AUTHENTICATION = true;

const handleError =
    (fn) =>
        async (...params) => {
            try {
                return await fn(...params);
            } catch (error) {
                if (error.response) {
                    if (ENABLE_AUTHENTICATION && error.response.status == httpStatusCodes.UNAUTHORIZED) {
                        router.push('/auth/login')
                    }
                    message.error(`${error.response.data.message}`);
                    return {
                        status: false,
                    };
                } else {
                    console.error('Network error:', error.message);
                    console.error('Request URL:', error.config?.url);
                    message.error(translations.no_response_from_server);
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
        timeout: 20000
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
        timeout: 20000,
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
        timeout: 20000,
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
        timeout: 20000
    })

    return {
        status: true,
        message: res.data.message,
        data: res.data.data,
    };
})

export const postDataWithFile = handleError(async (url, formData) => {
    let token = localStorage.getItem('token');

    const res = await axios.post(`${config.baseURL}${url}`, formData, {
        headers: {
            authorization: token,
        },
        withCredentials: true,
        timeout: 30000,
    });

    return {
        status: true,
        message: res.data.message,
        data: res.data.data,
    };
});

export const putDataWithFile = handleError(async (url, formData) => {
    let token = localStorage.getItem('token');

    const res = await axios.put(`${config.baseURL}${url}`, formData, {
        headers: {
            authorization: token,
        },
        withCredentials: true,
        timeout: 30000,
    });

    return {
        status: true,
        message: res.data.message,
        data: res.data.data,
    };
});