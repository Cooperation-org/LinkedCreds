import './utils/promise-polyfill.ts'
import { Metadata } from 'next'
import ClientLayout from './ClientLayout'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'LinkedCreds',
  description:
    'LinkedCreds offers the ultimate solution for managing your professional credentials. Capture, store, and share your achievements securely to unlock new opportunities.',
  keywords:
    'Credential Management, Professional Credentials, Secure Storage, Share Achievements, LinkedCreds',
  authors: [{ name: 'Linked Trust' }],
  metadataBase: new URL('https://linkedcreds.allskillscount.org'),
  openGraph: {
    title: 'LinkedCreds',
    description:
      'Manage your professional credentials securely and efficiently with LinkedCreds. Capture, store, and share your achievements to unlock new opportunities.',
    url: 'https://linkedcreds.allskillscount.org',
    siteName: 'LinkedCreds',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630
      }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkedCreds',
    description:
      'Securely manage and share your professional credentials with LinkedCreds. Enhance your career opportunities with our comprehensive credential management solution.',
    images: ['/images/og-image.png']
  },
  applicationName: 'LinkedCreds',
  formatDetection: {
    telephone: false
  },
  manifest: '/site.webmanifest',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes'
  }
}

// Structured data
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'LinkedCreds',
  url: 'https://linkedcreds.allskillscount.org',
  applicationCategory: 'CredentialManagement',
  operatingSystem: 'Web-based',
  description:
    'LinkedCreds is a secure and efficient credential management platform. Easily capture, store, and share your professional credentials to unlock new opportunities.',
  featureList: [
    'Credential Capture',
    'Secure Storage',
    'Easy Sharing',
    'Recommendation Requests',
    'Integration with Professional Networks'
  ],
  sameAs: [
    'https://github.com/Cooperation-org',
    'https://linkedin.com/company/linkedtrust/'
  ],
  publisher: {
    '@type': 'Organization',
    name: 'LinkedCreds',
    url: 'https://linkedcreds.allskillscount.org',
    logo: 'https://linkedcreds.allskillscount.org/images/logo.png'
  },
  applicationSubCategory: 'Credential Management'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className={inter.className}>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script src='https://accounts.google.com/gsi/client' async defer />
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='' />
        <link rel='apple-touch-icon' sizes='180x180' href='/icons/apple-touch-icon.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/icons/favicon-32x32.png' />
        <link rel='icon' type='image/png' sizes='16x16' href='/icons/favicon-16x16.png' />
      </head>
      <ClientLayout>
        {children}
      </ClientLayout>
    </html>
  )
}
