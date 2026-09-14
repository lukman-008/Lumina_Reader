const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('error', error => console.log('CRASH ERROR:', error.message));
  
  await page.goto('http://localhost:3000');
  
  // Create a book in IndexedDB
  await page.evaluate(async () => {
    const pdfBase64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTUKICAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuCj4+CmVuZG9iagoKNSAwIG9iago8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjcgMDAwMDAgbiAKMDAwMDAwMDE1MCAwMDAwMCBuIAowMDAwMDAwMjgzIDAwMDAwIG4gCjAwMDAwMDAzNzEgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDY2CiUlRU9GCg==";
    const binStr = atob(pdfBase64);
    const arr = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) arr[i] = binStr.charCodeAt(i);
    const db = await new Promise((resolve) => {
      const request = indexedDB.open('LuminaLibrary', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
    });
    
    await new Promise((resolve) => {
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      store.put({
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        format: 'pdf',
        rawFile: arr.buffer,
        dateAdded: Date.now(),
        lastAccessed: Date.now(),
        progress: 0
      });
      tx.oncomplete = resolve;
    });
  });
  
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));
  
  // Click book
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('Test Book')) {
        b.click();
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Switch to Reader mode
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.title && b.title.includes('Switch to Reader Mode')) {
        b.click();
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Switch back to Native mode
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent && b.textContent.includes('Return to Native View')) {
        b.click();
      }
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
