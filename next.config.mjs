/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['drive.google.com', 'res.cloudinary.com', 'live.linkedtrust.us'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.usercontent.google.com',
        pathname: '/download/**'
      }
    ]
  },
  webpack: (config, { isServer }) => {
    // Handle rdf-canonize-native module issue
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'rdf-canonize-native': false
    }
    
    return config
  }
}

export default nextConfig
