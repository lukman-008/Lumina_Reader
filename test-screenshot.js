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
        range.setEnd(p.firstChild, 15);
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
        await textarea.type('This is a highly visible note!');
        await new Promise(r => setTimeout(r, 500));
        
        const saveBtn = await page.evaluateHandle(() => Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save')));
        if (saveBtn) {
           await saveBtn.click();
           await new Promise(r => setTimeout(r, 1000));
           
           // Click it
           await page.evaluate(() => {
             const m = document.querySelector('mark');
             if (m) {
                const rect = m.getBoundingClientRect();
                m.dispatchEvent(new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  clientX: rect.left + rect.width / 2,
                  clientY: rect.top + rect.height / 2
                }));
             }
           });
           
           await new Promise(r => setTimeout(r, 1000));
           
           await page.screenshot({ path: 'popup.png' });
           console.log("Screenshot saved.");
        }
      }
    }
  }

  await browser.close();
})();
