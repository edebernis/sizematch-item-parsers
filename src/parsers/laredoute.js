#!/usr/bin/env node

'use strict';

const { Parser } = require('./');
const utils = require('./utils');


class LaRedouteParser extends Parser {
    constructor(source, config) {
        super(source, config);

        this.getDescription();
        this.getDimensions();
    }

    getDescription() {
        this.evaluate(utils.parseMeta, ['description'], (item, description) => {
            item.setDescription(description);
        });
    }

    getDimensions() {
        this.evaluateCompose(
            [utils.splitArrayToDict, parseDimensions],
            [],
            this.setItemDimensions,
        );
    }
}


function parseDimensions() {
    const dscpdp = document.querySelector("dscpdp").innerText;
    const regexp = new RegExp('.*[\u2022](.+)', 'ig');
    return Array.from(dscpdp.matchAll(regexp))
                .map((groups) => groups[1]);
}


module.exports = {
    class: LaRedouteParser
};
