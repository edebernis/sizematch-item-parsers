#!/usr/bin/env node

'use strict';


function parseJSObject(obj) {
    return eval(obj); // jshint ignore:line
}

function parseJSONListDefinition(rootType) {
    const lists = Array.from(document.querySelectorAll('script[type="application/ld+json"]')) // jshint ignore:line
                       .map(element => JSON.parse(element.innerHTML));

    for (let i = 0; i < lists.length; i++) {
        if (lists[i]["@type"].toLowerCase().includes(rootType.toLowerCase())) {
            return lists[i];
        }
    }
}

function parseJSONLDBreadcrumbList(jsonld) {
    if (jsonld) return jsonld.itemListElement.map(element => element.name);
}

function parseMicrodataBreadcrumbList() {
    const list = document.querySelector('[itemtype*="BreadcrumbList"]');
    if (list) {
        return Array.from(list.querySelectorAll('[itemtype*="ListItem"]'))
                    .map((item) => item.querySelector('[itemprop="name"]').innerText)
    }
}

function parseHTMLTagDL(selector) {
    const dl = Array.from(document.querySelectorAll(`${selector} dt, ${selector} dd`)) // jshint ignore:line
                    .map(el => el.innerText);

    if (dl.length % 2 != 0) throw new Error('Invalid DL');

    return dl.reduce((acc, cur, idx, src) => {
        if (idx % 2 == 0) acc[cur] = src[idx+1];
        return acc;
    }, {});
}

function parseMeta(name) {
    return document.querySelector("meta[name="+ name +"]").content;
}

function splitArrayToDict(array, splitChars = [':', ' ']) {
    let dict = {};
    array.forEach((element) => {
        element = element.trim();
        for (let char of splitChars) {
            let s = element.split(char);
            if (s.length > 1) {
                dict[s.shift().trim()] = s.join(char).trim();
                break;
            }
        }
    })
    return dict;
}

module.exports = {
    parseJSObject: parseJSObject,
    parseJSONListDefinition: parseJSONListDefinition,
    parseJSONLDBreadcrumbList: parseJSONLDBreadcrumbList,
    parseMicrodataBreadcrumbList: parseMicrodataBreadcrumbList,
    parseHTMLTagDL: parseHTMLTagDL,
    parseMeta: parseMeta,
    splitArrayToDict: splitArrayToDict,
};
