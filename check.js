const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message, err.stack));
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);
  await browser.close();
})();
