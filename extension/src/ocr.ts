import { createWorker } from 'tesseract.js';

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const IMAGE_HOSTS = [
  'flipkart.com', 'flixcart.com', 'amazon.com', 'amazon.in', 'bigbasket.com',
  'bbassets.com', 'blinkit.com', 'grofers.com', 'jiomart.com', 'zepto.com',
  'swiggy.com', 'swiggy.in'
];

let workerPromise: ReturnType<typeof createWorker> | null = null;

function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && IMAGE_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      workerPath: chrome.runtime.getURL('ocr/worker.min.js'),
      corePath: chrome.runtime.getURL('ocr/core/'),
      langPath: chrome.runtime.getURL('ocr/lang'),
      workerBlobURL: false,
      gzip: true,
      cacheMethod: 'write'
    }).catch((error: unknown) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function recognizeImage(url: string): Promise<string> {
  if (!isAllowedImageUrl(url)) return '';
  const response = await fetch(url, { credentials: 'omit', redirect: 'follow' });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return '';

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_IMAGE_BYTES) return '';
  const image = await response.blob();
  if (image.size > MAX_IMAGE_BYTES) return '';

  const worker = await getWorker();
  const result = await worker.recognize(image);
  return result.data.text || '';
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'FG_RUN_LOCAL_OCR') return false;

  const urls: string[] = Array.isArray(message.imageUrls)
    ? message.imageUrls.filter((url: unknown): url is string => typeof url === 'string').slice(0, MAX_IMAGES)
    : [];

  void Promise.all(urls.map((url) => recognizeImage(url).catch(() => '')))
    .then((texts) => sendResponse({ texts }))
    .catch((error: unknown) => sendResponse({ texts: [], error: error instanceof Error ? error.message : 'OCR failed.' }));
  return true;
});
