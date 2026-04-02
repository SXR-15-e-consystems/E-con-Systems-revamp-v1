/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd2u56hfpsewfc3.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: '*.e-consystems.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'developerresource.s3.us-west-2.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
