import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    await books[1].click();
    await new Promise(r => setTimeout(r, 2000));
    
    // Select text in the reader
    await page.evaluate(() => {
      const p = document.querySelector('.reading-content p');
      if (p) {
        const range = document.createRange();
        range.setStart(p.firstChild, 0);
        range.setEnd(p.firstChild, 15);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
        // dispatch selectionchange manually just in case
        document.dispatchEvent(new Event('selectionchange'));
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Check if popup is there
    let popup = await page.$('.fixed.z-50');
    console.log('Popup exists initially?', !!popup);
    
    // Click Note button
    const noteBtn = await page.$('button[title^="Attach note"]');
    if (noteBtn) {
      console.log('Clicking attach note button...');
      await noteBtn.click();
      await new Promise(r => setTimeout(r, 500));
      
      popup = await page.$('.fixed.z-50');
      console.log('Popup exists after clicking Note button?', !!popup);
      
      const textarea = await page.$('textarea');
      if (textarea) {
        console.log('Textarea exists, typing...');
        await textarea.type('My cool note!');
        await new Promise(r => setTimeout(r, 500));
        
        // Click save
        const saveBtn = await page.evaluateHandle(() => {
          return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
        });
        
        if (saveBtn) {
           console.log('Clicking Save...');
           await saveBtn.click();
           await new Promise(r => setTimeout(r, 1000));
           
           popup = await page.$('.fixed.z-50');
           console.log('Popup exists after saving?', !!popup);
           console.log('SUCCESS!');
        } else {
           console.log('Save button not found');
        }
      } else {
        console.log('Textarea not found');
      }
    } else {
      console.log('Attach note button not found');
    }
  }

  await browser.close();
})();
