import { uploadDeckHtml, uploadOgImage } from '@/lib/services/blob-storage';

export async function deploy(
  slug: string,
  deckHtml: string,
  ogPngBuffer: Buffer,
): Promise<{ deckUrl: string; ogImageUrl: string }> {
  const [deckUrl, ogImageUrl] = await Promise.all([
    uploadDeckHtml(slug, deckHtml),
    uploadOgImage(slug, ogPngBuffer),
  ]);

  return { deckUrl, ogImageUrl };
}
