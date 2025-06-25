'use strict';

const path = require('path');
const fs = require('fs');
const semver = require('semver');
const colors = require('colors');
const userHome = require('user-home');
const { Command } = require('commander');
const log = require('@steamed/log');
const exec = require('@steamed/exec');
const { getLatestVersion } = require('@steamed/get-npm-info');
const pkg = require('../package.json');
const {
    LOWEST_NODE_VERSION,
    STEAMED_CLI_HOME_PATH,
    STEAMED_CLI_LOG_LEVEL
} = require('./constant');

async function index() {
    try {
        await prepare();
        registryCommand();
    } catch (e) {
        log.error(e.message);
        if (log.level === 'verbose') {
            console.log(e);
        }
    }
}

// 准备阶段
async function prepare() {
    checkPkgVersion();
    checkNodeVersion();
    checkUserHome();
    checkEnv();
    await checkCliUpdate();
}

// 注册命令
function registryCommand() {
    const program = new Command();
    program
        .name(pkg.name)
        .usage('st <command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启debug模式')
        .option('-tp, --targetPath <targetPath>', '指定本地路径');

    program
        .command('init [projectName]')
        .description('初始化项目')
        .option('-f, --force', '是否强制初始化项目')
        .action(exec);

    // 开启debug监听
    program.on('option:debug', () => {
        const { debug } = program.opts();
        if (debug) {
            log.level = 'verbose';
        } else {
            log.level = STEAMED_CLI_LOG_LEVEL;
        }
        process.env.LOG_LEVEL = log.level;
    });

    program.on('option:targetPath', () => {
        const { targetPath } = program.opts();
        targetPath && (process.env.STEAMED_ALI_TARGET_PATH = targetPath);
    });

    // program.on('command:*', (obj) => {
    //     console.log(obj);
    // });

    program.showHelpAfterError("命令不存在");


    if (process.argv.length < 3) {
        program.outputHelp();
    } else {
        program.parse(process.argv);
    }
}

// 检查当前版本
function checkPkgVersion() {
    log.info('cli-version', pkg.version);
}

// 检查node版本
function checkNodeVersion() {
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(`steamed-cli 需要node的最低版本为${lowestVersion}，当前node.js版本为${currentVersion}`);
    }
}

// 检查root权限
function checkRoot() {

}

// 检查用户主目录
function checkUserHome() {
    if (!userHome || !fs.existsSync(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在！'));
    } else {
        process.env.STEAMED_CLI_USER_HOME = userHome;
    }
}

// 检查环境变量
function checkEnv() {
    const dotnev = require('dotenv');
    const envPath = path.resolve(userHome, '.ENV');
    dotnev.config({
        path: envPath
    });
    process.env.STEAMED_CLI_HOME_PATH = path.resolve(userHome, STEAMED_CLI_HOME_PATH);
}

// 检查更新
async function checkCliUpdate() {
    const lastVersion = await getLatestVersion(pkg.name);
    if (lastVersion && !semver.gte(pkg.version, lastVersion)) {
        log.warn('steamed更新', `发现新版本${lastVersion},当前版本${pkg.version},请及时更新！`);
    }
}


module.exports = index;
