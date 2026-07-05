import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set root to the project directory to avoid picking up lockfiles in parent directories
    root: path.resolve(__dirname),
  },
  async rewrites() {
    let backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
    if (backendUrl.includes('localhost')) {
      backendUrl = backendUrl.replace('localhost', '127.0.0.1');
    }
    backendUrl = backendUrl.replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
