#!/usr/bin/env node

'use strict';


function getObj(obj) {
    return eval(obj); // jshint ignore:line
}

function getJSONLD(type) {
    const results = Array.from(document.querySelectorAll('script[type="application/ld+json"]')) // jshint ignore:line
                         .map(element => JSON.parse(element.innerHTML));

    for (let i = 0; i < results.length; i++) {
        if (results[i]["@type"].toLowerCase().includes(type.toLowerCase())) {
            return results[i];
        }
    }
}

function getDL(selector) {
    const dl = Array.from(document.querySelectorAll(`${selector} dt, ${selector} dd`)) // jshint ignore:line
                    .map(el => el.innerText);

    if (dl.length % 2 != 0) throw new Error('Invalid DL');

    return dl.reduce((acc, cur, idx, src) => {
        if (idx % 2 == 0) acc[cur] = src[idx+1];
        return acc;
    }, {});
}

module.exports = {
    getObj: getObj,
    getJSONLD: getJSONLD,
    getDL: getDL
};
