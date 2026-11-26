/**
 * Save a file from a presigned object-store URL.
 *
 * `<a download>` is ignored for cross-origin URLs, so the browser just navigates/previews instead of saving.
 * Fetching the bytes and saving a same-origin blob always downloads; if the storage blocks that
 * (CORS) we fall back to opening the URL in a new tab, which still lets the user save it.
 */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  const save = (href: string, newTab = false) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    if (newTab) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blobUrl = URL.createObjectURL(await res.blob());
    save(blobUrl);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
  } catch {
    save(url, true);
  }
}
