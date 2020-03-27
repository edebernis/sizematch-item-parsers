#!/usr/bin/env node

'use strict';

const puppeteer = require('puppeteer');


class Item {
    constructor(id, source, name, description, categories, lang, urls, image_urls, dimensions, price, priceCurrency) {
        this.id = id;
        this.source = source;
        this.name = name;
        this.description = description;
        this.categories = categories;
        this.lang = lang;
        this.urls = urls;
        this.image_urls = image_urls;
        this.dimensions = dimensions;
        this.price = price;
        this.priceCurrency = priceCurrency;
    }
}


class Parser {
    constructor(config) {
        this.config = config;
    }

    static async create(parser, config) {
        return new parser(config);
    }

    async fetch_and_parse(obj) {
        let browser, page;

        try {
            browser = await puppeteer.connect({
                browserWSEndpoint: `ws://${ this.config.browserlessHost }:${ this.config.browserlessPort }?token=${ this.config.browserlessToken }`
            });
            const page = await browser.newPage();
            return await this.parse(page, obj);

        } finally {
            if (page) await page.close();
            if (browser) await browser.disconnect();
        }
    }

    async parse(page, obj) {
        throw new Error('Not Implemented');
    }

    async parseJSONLD(page) {
        const html = await page.evaluate(() => {
            const ld = document.querySelector('script[type="application/ld+json"]'); // jshint ignore:line
            return ld.innerHTML;
        });
        return JSON.parse(html);
    }

    async parseDL(page, selector) {
        const dl = await page.evaluate((selector) => {
            var elements = Array.from(
                document.querySelectorAll(`${selector} dt, ${selector} dd`) // jshint ignore:line
            );
            return elements.map(el => el.innerText);
        }, selector);

        if (dl.length % 2 != 0) throw new Error('Invalid DL');

        return dl.reduce((acc, cur, idx, src) => {
            if (idx % 2 == 0) acc[cur] = src[idx+1];
            return acc;
        }, {});
    }
}


async function load(parserName, config) {
    const parser = require(`./${ parserName }`);
    return await Parser.create(parser.class, config);
}


module.exports = {
    load: load,
    Parser: Parser,
    Item: Item
};
