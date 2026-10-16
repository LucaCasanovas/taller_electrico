import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow HMR /dev resources when opening the app via LAN IP
  allowedDevOrigins: ['192.168.5.105'],
  // Avoid picking /home/luca as root because of a parent package-lock.json
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
