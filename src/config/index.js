const isDevelopment = process.env.NODE_ENV === "development";

export const config = {
  baseURL: isDevelopment
    ? process.env.VUE_APP_BASE_URL_DEV || "http://localhost:5000/api/"
    : process.env.VUE_APP_BASE_URL_PROD || "https://api.superball-race.com/api/",
  socketURL: isDevelopment
    ? process.env.VUE_APP_SOCKET_URL_DEV || "http://localhost:5000/"
    : process.env.VUE_APP_SOCKET_URL_PROD || "https://api.superball-race.com/",
};
