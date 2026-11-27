import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@guardianes/contracts',
    '@guardianes/database',
    '@guardianes/evidence-engine',
    '@guardianes/geo-engine',
    '@guardianes/report-engine',
    '@guardianes/ui',
    '@guardianes/validation',
  ],
  reactStrictMode: true,
};

export default nextConfig;
