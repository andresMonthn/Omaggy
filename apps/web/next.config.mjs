import { join } from 'path';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@kit/accounts',
    '@kit/admin',
    '@kit/analytics',
    '@kit/auth',
    '@kit/billing',
    '@kit/billing-gateway',
    '@kit/cms',
    '@kit/database-webhooks',
    '@kit/email-templates',
    '@kit/i18n',
    '@kit/mailers',
    '@kit/monitoring',
    '@kit/next',
    '@kit/notifications',
    '@kit/shared',
    '@kit/supabase',
    '@kit/team-accounts',
    '@kit/ui',
  ],
  // Reduce log noise from source maps
  productionBrowserSourceMaps: false,
  // Attempt to ignore source map warnings in dev
  webpack: (config, { dev }) => {
    if (dev) {
      config.ignoreWarnings = [
        { module: /node_modules/, message: /Failed to parse source map/ },
      ];
    }
    return config;
  },
};

export default config;
