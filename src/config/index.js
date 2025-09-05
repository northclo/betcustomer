export const config = {
  baseURL:
    process.env.NODE_ENV === "development"
      ? process.env.VUE_APP_BASE_URL_DEV
      : process.env.VUE_APP_BASE_URL_PROD,
};
