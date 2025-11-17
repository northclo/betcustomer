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
          // Suppress ResizeObserver loop errors
          if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications') ||
              errorMessage.includes('ResizeObserver loop limit exceeded')) {
            return false; // Don't show in overlay
          }
          return true; // Show other errors
        },
      },
    },
  },
  configureWebpack: {
    // Suppress ResizeObserver errors in webpack
    ignoreWarnings: [
      {
        module: /node_modules/,
        message: /ResizeObserver loop/,
      },
    ],
  },
});

