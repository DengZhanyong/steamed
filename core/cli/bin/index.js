#! /usr/bin/env node

const importLocal = require('import-local');

if (importLocal(__filename)) {
    console.log('执行本地脚手架');
} else {
    require('../lib/index')(process.argv.slice(2))
}

