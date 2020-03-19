'use strict';

const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: ['--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    await page.goto('https://www.ikea.com');

    await browser.close();
})();
