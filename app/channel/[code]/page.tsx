import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface ChannelPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: ChannelPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Track Channel ${code} — WA Live Count`,
    description: `View the live follower count for WhatsApp channel ${code} in real time.`,
    openGraph: {
      title: `Track Channel — WA Live Count`,
      description: `View live WhatsApp channel follower count in real time.`,
      type: 'website',
    },
  };
}

export default async function ChannelSharePage({ params }: ChannelPageProps) {
  const { code } = await params;
  const channelUrl = `https://whatsapp.com/channel/${code}`;
  redirect(`/?url=${encodeURIComponent(channelUrl)}`);
}
