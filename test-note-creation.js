import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    await books[1].click(); // click EPUB
    await new Promise(r => setTimeout(r, 2000));
    
    // Select text
    await page.evaluate(() => {
      const p = document.querySelector('.reading-content p');
      if (p) {
        const range = document.createRange();
        range.setStart(p.firstChild, 0);
        range.setEnd(p.firstChild, 15); // "Sun Tzu said: T"
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        // dispatch mouseup to trigger selection popover
        document.dispatchEvent(new MouseEvent('mouseup'));
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Click Note button
    const noteBtn = await page.$('button[title^="Attach note"]');
    if (noteBtn) {
      await noteBtn.click();
      await new Promise(r => setTimeout(r, 500));
      
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.type('My test note');
        await new Promise(r => setTimeout(r, 500));
        
        // Click save
        const saveBtn = await page.evaluateHandle(() => {
          return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
        });
        
        if (saveBtn) {
           await saveBtn.click();
           await new Promise(r => setTimeout(r, 1000));
           
           // Check if mark is rendered
           const markHTML = await page.evaluate(() => {
             const m = document.querySelector('mark');
             return m ? m.outerHTML : null;
           });
           
           console.log("MARK RENDERED:", markHTML);
        }
      }
    }
  }

  await browser.close();
})();
