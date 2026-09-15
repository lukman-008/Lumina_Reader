import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  let hasExtractionError = false;
  
  page.on('console', msg => {
      const text = msg.text();
      console.log('BROWSER LOG:', text);
      if (text.includes('Extraction error') || text.includes('sendWithPromise')) {
          hasExtractionError = true;
      }
  });
  page.on('pageerror', err => {
      console.log('BROWSER PAGEERROR:', err.toString());
      if (err.toString().includes('sendWithPromise')) {
          hasExtractionError = true;
      }
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Inject the file via DataTransfer
  const fileContent = fs.readFileSync('dummy.pdf', 'base64');
  await page.evaluate(async (base64) => {
    const res = await fetch(`data:application/pdf;base64,${base64}`);
    const blob = await res.blob();
    const file = new File([blob], 'dummy.pdf', { type: 'application/pdf' });
    
    // Simulate drop
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    const event = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer
    });
    window.dispatchEvent(event);
  }, fileContent);
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.evaluate(() => {
     const buttons = Array.from(document.querySelectorAll('button'));
     const btn = buttons.find(b => b.textContent.includes('Import'));
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.evaluate(() => {
     const books = Array.from(document.querySelectorAll('div, button')).filter(el => el.textContent.includes('dummy'));
     if (books.length > 0) books[books.length - 1].click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Switching to Reader mode...');
  await page.evaluate(() => {
     const buttons = Array.from(document.querySelectorAll('button'));
     const btn = buttons.find(b => b.title?.includes('Text Mode') || b.title?.includes('Reader Mode'));
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  if (hasExtractionError) {
      console.log('TEST FAILED: Extraction error occurred!');
  } else {
      console.log('TEST PASSED: No extraction error!');
  }
  
  await browser.close();
})();
