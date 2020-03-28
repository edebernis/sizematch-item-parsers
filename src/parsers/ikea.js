#!/usr/bin/env node

'use strict';

const { Parser, Item } = require('./');


class IKEAParser extends Parser {
    async parse(page, obj) {
        await page.goto(obj.urls[0], {
            timeout: this.config.fetchPageTimeout,
            waitUntil: 'networkidle2'
        });

        const schemaOrg = await this.parseJSONLD(page);
        const metadata = await page.evaluate('utag_data');
        const dimensions = await this.parseDL(page, '#pip_dimensions');

        return new Item(
            metadata.product_ids[0], obj.source, schemaOrg.name, schemaOrg.description, [metadata.category_local],
            obj.lang, obj.urls, schemaOrg.image, dimensions, schemaOrg.offers.price, schemaOrg.offers.priceCurrency
        );
    }
}


module.exports = {
    class: IKEAParser
};
