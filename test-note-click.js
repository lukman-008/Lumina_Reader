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
    
    await page.evaluate(async () => {
      const p = document.querySelector('.reading-content p');
      const range = document.createRange();
      range.setStart(p.firstChild, 0);
      range.setEnd(p.firstChild, 5);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Check if popup is there
    let popup = await page.$('.fixed.z-50');
    console.log('Popup exists before click?', !!popup);
    
    // Click Note button
    const noteBtn = await page.$('button[title="Add Note"]');
    if (noteBtn) {
      console.log('Clicking note button...');
      await noteBtn.click();
      await new Promise(r => setTimeout(r, 500));
      
      popup = await page.$('.fixed.z-50');
      console.log('Popup exists after click?', !!popup);
      
      const textarea = await page.$('textarea');
      console.log('Textarea exists?', !!textarea);
    }
  }
  await browser.close();
})();
