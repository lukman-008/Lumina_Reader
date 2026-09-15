import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
      console.log('BROWSER LOG:', msg.text());
  });
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.toString()));
  
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
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Switching to native mode...');
  await page.evaluate(() => {
     const buttons = Array.from(document.querySelectorAll('button'));
     const btn = buttons.find(b => b.title.includes('Native'));
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 4000));
  
  console.log('Switching to Reader mode...');
  await page.evaluate(() => {
     const buttons = Array.from(document.querySelectorAll('button'));
     const btn = buttons.find(b => b.title?.includes('Text Mode') || b.title?.includes('Reader Mode'));
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Check if error boundary text is present
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Something went wrong') || bodyText.includes('sendWithPromise')) {
      console.log('CRASH DETECTED');
  } else if (bodyText.includes('No text could be extracted') || bodyText.includes('This is a test PDF')) {
      console.log('NO CRASH DETECTED (Reader mode rendered)');
  } else {
      console.log('UNKNOWN STATE. Body: ', bodyText.slice(0, 100));
  }
  
  await browser.close();
})();
