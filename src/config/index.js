// export const config = {
//   baseURL:
//     process.env.NODE_ENV === "development"
//       ? process.env.VUE_APP_BASE_URL_DEV || "http://localhost:5000/api/"
//       : process.env.VUE_APP_BASE_URL_PROD || "http://localhost:5000/api/",
// };

export const config = {
  baseURL:
    process.env.NODE_ENV === "development"
      ? process.env.VUE_APP_BASE_URL_DEV || "https://api.superball-race.com/"
      : process.env.VUE_APP_BASE_URL_PROD || "https://api.superball-race.com/",
};
