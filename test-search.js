import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://github.com/wojtekmaj/react-pdf/issues?q=is%3Aissue+async+Client+Component', { waitUntil: 'networkidle2' });
  
  const issues = await page.$$eval('.js-issue-row', rows => rows.map(r => r.innerText));
  console.log('ISSUES:', issues);

  await browser.close();
})();
