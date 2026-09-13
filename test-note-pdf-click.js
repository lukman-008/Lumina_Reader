import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    await books[0].click(); // click PDF
    await new Promise(r => setTimeout(r, 4000));
    
    // Select text
    await page.evaluate(() => {
      const p = document.querySelector('.react-pdf__Page__textContent span');
      if (p) {
        const range = document.createRange();
        range.selectNodeContents(p);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        document.dispatchEvent(new MouseEvent('mouseup'));
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const noteBtn = await page.$('button[title^="Attach note"]');
    if (noteBtn) {
      await noteBtn.click();
      await new Promise(r => setTimeout(r, 500));
      
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.type('My test note on PDF');
        await new Promise(r => setTimeout(r, 500));
        
        const saveBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save')));
        if (saveBtn) {
           await saveBtn.click();
           await new Promise(r => setTimeout(r, 1000));
           
           // Click the mark
           const markClicked = await page.evaluate(() => {
             const m = document.querySelector('mark');
             if (m) {
                m.click();
                return true;
             }
             return false;
           });
           
           if (markClicked) {
             await new Promise(r => setTimeout(r, 1000));
             const popover = await page.evaluate(() => {
                const p = document.querySelector('.fixed.z-50');
                return p ? p.innerText : null;
             });
             console.log("POPOVER VISIBLE PDF:", popover !== null);
             console.log("POPOVER CONTENT PDF:", popover);
           }
        }
      }
    }
  }

  await browser.close();
})();
