/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['replicate.delivery']
  },
  async headers() {
    return [
      // {
      //   source: '/(.*)',
      //   headers: [
      //     {
      //       key: 'Cross-Origin-Opener-Policy',
      //       value: 'same-origin',
      //     },
      //     {
      //       key: 'Cross-Origin-Embedder-Policy',
      //       value: 'require-corp',
      //     },
      //     {
      //       key: 'Cross-Origin-Resource-Policy',
      //       value: 'cross-origin',
      //     },

      //   ],
      // },
    ];
  },
  env: {
    BASE_URL_CHAT_AGENT_PY: process.env.BASE_URL_CHAT_AGENT_PY,
  }
};

export default nextConfig;
