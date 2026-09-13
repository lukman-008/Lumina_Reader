import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    await books[1].click(); // click second book (the epub)
    await new Promise(r => setTimeout(r, 2000));
    
    const result = await page.evaluate(async () => {
      const p = document.querySelector('.reading-content p');
      if (!p) return 'No p';
      
      const range = document.createRange();
      // Select the whole first paragraph
      range.selectNodeContents(p);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      
      return sel.toString();
    });
    
    console.log("SELECTED EPUB TEXT:", result);
  }
  
  await browser.close();
})();
