// @ts-check
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const INDEX_PATH = '../src/index.html';
const IMAGE_PATH = './pages/nsp_stock.bmp';

test('grab screenshot', async ({ page }) => {
  const search = new URLSearchParams();
  search.set('deviceId', 'your-device-id');
  search.set('apiKey', 'your-secret-key');
  const url = new URL('file://' + path.resolve(__dirname, INDEX_PATH));
  url.search = search.toString();

  // Navigate to the local page
  await page.goto(url.toString());

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle('TRMNL | Simulator');

  // Read the custom image from disk
  const image = fs.readFileSync(path.resolve(__dirname, IMAGE_PATH), 'base64');

  // Set the "screen" to a custom image
  await page.evaluate(async (imageData) => {
    const image = document.getElementById('screen');
    if (image instanceof HTMLImageElement){
      image.src = 'data:image/bmp;base64,' + imageData;
    }
  }, image);

  // Capture a screenshot
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
});
