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
  
  console.log('Setting layoutMode to single in IndexedDB...');
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('lumina_db');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.get('reader_settings');
      request.onsuccess = () => {
        const settings = request.result || {};
        settings.layoutMode = 'single';
        const putRequest = store.put(settings, 'reader_settings');
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  });

  console.log('Reloading app...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Click first book
  const books = await page.$$('.group.relative.flex');
  if (books.length > 0) {
    console.log('Clicking first book...');
    await books[0].click();
    await new Promise(r => setTimeout(r, 4000));
  } else {
    console.log('No books found.');
  }

  await browser.close();
})();
