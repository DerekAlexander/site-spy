import { chromium } from 'playwright';

const SCREENSHOT_TIMEOUT = 30000; // 30 seconds max per screenshot
const SCREENSHOT_WIDTH = 1200;
const SCREENSHOT_HEIGHT = 800;

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return Response.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    let browser;
    try {
      // Launch browser with minimal resources
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        viewport: { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const page = await context.newPage();
      
      // Set a reasonable timeout and go to the URL
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: SCREENSHOT_TIMEOUT,
      }).catch(() => {
        // Continue even if page load fails (partial content is OK)
      });

      // Wait a bit for any lazy-loaded content
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshotBuffer = await page.screenshot({
        fullPage: false,
        type: 'png',
      });

      // Convert to base64
      const base64 = screenshotBuffer.toString('base64');
      const size = Buffer.byteLength(base64, 'base64');

      // Clean up
      await context.close();
      await browser.close();

      return Response.json({
        success: true,
        screenshot: `data:image/png;base64,${base64}`,
        size,
        timestamp: new Date().toISOString(),
        width: SCREENSHOT_WIDTH,
        height: SCREENSHOT_HEIGHT,
      });
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('Error closing browser:', e);
        }
      }
    }
  } catch (error) {
    console.error('Screenshot error:', error);
    return Response.json(
      {
        error: 'Failed to capture screenshot',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
