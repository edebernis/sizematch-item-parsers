#!/usr/bin/env node

'use strict';

const consumer_lib = require('./consumer');
const parser_lib = require('./parsers');


async function run(consumer, parser) {
    try {
        const obj = await consumer.get();
        if (obj) {
            const item = await parser.fetch_and_parse(obj);
            console.log(item);
        }
    } catch (e) {console.log(e);}

    setImmediate(() => run(consumer, parser));
}


(async () => {
    var consumer, parser;

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
            browserlessHost: process.env.BROWSERLESS_HOST,
            browserlessPort: process.env.BROWSERLESS_PORT || 3000,
            browserlessToken: process.env.BROWSERLESS_TOKEN,
            fetchPageTimeout: process.env.FETCH_PAGE_TIMEOUT || 30000
        });

        process.on('SIGTERM', async () => {
            console.info('SIGTERM signal received. Exiting.');
            await consumer.close();
        });

        setImmediate(() => run(consumer, parser));

    } catch (e) {
        console.log(e);
        if (consumer) await consumer.close();
    }
})();
