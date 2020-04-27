#!/usr/bin/env node

'use strict';

const puppeteer = require('puppeteer');
const utils = require('./utils');


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


class Evaluator {
    constructor() {
        this.tasks = [];
    }
  
    addTask(funcs, args) {
        return this.tasks.push({
            id: this.tasks.length + 1,
            funcs: funcs.map((fn) => fn.toString()),
            args: args,
        });
    }
  
    async execute(page) {
        return await page.evaluate((serializedTasks) => {
            const compose = (...functions) => args => functions.reduceRight((arg, fn) => fn(arg), args);
            var results = {};
            JSON.parse(serializedTasks).forEach((task) => {
                const functions = task.funcs.map((fn) => new Function('return ' + fn)());
                results[task.id] = compose(...functions)(...task.args); // jshint ignore:line
            });
            return results;

        }, JSON.stringify(this.tasks));
    }
} 


class Parser {
    constructor(source, config) {
        this.source = source;
        this.config = config;
        this.taskCallbacks = {};
        this.evaluator = new Evaluator();

        this.parseProduct();
        this.parseBreadcrumbs();
    }

    static async create(parser, source, config) {
        return new parser(source, config);
    }

    async fetch_and_parse(item) {
        let browser, page;

        try {
            [browser, page] = await this.fetch(item);
            await this.parse(page, item);
        } finally {
            if (page) await page.close();
            if (browser) await browser.disconnect();
        }
    }

    async fetch(item) {
        let browser, page;

        try {
            browser = await puppeteer.connect({
                browserWSEndpoint: `ws://${ this.config.browserlessHost }:${ this.config.browserlessPort }?token=${ this.config.browserlessToken }`
            });
        } catch (e) {
            if (e.message.includes("connect ECONNREFUSED") ||
                e.message.includes("Unexpected server response") ||
                e.message.includes("socket hang up")) {
                await sleep(5000);
                e.retry = true;
            }
            throw e;
        }

        try {
            page = await browser.newPage();

            await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) \
AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36");

            await page.goto(item.getUrlsList()[0], {
                timeout: this.source.products.fetchTimeout || 30000,
                waitUntil: 'networkidle2',
            });
        } catch (e) {
            if (e.message.includes("Protocol error (Page.navigate): Target closed") ||
                e.message.includes("Protocol error (Target.getBrowserContexts): Target closed") ||
                e.message.includes("Navigation failed because browser has disconnected!")) {
                e.retries = e.retries === undefined ? this.config.parseMaxRetries : e.retries - 1;
                e.retry = e.retries > 0;
            }
            throw e;
        }

        return [browser, page];
    }

    async parse(page, item) {
        const results = await this.evaluator.execute(page);
        for (let [taskID, data] of Object.entries(results)) {
            this.taskCallbacks[taskID](item, data);
        }
    }

    evaluate(func, args, callback) {
        return this.evaluateCompose([func], args, callback)
    }

    evaluateCompose(funcs, args, callback) {
        const taskID = this.evaluator.addTask(funcs, args);
        this.taskCallbacks[taskID] = callback;
    }

    parseProduct() {
        this.evaluate(
            utils.parseJSONListDefinition,
            ['Product'],
            function (item, product) {
                item.setId(product.sku);
                item.setBrand(product.brand.name);
                item.setName(product.name);
                item.setDescription(product.description);
                item.setImageUrlsList(product.image);
                item.setPrice(parseFloat(product.offers.lowPrice || product.offers.price));
                item.setPriceCurrency(product.offers.priceCurrency);
                item.setColorsList(product.color ? product.color.split(',') : []);
            }
        );
    }

    parseBreadcrumbs() {
        const callback = function (start, end) {
            var setItemCategories = function (item, breadcrumbs) {
                if (!breadcrumbs) return;
                item.setCategoriesList(
                    breadcrumbs.slice(
                        start || 0,
                        end || breadcrumbs.length,
                    )
                );
            };
            return setItemCategories;
        }

        this.evaluate(
            utils.parseMicrodataBreadcrumbList,
            [],
            callback(
                this.source.products.breadcrumbs.microdata.start,
                this.source.products.breadcrumbs.microdata.end
            ));

        this.evaluateCompose(
            [utils.parseJSONLDBreadcrumbList, utils.parseJSONListDefinition],
            ["Breadcrumblist"],
            callback(
                this.source.products.breadcrumbs.jsonld.start,
                this.source.products.breadcrumbs.jsonld.end
            ));
    }
}


async function load(source, config) {
    const parser = require(`./${ source.name }`);
    return await Parser.create(parser.class, source, config);
}


module.exports = {
    load: load,
    Parser: Parser
};
