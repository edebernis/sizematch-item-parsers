#!/usr/bin/env node

'use strict';

const puppeteer = require('puppeteer');


class Evaluator {
    constructor(page) {
        this.page = page;
        this.tasks = [];
    }
  
    add(name, func, ...args) {
        this.tasks.push({
            name: name,
            func: func,
            args: args
        });
        return this;
    }
  
    async execute() {
        const serializedFunctions = JSON.stringify(this.tasks.map((obj) => {
            obj.func = obj.func.toString();
            return obj;
        }));

        return await this.page.evaluate((serializedFunctions) => {
            var results = {};
            JSON.parse(serializedFunctions).forEach((obj) => {
                results[obj.name] = new Function('return ' + obj.func)()(...obj.args); // jshint ignore:line
            });
            return results;
        }, serializedFunctions);
    }
} 


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

            return await this.parse(page, item);

        } catch (e) {
            if (e.message.includes("Protocol error (Page.navigate): Target closed") ||
                e.message.includes("Navigation failed because browser has disconnected!")) {
                e.retries = e.retries === undefined ? this.config.parseMaxRetries : e.retries - 1;
                e.retry = e.retries > 0;
            }
            throw e;

        } finally {
            if (page) await page.close();
            if (browser) await browser.disconnect();
        }
    }

    evaluate(page) {
      return new Evaluator(page);
    }

    async parse(page, item) {
        throw new Error('Not Implemented');
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
