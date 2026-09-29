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
  title: 'WA Live Count – WhatsApp Channel Follower Tracker',
  description:
    'Track any WhatsApp Channel\'s live subscriber/follower count in real time. Paste a channel link and watch the numbers update automatically.',
  keywords: ['WhatsApp', 'channel', 'followers', 'subscriber count', 'live tracker'],
  icons: {
    icon: 'https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg',
    shortcut: 'https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg',
    apple: 'https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg',
  },
  openGraph: {
    title: 'WA Live Count',
    description: 'Track WhatsApp Channel followers in real time',
    type: 'website',
    images: ['https://i.ibb.co/KxdvZJBw/6069a1fb-d297-4809-ac59-412685ea0c0d.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SecurityGuard />
        {children}
      </body>
    </html>
  );
}
