#!/usr/bin/env node

'use strict';

const { Parser } = require('./');


class IKEAParser extends Parser {
    async parse(page, item) {
        await page.goto(item.getUrlsList()[0], {
            timeout: this.config.fetchPageTimeout,
            waitUntil: 'networkidle2'
        });

        const metadata = await page.evaluate('utag_data');
        const dimensions = await this.parseDL(page, '#pip_dimensions');
        const schemaOrgs = await this.parseJSONLDs(page);

        var productSchemaOrg;
        schemaOrgs.forEach((schema) => {
            if (schema["@type"].toLowerCase() == "product") productSchemaOrg = schema;
        });

        const price = parseFloat(productSchemaOrg.offers.lowPrice || productSchemaOrg.offers.price);

        item.setId(metadata.product_ids[0]);
        item.setName(productSchemaOrg.name);
        item.setDescription(productSchemaOrg.description);
        item.setCategoriesList([metadata.category_local]);
        item.setImageUrlsList(productSchemaOrg.image);
        item.setPrice(price);
        item.setPriceCurrency(productSchemaOrg.offers.priceCurrency);

        var map = item.getDimensionsMap();
        for (let [key, value] of Object.entries(dimensions)) {
            map.set(key, value);
        }
    }
}


module.exports = {
    class: IKEAParser
};
