import moment from "moment-timezone";

export const checkValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

export const getCurrentTime = () => {
    const TIME_ZONE = "Asia/Tokyo";
    const currentTime = moment().tz(TIME_ZONE).valueOf();
    return currentTime;
}