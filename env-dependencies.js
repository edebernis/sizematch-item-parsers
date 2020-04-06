#!/usr/bin/env node

'use strict';

const execSync = require('child_process').execSync;
const pkg = require('./package.json');

let env = Object.assign({}, process.env);

const parsed = pkg.envDependencies.urls
    .map(url => url.replace(/\${([0-9a-zA-Z_]*)}/g, (_, varName) => {
        if (typeof env[varName] === 'string') {
            return env[varName];
        } else {
            throw new Error(`Could not read env variable ${varName} in url ${url}`);
        }
     }))
    .join(' ');

try {
    execSync('npm install --no-save ' + parsed, { stdio: [0, 1, 2] });
    process.exit(0);
} catch (err) {
    throw new Error('Could not install pkg.envDependencies');
}
