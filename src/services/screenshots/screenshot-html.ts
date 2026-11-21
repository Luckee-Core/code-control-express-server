import { chromium, type Browser } from 'playwright-core';

export type ScreenshotOptions = { width?: number; height?: number; scale?: number };

/**
 * Headless Chromium: the installed Google Chrome first (no download), else Playwright's own
 * Chromium (`npx playwright-core install chromium-headless-shell`).
 */
const launchBrowser = async (): Promise<Browser> => {
  try {
    return await chromium.launch({ channel: 'chrome', headless: true });
  } catch (chromeError) {
    try {
      return await chromium.launch({ headless: true });
    } catch (bundledError) {
      const first = chromeError instanceof Error ? chromeError.message.split('\n')[0] : String(chromeError);
      const second = bundledError instanceof Error ? bundledError.message.split('\n')[0] : String(bundledError);
      throw new Error(
        `No headless browser for screenshots. Install Google Chrome or run \`npx playwright-core install chromium-headless-shell\`. (${first}; ${second})`,
      );
    }
  }
};

/**
 * Renders a self-contained HTML page (no network) and returns a PNG of the viewport.
 */
export const screenshotHtml = async (html: string, options: ScreenshotOptions = {}): Promise<Buffer> => {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      viewport: { width: options.width ?? 1280, height: options.height ?? 760 },
      deviceScaleFactor: options.scale ?? 2,
      javaScriptEnabled: false,
    });
    // Previews are offline: block every request so a stray URL can't stall or leak.
    await context.route('**/*', (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
    return await page.screenshot({ type: 'png' });
  } finally {
    await browser.close();
  }
};
