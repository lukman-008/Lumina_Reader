import puppeteer from 'puppeteer';
import fs from 'fs';

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
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Now FileImporterModal should be open. Click the "Import" button.
  console.log('Clicking Import in modal...');
  try {
     const importButton = await page.waitForSelector('button:has-text("Import")', { timeout: 2000 });
     if (importButton) await importButton.click();
  } catch (e) {
     console.log('Import button not found with has-text. Trying another way.');
     // find all buttons and click the one that says import
     await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent.includes('Import'));
        if (btn) btn.click();
     });
  }
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Clicking the book to open it...');
  // The book should be in the library view now
  await page.evaluate(() => {
     const books = Array.from(document.querySelectorAll('div, button')).filter(el => el.textContent.includes('dummy'));
     if (books.length > 0) books[books.length - 1].click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  console.log('Clicking to switch to Native mode...');
  // Find the button with title="Switch to Native Mode"
  await page.evaluate(() => {
     const buttons = Array.from(document.querySelectorAll('button'));
     const btn = buttons.find(b => b.title.includes('Native'));
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 5000));
  console.log('Done.');
  await browser.close();
})();
