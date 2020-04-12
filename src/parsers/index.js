#!/usr/bin/env node

'use strict';

const puppeteer = require('puppeteer');


class Parser {
    constructor(config) {
        this.config = config;
    }

    static async create(parser, config) {
        return new parser(config);
    }

    async fetch_and_parse(item) {
        let browser, page;

        try {
            browser = await puppeteer.connect({
                browserWSEndpoint: `ws://${ this.config.browserlessHost }:${ this.config.browserlessPort }?token=${ this.config.browserlessToken }`
            });
            const page = await browser.newPage();

            try {
                return await this.parse(page, item);
            }
            catch (e) {
                e.retry = false;
                if (e.message.includes("Protocol error (Page.navigate): Target closed")) e.retry = true;
                throw e;
            }

        } finally {
            if (page) await page.close();
            if (browser) await browser.disconnect();
        }
    }

    async parse(page, item) {
        throw new Error('Not Implemented');
    }

    async parseJSONLDs(page) {
        const elementsHTML = await page.evaluate(() => {
            const elements = document.querySelectorAll('script[type="application/ld+json"]'); // jshint ignore:line
            return Array.from(elements).map(el => el.innerHTML);
        });
        return elementsHTML.map(html => JSON.parse(html));
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
    Parser: Parser
};
