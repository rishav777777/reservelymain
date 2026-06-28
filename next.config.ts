import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  // Prevent this site from being embedded in iframes (clickjacking)
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  // Stop browsers guessing content type (MIME sniffing)
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  // Only send origin in referrer header for cross-origin requests
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  // Disable browser DNS prefetch (minor info-leak prevention)
  { key: 'X-DNS-Prefetch-Control',    value: 'off' },
  // Enforce HTTPS for 2 years, include subdomains (only active in production)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Restrict powerful browser APIs we don't use
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
]

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Prevent admin and API routes being cached by CDN or browser
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/admin/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ]
  },
}

export default nextConfig;
