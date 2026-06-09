import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Literary Lab',
    short_name: 'LiteraryLab',
    description: 'Teruskan perjalanan Anda menguasai bahasa Inggris lewat sastra.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2fa16b',
    orientation: 'any',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
