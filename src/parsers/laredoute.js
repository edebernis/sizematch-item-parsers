#!/usr/bin/env node

'use strict';

const { Parser } = require('./');
const utils = require('./utils');


class LaRedouteParser extends Parser {
    constructor(source, config) {
        super(source, config);

        //this.parseDimensions();
    }

    parseDimensions() {
        this.evaluate(utils.parseHTMLTagDL, ['#pip_dimensions'], (item, dimensions) => {
            var map = item.getDimensionsMap();
            for (let [key, value] of Object.entries(dimensions)) {
                map.set(key, value);
            }
        });
    }
}


module.exports = {
    class: LaRedouteParser
};
