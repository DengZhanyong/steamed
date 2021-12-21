'use strict';

const colors = require('colors');
const semver = require('semver');
const log = require('@steamed/log');
const { getLatestVersion } = require('@steamed/get-npm-info');
const { LOWEST_NODE_VERSION } = require('./constant');

class Command {
    constructor(argv) {
        try {
            if (!argv) {
                throw new Error('请输入参数');
            }
            if (!Array.isArray(argv)) {
                throw new Error('参数必须是一个数组');
            }
            if (argv.length < 1) {
                throw new Error('参数内容为空');
            }
            this._argv = argv;
            let runner = new Promise((resolve, reject) => {
                let chain = Promise.resolve();
                chain.then(() => this.checkNodeVersion());
                chain.then(() => this.initArgs());
                chain.then(() => this.init());
                chain.then(() => this.exec());
                chain.catch((error) => {
                    log.error(error);
                })
            })
        } catch (error) {
            log.error(error.message);
            if (log.level === 'verbose') {
                log.verbose(error);
            }
        }
        
    }

    prepare() {

    }

    // 初始化参数
    initArgs() {
        this._cmd = this._argv[this._argv.length - 1];
    }

    // 初始化
    init() {
        throw new Error('请实现init方法');
    };

    // 执行
    exec() {
        throw new Error('请实现exec方法');
    }

    // 检查node版本
    checkNodeVersion() {
        const currentVersion = process.version;
        const lowestVersion = LOWEST_NODE_VERSION;
        if (!semver.gte(currentVersion, lowestVersion)) {
            throw new Error(colors.red(`steamed-cli 需要node的最低版本为${lowestVersion}，当前node.js版本为${currentVersion}`));
        }
    }
}

module.exports = Command;

