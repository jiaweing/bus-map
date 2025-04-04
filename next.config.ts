import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { dev }) => {
    // Properly configure source maps for development
    if (dev) {
      config.devtool = "source-map";

      // Ensure source maps work in development
      config.output = {
        ...config.output,
        devtoolModuleFilenameTemplate: (info: {
          resourcePath: string;
          loaders: string;
        }) => {
          return `/_next/${info.resourcePath}?${info.loaders}`;
        },
      };
    }

    return config;
  },
};

export default nextConfig;
