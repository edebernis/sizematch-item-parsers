#!/usr/bin/env node

'use strict';

const { Parser, Item } = require('./');
const SOURCE = 'ikea';


class IKEAParser extends Parser {

    async parse(obj) {
        const page = await this.browser.newPage();

        await page.goto(obj.urls[0], {
            timeout: this.config.fetchPageTimeout,
            waitUntil: 'networkidle2'
        });

        const metadata = await page.evaluate('utag_data');
        const dimensions = await this.DLtoObj(page, '#pip_dimensions');
        const id = metadata.product_ids[0];

        await page.close();

        return new Item(id, SOURCE, obj.lang, dimensions, metadata);
    }
}


module.exports = {
    class: IKEAParser
};
