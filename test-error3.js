import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('PAGE ERROR LOG:', msg.text());
    } else {
       console.log('PAGE LOG:', msg.text());
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR TRACE:');
    console.log(error.message);
    console.log(error.stack);
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  console.log('Waiting for books to load...');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click first book
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    console.log('Clicking first book...');
    await books[0].click();
    await new Promise(r => setTimeout(r, 2000));
    
    // Open settings if there is a settings button
    const settingsBtn = await page.$('button[title="Display Settings"]');
    if (settingsBtn) {
      await settingsBtn.click();
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Click Single layout
    console.log('Finding layout buttons...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const singleBtn = buttons.find(b => b.textContent.includes('Single') || b.textContent.includes('Single Page'));
      if (singleBtn) {
         console.log('Found single btn, clicking!');
         singleBtn.click();
      } else {
         console.log('Single btn not found!');
      }
    });
    
    await new Promise(r => setTimeout(r, 4000));
  } else {
    console.log('No books found.');
  }

  await browser.close();
})();
