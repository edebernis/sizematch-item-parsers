#!/usr/bin/env node

'use strict';

const puppeteer = require('puppeteer');


class Item {
    constructor(id, source, lang, dimensions, metadata) {
        this.id = id;
        this.source = source;
        this.lang = lang;
        this.dimensions = dimensions;
        this.metadata = metadata;
    }
}


class Parser {
    constructor(config, browser) {
        this.config = config;
        this.browser = browser;
    }

    static async create(parser, config) {
        const browser = await puppeteer.launch({
            executablePath: config.browserPath,
            args: ['--disable-dev-shm-usage']
        });

        return new parser(config, browser);
    }

    async parse(obj) {
        throw new Error('Not Implemented');
    }

    async DLtoObj(page, selector) {
        const handles = await page.$$(`${selector} dt, ${selector} dd`);
        if (handles.length % 2 != 0) throw new Error('Invalid DL');

        var elements = [];
        await Promise.all(handles.map(async (handle) => {
            const text = await page.evaluate(el => el.innerText, handle);
            elements.push(text.trim());
        }));

        return elements.reduce((acc, cur, idx, src) => {
            if (idx % 2 == 0) acc[cur] = src[idx+1];
            return acc;
        }, {});
    }

    async close() {
        await this.browser.close();
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
