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
    
    // Select text in the reader
    const content = await page.$('.reading-content');
    if (content) {
      await page.evaluate(() => {
        const p = document.querySelector('.reading-content p');
        if (p) {
          const range = document.createRange();
          range.selectNodeContents(p);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          
          // trigger mouseup manually since we are using JS to select
          const evt = new MouseEvent('mouseup', { bubbles: true, cancelable: true });
          p.dispatchEvent(evt);
        }
      });
      await new Promise(r => setTimeout(r, 1000));
      
      const noteBtn = await page.$('button[title="Add Note"]');
      if (noteBtn) {
        console.log('Found Note button, clicking...');
        await noteBtn.click();
        await new Promise(r => setTimeout(r, 500));
        
        const textarea = await page.$('textarea');
        if (textarea) {
          console.log('Found textarea, typing note...');
          await textarea.type('This is a test note');
          await new Promise(r => setTimeout(r, 500));
          
          // Click save
          const saveBtn = await page.evaluateHandle(() => {
            return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save'));
          });
          
          if (saveBtn) {
             console.log('Found save button, clicking...');
             await saveBtn.click();
             await new Promise(r => setTimeout(r, 1000));
             console.log('Success!');
          } else {
             console.log('Save button not found');
          }
        } else {
          console.log('Textarea not found. Popup might have closed.');
        }
      } else {
        console.log('Note button not found.');
      }
    }
  }

  await browser.close();
})();
