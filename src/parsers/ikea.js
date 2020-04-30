#!/usr/bin/env node

'use strict';

const { Parser } = require('./');
const utils = require('./utils');


class IKEAParser extends Parser {
    constructor(source, config) {
        super(source, config);

        this.getDimensions();
    }

    getDimensions() {
        this.evaluate(
            utils.parseHTMLTagDL,
            ['#pip_dimensions'],
            this.setItemDimensions,
        );
    }
}


module.exports = {
    class: IKEAParser
};
