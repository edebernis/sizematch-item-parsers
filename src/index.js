#!/usr/bin/env node

'use strict';

const messenger_lib = require('./messenger');
const parser_lib = require('./parsers');


async function run(messenger, parser) {
    await messenger.consumeItem(async (msg, item) => {
        try {
            await parser.fetch_and_parse(item);
            const isWritten = messenger.publishItem(item, function(err, ok) {
                if (err !== null) {
                    console.log(err);
                    messenger.nack(msg, true);
                }
                else
                    messenger.ack(msg);
            });
            if (!isWritten) {
                console.log('Publisher buffer full');
                messenger.nack(msg, true);
            }
        } catch (e) {
            if (e.retry === undefined) {
                console.log(e);
                e.retry = false;
            }
            messenger.nack(msg, e.retry);
        }
    });
}


(async () => {
    let messenger, parser;

    try {
        messenger = await messenger_lib.load(
            process.env.RABBITMQ_HOST || '',
            process.env.RABBITMQ_PORT || 5672,
            process.env.RABBITMQ_USERNAME || '',
            process.env.RABBITMQ_PASSWORD || '',
            process.env.RABBITMQ_VHOST || '',
            process.env.RABBITMQ_HEARTBEAT || 60,
            process.env.RABBITMQ_CONNECTION_ATTEMPTS || 5,
            process.env.RABBITMQ_APP_ID
        );

        await messenger.setupConsumer(
            process.env.CONSUMER_QUEUE_NAME,
            process.env.PREFETCH_COUNT || 1
        );

        await messenger.setupPublisher(
            process.env.PUBLISHER_EXCHANGE_NAME,
            process.env.PUBLISHER_ROUTING_KEY,
            process.env.PUBLISHER_QUEUE_NAME
        );

        parser = await parser_lib.load(process.env.PARSER_NAME, {
            browserlessHost: process.env.BROWSERLESS_HOST,
            browserlessPort: process.env.BROWSERLESS_PORT || 3000,
            browserlessToken: process.env.BROWSERLESS_TOKEN,
            parseMaxRetries: process.env.PARSE_MAX_RETRIES || 3
        });

        process.on('SIGTERM', async () => {
            console.info('SIGTERM signal received. Exiting.');
            if (messenger) messenger.close();
        });

        run(messenger, parser);

    } catch (e) {
        console.log(e);
        if (messenger) messenger.close();
    }
})();
