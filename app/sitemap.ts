import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://wacount.com';
  const currentDate = new Date();

  // Top tracked channel URLs for search engine discoverability
  const popularChannels = [
    '0029VajWJmkAInPnfgGtrS2K',
    '0029VbBvaPyB4hdP6Ut4zc15',
    '0029VaMBo5N3wtb31nYJql3x',
    '0029VbCYfsK5Ejxyg18ecV0o',
    '0029Vb8l9UqHVvTfUqgBg62m',
    '0029Vb8i0FaDeONGPnRB820m',
    '0029VbDglEUL7UVPyJMXf82r',
    '0029VaE3Jb7EKyZ8hCltnA3x',
    '0029VbD2dG68PgsLfjEgnj3k',
    '0029VbCAEhZ84OmFKpuj543h',
  ];

  const channelEntries: MetadataRoute.Sitemap = popularChannels.map((code) => ({
    url: `${baseUrl}/channel/${code}`,
    lastModified: currentDate,
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...channelEntries,
  ];
}
