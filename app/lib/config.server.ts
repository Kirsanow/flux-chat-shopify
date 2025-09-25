// Server-side configuration for dynamic environment variables
export const config = {
  ngrokUrl: process.env.NGROK_URL || 'https://0fa1c7eac933.ngrok-free.app:3458',
  shopifyAppUrl: process.env.SHOPIFY_APP_URL || process.env.NGROK_URL || 'https://0fa1c7eac933.ngrok-free.app:3458',

  // Get the proxy URL for the chat widget
  getChatProxyUrl: () => {
    return '/apps/flux-chat/api/proxy'; // This is relative, works on any domain
  },

  // Get the full app URL
  getAppUrl: () => {
    return config.ngrokUrl;
  }
};