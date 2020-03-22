#!/usr/bin/env node

'use strict';

const puppeteer = require('puppeteer');
const consumer_lib = require('./consumer');


async function parse(browser, obj) {
    const page = await browser.newPage();
    await page.goto(obj.url);
}


async function consume(connection, browser) {
    try {
        const obj = await connection.get();
        if (obj) await parse(browser, obj);
    } catch (e) {
        console.log(e);
        console.log('Failed to consume or process message');
    }
}


(async () => {
    var browser, consumer;

    try {
        browser = await puppeteer.launch({
            executablePath: process.env.CHROMIUM_PATH,
            args: ['--disable-dev-shm-usage']
        });

        consumer = await consumer_lib.connect(
            process.env.RABBITMQ_HOST || '',
            process.env.RABBITMQ_PORT || 5672,
            process.env.RABBITMQ_USERNAME || '',
            process.env.RABBITMQ_PASSWORD || '',
            process.env.RABBITMQ_VHOST || '',
            process.env.RABBITMQ_HEARTBEAT || 60,
            process.env.RABBITMQ_CONNECTION_ATTEMPTS || 5,
            process.env.QUEUE_NAME
        );

        const intervalId = setInterval(function () {
            consume(consumer, browser);
        }, process.env.CONSUME_INTERVAL || 1000);

        process.on('SIGTERM', async () => {
            console.info('SIGTERM signal received. Exiting');
            clearInterval(intervalId);
            await consumer.close();
            await browser.close();
        });

    } catch (e) {
        if(consumer) await consumer.close();
        if(browser) await browser.close();
    }
})();
