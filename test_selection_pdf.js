import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    await books[0].click(); // click first book (the pdf)
    await new Promise(r => setTimeout(r, 4000)); // wait longer for pdf
    
    const result = await page.evaluate(async () => {
      const textLayer = document.querySelector('.react-pdf__Page__textContent');
      if (!textLayer) return 'No text layer found';
      
      const span = textLayer.querySelector('span');
      if (!span) return 'No span in text layer';
      
      const range = document.createRange();
      range.selectNodeContents(span);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      
      return sel.toString();
    });
    
    console.log("SELECTED PDF TEXT:", result);
  }
  
  await browser.close();
})();
