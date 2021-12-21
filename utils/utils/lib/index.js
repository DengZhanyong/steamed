'use strict';

const path = require('path');

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}

function formatPath(p) {
    if (p) {
        const sep = path.sep;
        return sep === '/' ? p.replace(/\\/g, '/') : p;
    }
    return p;
}

module.exports = {
    isObject,
    formatPath
};