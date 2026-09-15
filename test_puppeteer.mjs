import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  page.on('response', response => {
    if (!response.ok()) {
       console.log('NETWORK ERROR:', response.status(), response.url());
    }
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Try to upload a dummy PDF
  console.log('Waiting...');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();

