/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['youtube-dl-exec', 'yt-search', '@distube/ytdl-core'],
};

export default nextConfig;
