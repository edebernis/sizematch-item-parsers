#!/usr/bin/env node

'use strict';

const consumer_lib = require('./consumer');
const parser_lib = require('./parsers');
const db_lib = require('./db');


(async () => {
    var consumer, parser, db, intervalId;

    try {
        consumer = await consumer_lib.load(
            process.env.RABBITMQ_HOST || '',
            process.env.RABBITMQ_PORT || 5672,
            process.env.RABBITMQ_USERNAME || '',
            process.env.RABBITMQ_PASSWORD || '',
            process.env.RABBITMQ_VHOST || '',
            process.env.RABBITMQ_HEARTBEAT || 60,
            process.env.RABBITMQ_CONNECTION_ATTEMPTS || 5,
            process.env.QUEUE_NAME
        );

        parser = await parser_lib.load(process.env.PARSER_NAME, {
            browserPath: process.env.BROWSER_PATH || '/usr/bin/chromium-browser',
            fetchPageTimeout: process.env.FETCH_PAGE_TIMEOUT || 30000
        });

        db = db_lib.load(
            process.env.ELASTIC_HOST || '',
            process.env.ELASTIC_PORT || 9200,
            process.env.ELASTIC_USERNAME || '',
            process.env.ELASTIC_PASSWORD || '',
            process.env.ELASTIC_MAX_RETRIES || 3,
            process.env.ELASTIC_REQUEST_TIMEOUT || 30000,
        );

        process.on('SIGTERM', async () => {
            console.info('SIGTERM signal received. Exiting.');
            clearInterval(intervalId);
            await parser.close();
            await consumer.close();
        });

        intervalId = setInterval(async function () {

            try {
                const obj = await consumer.get();
                if (obj) {
                    const item = await parser.parse(obj);
                    await db.store(item);
                }
            } catch (e) {console.log(e);}

        }, process.env.INTERVAL || 1000);

    } catch (e) {
        console.log(e);
        if(parser) await parser.close();
        if(consumer) await consumer.close();
    }
})();
