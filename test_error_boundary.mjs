import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
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
  
  // click import
  await page.evaluate(() => {
     const buttons = Array.from(document.querySelectorAll('button'));
     const btn = buttons.find(b => b.textContent.includes('Import'));
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  // The book should be in the library view now
  await page.evaluate(() => {
     const books = Array.from(document.querySelectorAll('div, button')).filter(el => el.textContent.includes('dummy'));
     if (books.length > 0) books[books.length - 1].click();
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  // Check if there is an error boundary
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Something went wrong')) {
      console.log('ERROR BOUNDARY TRIGGERED!');
  } else if (bodyText.includes('Failed to load native PDF')) {
      console.log('REACT-PDF ERROR TRIGGERED!');
  } else {
      console.log('NO ERROR FOUND.');
  }
  
  await browser.close();
})();
