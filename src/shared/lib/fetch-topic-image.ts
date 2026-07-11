const IMAGE_GEN_URL = process.env.IMAGE_GEN_URL || 'http://localhost:3939';

interface ImageSearchResult {
  imageUrl: string;
}

export const fetchTopicImageAsBase64 = async (keyword: string): Promise<string | null> => {
  try {
    const searchRes = await fetch(
      `${IMAGE_GEN_URL}/api/image/search?q=${encodeURIComponent(keyword)}&n=5`,
    );
    if (!searchRes.ok) return null;

    const searchData = (await searchRes.json()) as {
      success: boolean;
      data?: { results: ImageSearchResult[] };
    };
    const results = searchData.data?.results || [];
    if (results.length === 0) return null;

    const picked = results[Math.floor(Math.random() * results.length)];
    const proxyRes = await fetch(`${IMAGE_GEN_URL}${picked.imageUrl}`);
    if (!proxyRes.ok) return null;

    const buffer = Buffer.from(await proxyRes.arrayBuffer());
    return `data:image/webp;base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
};
