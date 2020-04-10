#!/usr/bin/env node

'use strict';

const { Parser } = require('./');


class IKEAParser extends Parser {
    async parse(page, item) {
        await page.goto(item.getUrlsList()[0], {
            timeout: this.config.fetchPageTimeout,
            waitUntil: 'networkidle2'
        });

        const schemaOrg = await this.parseJSONLD(page);
        const metadata = await page.evaluate('utag_data');
        const dimensions = await this.parseDL(page, '#pip_dimensions');
        const price = parseFloat(schemaOrg.offers.lowPrice || schemaOrg.offers.price);

        item.setId(metadata.product_ids[0]);
        item.setName(schemaOrg.name);
        item.setDescription(schemaOrg.description);
        item.setCategoriesList([metadata.category_local]);
        item.setImageUrlsList(schemaOrg.image);
        item.setPrice(price);
        item.setPriceCurrency(schemaOrg.offers.priceCurrency);

        var map = item.getDimensionsMap();
        for (let [key, value] of Object.entries(dimensions)) {
            map.set(key, value);
        }
    }
}


module.exports = {
    class: IKEAParser
};
