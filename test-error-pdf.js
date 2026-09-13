import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
       console.log('PAGE ERROR LOG:', msg.text());
    }
  });
  page.on('pageerror', error => {
    console.log('PAGE ERROR TRACE:');
    console.log(error.message);
    console.log(error.stack);
  });

  console.log('Navigating to app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  console.log('Setting layoutMode to single in IndexedDB...');
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('LuminaReaderDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.get('reader_settings');
      request.onsuccess = () => {
        const settings = request.result || { key: 'reader_settings', value: {} };
        settings.value.layoutMode = 'single';
        const putRequest = store.put(settings);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  });

  console.log('Reloading app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Find PDF book
  const books = await page.$$('.group.relative.flex');
  let clicked = false;
  for (const book of books) {
    const text = await page.evaluate(el => el.textContent, book);
    if (text.includes('PDF')) {
      console.log('Clicking PDF book...');
      await book.click();
      clicked = true;
      break;
    }
  }
  
  if (clicked) {
    await new Promise(r => setTimeout(r, 6000));
    console.log('Trying to switch layout mode...');
    const btn = await page.$('button[title*="Click to toggle"]');
    if (btn) {
      console.log('Found layout btn, clicking!');
      await btn.click();
      await new Promise(r => setTimeout(r, 2000));
      await btn.click();
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  await browser.close();
})();
