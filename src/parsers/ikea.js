#!/usr/bin/env node

'use strict';

const { Parser, Item } = require('./');
const SOURCE = 'ikea';


class IKEAParser extends Parser {

    async parse(obj) {
        const page = await this.browser.newPage();
        await page.goto(obj.url, {
            timeout: this.config.fetchPageTimeout
        });

        const metadata = await page.evaluate('utag_data');
        const dimensions = await this.DLtoObj(page, '#pip_dimensions');
        const id = metadata.product_ids[0];

        return new Item(id, SOURCE, dimensions, metadata);
    }
}


module.exports = {
    class: IKEAParser
};
