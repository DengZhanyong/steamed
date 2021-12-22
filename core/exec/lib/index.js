'use strict';

const path = require('path');
const log = require('@steamed/log');
const Package = require('@steamed/package');

const commandMap = {
    'init': '@steamed/init'
}

const CACHE_DIR = 'dependencies/';

async function exec() {

    try {
        const command = process.argv[2];
        let targetPath = process.env.STEAMED_ALI_TARGET_PATH;
        const homePath = process.env.STEAMED_CLI_HOME_PATH;
        const packageName = commandMap[command];
        const packageVersion = 'latest';
        let storeDir = '';

        if (!targetPath) {
            targetPath = path.resolve(homePath, CACHE_DIR);
            storeDir = path.resolve(targetPath, 'node_modules');;
        }

        log.verbose('targetPath', targetPath);
        log.verbose('storeDir', storeDir);

        let pkg;
        if (storeDir) {
            pkg = new Package({
                targetPath,
                storeDir,
                packageName,
                packageVersion
            });
    
            if (await pkg.exists()) {
                await pkg.update();
            } else {
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