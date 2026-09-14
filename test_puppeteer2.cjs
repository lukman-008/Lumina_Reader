const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('error', error => console.log('CRASH ERROR:', error.message));
  
  await page.goto('http://localhost:3000');
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('Test Book')) {
        b.click();
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 15000)); // Wait for render and possible crash
  
  await browser.close();
})();
