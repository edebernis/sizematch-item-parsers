#!/usr/bin/env node

'use strict';

const { Client } = require('@elastic/elasticsearch');


class DB {
    constructor(client) {
        this.client = client;
        this.client.on('error', this.onError);
    }

    static create(hostname, port, username, password, maxRetries, requestTimeout) {
        const client = new Client({
            node: `http://${hostname}:${port}`,
            auth: {
                username: username,
                password: password
            },
            maxRetries: maxRetries,
            requestTimeout: requestTimeout
        });
        return new DB(client);
    }

    onError(err) {
        console.log(err);
    }

    getIndex(item) {
        return 'items';
    }

    async store(item) {
        await this.client.index({
            id: `${item.source}-${item.id}`,
            index: this.getIndex(item),
            body: {
                dimensions: item.dimensions,
                meta: item.metadata
            }
        });
    }
}


function load(hostname, port, username, password, maxRetries, requestTimeout) {
    return DB.create(hostname, port, username, password, maxRetries, requestTimeout);
}


module.exports = {load: load};
