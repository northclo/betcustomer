const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => {
          const errorMessage = error.message || error.toString() || '';
          if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
              errorMessage.includes('ResizeObserver loop limit exceeded')) {
            return false;
          }
          return true;
        },
      },
    },
  },
  configureWebpack: {
    ignoreWarnings: [
      {
        module: /node_modules/,
        message: /ResizeObserver loop/,
      },
    ],
  },
});

