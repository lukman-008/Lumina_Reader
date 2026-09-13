import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  // Find epub book
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    await books[1].click();
    await new Promise(r => setTimeout(r, 2000));
    
    // Evaluate selection inside the page to see if popup appears
    const result = await page.evaluate(async () => {
      const p = document.querySelector('.reading-content p');
      if (!p) return 'No paragraph found';
      
      const range = document.createRange();
      // just select the first word
      range.setStart(p.firstChild, 0);
      range.setEnd(p.firstChild, 5);
      
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      
      // wait a bit
      await new Promise(r => setTimeout(r, 500));
      
      const popup = document.querySelector('.fixed.z-50');
      if (!popup) return 'Popup did not appear';
      
      return 'Popup appeared! Content: ' + popup.innerText.substring(0, 50);
    });
    
    console.log(result);
  } else {
    console.log('No books found');
  }

  await browser.close();
})();
