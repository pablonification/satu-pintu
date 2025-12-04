import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok for development testing with Vapi webhooks
  allowedDevOrigins: [
    "*.ngrok.io",
    "*.ngrok-free.app",
  ],
};

export default nextConfig;
