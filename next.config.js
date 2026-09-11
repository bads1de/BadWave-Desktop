/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  // Standaloneモード: 本番用に必要なファイルのみを抽出
  // Electronアプリ内でNode.jsサーバーとして起動するために必要
  output: "standalone",
  images: {
    // ローカル/Electronでも全ての外部画像を受け付けるためワイルドカード許可
    // セキュリティ上は特定ドメイン列挙が理想だが、要件により全許可とする
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "**",
      },
    ],
    // Electronローカル起動では最適化サーバー経由だと外部画像でコケやすいので無効化して直読み
    unoptimized: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
  },
};

module.exports = nextConfig;
