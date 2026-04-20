function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function buildFilename(title: string, roundLabel?: string): string {
  const base = slugify(title) || 'forma';
  const suffix = roundLabel ? `-${slugify(roundLabel)}` : '';
  return `${base}${suffix}.png`;
}

/**
 * Fetch an image URL (data URL or remote) and trigger a browser download.
 * Uses a blob anchor so the original URL isn't navigated to directly.
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
