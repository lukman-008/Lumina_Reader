const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  
  // Need to upload a PDF or create a mock one in IndexedDB
  await page.evaluate(async () => {
    // Create a tiny valid PDF
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
  
  // Navigate to reader
  await page.goto('http://localhost:3000/#/reader/test-book');
  
  await new Promise(r => setTimeout(r, 5000));
  
  const canvases = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('canvas')).map(c => ({
      width: c.width,
      height: c.height,
      display: getComputedStyle(c).display,
      visibility: getComputedStyle(c).visibility
    }));
  });
  
  console.log("CANVASES:", canvases);
  
  const texts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.react-pdf__Page__textContent')).length;
  });
  console.log("TEXT LAYERS:", texts);
  
  await browser.close();
})();
