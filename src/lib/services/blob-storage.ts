import { put } from '@vercel/blob';

export async function uploadDeckHtml(slug: string, html: string): Promise<string> {
  const blob = await put(`decks/${slug}/index.html`, html, {
    access: 'public',
    contentType: 'text/html; charset=utf-8',
    cacheControlMaxAge: 3600,
  });
  return blob.url;
}

export async function uploadOgImage(slug: string, pngBuffer: Buffer): Promise<string> {
  const blob = await put(`decks/${slug}/og-image.png`, pngBuffer, {
    access: 'public',
    contentType: 'image/png',
    cacheControlMaxAge: 86400,
  });
  return blob.url;
}
