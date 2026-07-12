/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      // ID-photo uploads (staff/client KYC) go through server actions.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
