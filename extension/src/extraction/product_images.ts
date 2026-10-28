const MAX_PRODUCT_IMAGES = 8;

export class ProductImageExtractor {
  static collect(root: Document, selectors: string, preferred?: string | null): string[] {
    const urls = new Set<string>();
    const addUrl = (rawUrl: string | null | undefined) => {
      if (!rawUrl) return;
      try {
        const url = new URL(rawUrl, root.location?.href);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
        if (/logo|sprite|icon|badge|rating|seller/i.test(url.pathname)) return;
        urls.add(url.href);
      } catch {
        // Ignore malformed image URLs.
      }
    };

    addUrl(preferred);
    const images = root.querySelectorAll<HTMLImageElement>(selectors);
    for (const image of Array.from(images)) {
      const alt = `${image.alt} ${image.getAttribute('title') || ''}`;
      if (/logo|sprite|icon|badge|rating|seller|banner/i.test(alt)) continue;
      addUrl(image.currentSrc);
      addUrl(image.src);
      addUrl(image.getAttribute('data-src'));
      addUrl(image.getAttribute('data-lazy-src'));
      addUrl(image.getAttribute('data-original'));
      addUrl(image.getAttribute('data-zoom-image'));

      const srcset = image.getAttribute('srcset') || image.getAttribute('data-srcset') || '';
      for (const candidate of srcset.split(',')) {
        addUrl(candidate.trim().split(/\s+/)[0]);
      }
    }

    return [...urls]
      .sort((left, right) => this.imageResolution(right) - this.imageResolution(left))
      .slice(0, MAX_PRODUCT_IMAGES);
  }

  private static imageResolution(url: string): number {
    const match = url.match(/\/(\d{2,4})\/(\d{2,4})\//);
    return match ? Number(match[1]) * Number(match[2]) : 0;
  }
}
