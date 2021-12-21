'use strict';

const path = require('path');
const log = require('@steamed/log');
const Package = require('@steamed/package');

const commandMap = {
    'init': '@imooc-cli/init'
}

const CACHE_DIR = 'dependencies/';

async function exec() {

    try {
        const command = process.argv[2];
        let targetPath = process.env.STEAMED_ALI_TARGET_PATH;
        const homePath = process.env.STEAMED_CLI_HOME_PATH;
        const packageName = commandMap[command];
        const packageVersion = 'latest';
        let storePath = '';

        if (!targetPath) {
            targetPath = path.resolve(homePath, CACHE_DIR);
            storePath = path.resolve(targetPath, 'node_modules');;
        }

        log.verbose('targetPath', targetPath);
        log.verbose('storePath', storePath);

        let pkg;
        if (storePath) {
            pkg = new Package({
                targetPath,
                storePath,
                packageName,
                packageVersion
            });
    
            if (await pkg.exists()) {
                log.verbose('更新');
                // 更新
                await pkg.update();
            } else {
                // 安装
                log.verbose('安装');
                await pkg.install();
            }
        } else {
            pkg = new Package({
                targetPath,
                packageName,
                packageVersion
            });
        }

        const rootFilePath = pkg.getRootFilePath();
        log.verbose('rootFilePath', rootFilePath)
        if (rootFilePath) {
            require(rootFilePath).call(this, Array.from(arguments));
        }
    } catch (e) {
        log.error(e.message);
        if (log.level === 'verbose') {
            console.log(e);
        }
    }
}

module.exports = exec;