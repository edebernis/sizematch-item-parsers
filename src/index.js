#!/usr/bin/env node

'use strict';

const consumer_lib = require('./consumer');
const parser_lib = require('./parsers');


async function run(consumer, parser) {
    let msg;

    try {
        msg = await consumer.get();
        if (msg) {
            const item = await parser.fetch_and_parse(JSON.parse(msg.content));
            consumer.ack(msg);
            console.log(item);
        }
    } catch (e) {
        console.log(e);
        if (msg) consumer.nack(msg);
    }
}


(async () => {
    let consumer, parser, intervalId;

    try {
        consumer = await consumer_lib.load(
            process.env.RABBITMQ_HOST || '',
            process.env.RABBITMQ_PORT || 5672,
            process.env.RABBITMQ_USERNAME || '',
            process.env.RABBITMQ_PASSWORD || '',
            process.env.RABBITMQ_VHOST || '',
            process.env.RABBITMQ_HEARTBEAT || 60,
            process.env.RABBITMQ_CONNECTION_ATTEMPTS || 5,
            process.env.QUEUE_NAME,
            process.env.PREFETCH_COUNT || 1
        );

        parser = await parser_lib.load(process.env.PARSER_NAME, {
            browserlessHost: process.env.BROWSERLESS_HOST,
            browserlessPort: process.env.BROWSERLESS_PORT || 3000,
            browserlessToken: process.env.BROWSERLESS_TOKEN,
            fetchPageTimeout: process.env.FETCH_PAGE_TIMEOUT || 30000
        });

        process.on('SIGTERM', async () => {
            console.info('SIGTERM signal received. Exiting.');
            clearInterval(intervalId);
            consumer.close();
        });

        intervalId = setInterval( function() { run(consumer, parser); }, process.env.INTERVAL || 1000);

    } catch (e) {
        console.log(e);
        if (intervalId) clearInterval(intervalId);
        if (consumer) consumer.close();
    }
})();
