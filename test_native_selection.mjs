import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
      console.log('BROWSER LOG:', msg.text());
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
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Switching to native mode...');
  await page.evaluate(() => {
     const buttons = Array.from(document.querySelectorAll('button'));
     const btn = buttons.find(b => b.title.includes('Native'));
     if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Trying to select text...');
  // Find text layer spans
  const rects = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('.react-pdf__Page__textContent span'));
      if (spans.length > 0) {
          const span = spans[0];
          const range = document.createRange();
          range.selectNodeContents(span);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          // trigger mouseup
          const ev = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
          document.dispatchEvent(ev);
          
          return { found: true, text: span.textContent };
      }
      return { found: false };
  });
  console.log('Selection result:', rects);
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click highlight button
  await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const noteBtn = buttons.find(b => b.textContent.includes('Note') || b.title?.includes('Note'));
      if (noteBtn) noteBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // save note
  await page.evaluate(() => {
      const textareas = document.querySelectorAll('textarea');
      if (textareas.length > 0) {
          textareas[0].value = 'Test note';
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(b => b.textContent.includes('Save'));
          if (saveBtn) saveBtn.click();
      }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // check if highlight is rendered
  const highlightCount = await page.evaluate(() => {
      const hls = document.querySelectorAll('.mix-blend-multiply');
      return hls.length;
  });
  console.log('Highlights rendered:', highlightCount);
  
  await browser.close();
})();
