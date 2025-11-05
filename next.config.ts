import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Оптимизация для Telegram Mini Apps
  experimental: {
    optimizePackageImports: ['@telegram-apps/sdk'],
  },
  
  // Настройки для мобильных сетей и Telegram
  compress: true,
  
  // Заголовки безопасности оптимизированные для Telegram
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Расслабленная CSP для Telegram Mini Apps
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://js.onclckvd.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https: https://vast.yomeno.xyz; frame-src 'self' https:; frame-ancestors 'self' https://web.telegram.org;",
          },
          // Permissions Policy для разрешения accelerometer (для рекламы)
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=*, gyroscope=*, magnetometer=*, camera=(), microphone=(), geolocation=()',
          },
          // Оптимизация кэширования для мобильных сетей
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Специальные заголовки для статических ресурсов
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Заголовки для API
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Оптимизация изображений для мобильных сетей
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
