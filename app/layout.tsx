import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SecurityGuard from '@/components/SecurityGuard';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://wacount.com'),
  title: {
    default: 'WA Live Count – Live WhatsApp Channel Follower Counter',
    template: '%s | WA Live Count',
  },
  description:
    'Track any WhatsApp Channel\'s live subscriber and follower count in real time on wacount.com. Instant, accurate, and free WhatsApp Channel analytics.',
  keywords: [
    'WhatsApp channel follower count',
    'WhatsApp subscriber tracker',
    'live WhatsApp followers',
    'WA live count',
    'wacount.com',
    'WhatsApp channel analytics',
    'live follower counter',
    'WhatsApp channel members',
  ],
  authors: [{ name: 'Agent X & TechKey Team' }],
  creator: 'Agent X & TechKey Team',
  publisher: 'WA Live Count',
  applicationName: 'WA Live Count',
  alternates: {
    canonical: 'https://wacount.com',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: 'https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg',
    shortcut: 'https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg',
    apple: 'https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg',
  },
  openGraph: {
    type: 'website',
    url: 'https://wacount.com',
    title: 'WA Live Count – Live WhatsApp Channel Follower Counter',
    description:
      'Track real-time live follower and subscriber counts for any WhatsApp Channel. Instant updates and live analytics.',
    siteName: 'WA Live Count',
    locale: 'en_US',
    images: [
      {
        url: 'https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg',
        width: 800,
        height: 800,
        alt: 'WA Live Count – Live WhatsApp Channel Follower Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WA Live Count – Live WhatsApp Channel Follower Counter',
    description:
      'Track real-time live follower and subscriber counts for any WhatsApp Channel on wacount.com.',
    images: ['https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://wacount.com/#website',
      url: 'https://wacount.com',
      name: 'WA Live Count',
      description: 'Real-time live subscriber & follower count tracker for WhatsApp Channels',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://wacount.com/?url={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://wacount.com/#webapp',
      name: 'WA Live Count',
      url: 'https://wacount.com',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      description: 'Instant live counter and analytics for WhatsApp Channels.',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SecurityGuard />
        {children}
      </body>
    </html>
  );
}
