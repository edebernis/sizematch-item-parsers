#!/usr/bin/env node

'use strict';

const { Parser } = require('./');
const utils = require('./utils');


class IKEAParser extends Parser {
    async parse(page, item) {
        await page.goto(item.getUrlsList()[0], {
            timeout: this.config.fetchPageTimeout,
            waitUntil: 'networkidle2'
        });

        const res = await this.evaluate(page)
            .add("dimensions", utils.getDL, "#pip_dimensions")
            .add("product", utils.getJSONLD, "product")
            .add("metadata", utils.getObj, "utag_data")
            .execute();

        item.setId(res.metadata.product_ids[0]);
        item.setName(res.product.name);
        item.setDescription(res.product.description);
        item.setCategoriesList([res.metadata.category_local]);
        item.setImageUrlsList(res.product.image);
        item.setPrice(parseFloat(res.product.offers.lowPrice || res.product.offers.price));
        item.setPriceCurrency(res.product.offers.priceCurrency);

        var map = item.getDimensionsMap();
        for (let [key, value] of Object.entries(res.dimensions)) {
            map.set(key, value);
        }
    }
}


module.exports = {
    class: IKEAParser
};
