import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

interface YTSharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: YTSharePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Track YouTube Channel ${id} — YouTube Live Count`,
    description: `View the live subscriber count for YouTube channel ${id} in real time.`,
    openGraph: {
      title: `Track YouTube Channel — YouTube Live Count`,
      description: `View live YouTube channel subscriber count in real time.`,
      type: 'website',
    },
  };
}

export default async function YouTubeChannelSharePage({ params }: YTSharePageProps) {
  const { id } = await params;
  redirect(`/yt?id=${encodeURIComponent(id)}`);
}

