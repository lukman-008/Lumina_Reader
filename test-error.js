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
  
  // Find a PDF book to click
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
    await new Promise(r => setTimeout(r, 4000));
    const layoutBtn = await page.$('button[title="Toggle Layout Mode (Single/Double/Scroll)"]');
    if (layoutBtn) {
       console.log('Clicking Layout button...');
       await layoutBtn.click();
       await new Promise(r => setTimeout(r, 2000));
       console.log('Clicking Layout button again...');
       await layoutBtn.click();
       await new Promise(r => setTimeout(r, 2000));
    } else {
       console.log('No layout button found for PDF');
    }
  }

  await browser.close();
})();
