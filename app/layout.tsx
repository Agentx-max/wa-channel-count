import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
  openGraph: {
    title: 'WA Live Count',
    description: 'Track WhatsApp Channel followers in real time',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
