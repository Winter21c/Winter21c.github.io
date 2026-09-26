import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ 静态导出：产出纯 HTML/CSS/JS 到 out/，可直接托管在 GitHub Pages
  // （原项目为部署到 Vercel 而注释掉了这一行，因为 Vercel 能跑服务端 API 路由）
  output: 'export',

  // ✅ 静态托管必需：/me -> /me/ 且产出 /me/index.html，避免深层路径 404
  trailingSlash: true,

  images: {
    // 静态导出不支持 Next.js 默认的图片优化服务，必须关闭
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
