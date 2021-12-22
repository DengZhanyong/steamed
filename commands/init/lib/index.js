'use strict';

const path = require('path');
const inquirer = require('inquirer');
const semver = require('semver');
const fes = require('fs-extra');
const Command = require('@steamed/command');
const Package = require('@models/package');
const request = require('@steamed/request');
const log = require('@steamed/log');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const CACHE_DIR = 'templates';
class InitCommand extends Command {
    
    init() {
        this.projectName = this._argv[0] || null;
        const { force = false } = this._cmd.opts();
        this.force = force;
        log.verbose('projectName [force]', this.projectName , this.force);
    }

    async exec() {
        try {
            const projectInfo = await this.prepare();
            if (projectInfo) {
                console.log(projectInfo);
                // 2. 下载模板
                await this.downloadTemplate(projectInfo);
                // 3. 安装模板
            }
        } catch (error) {
            log.error(error.message)
            if (log.level === 'verbose') {
                console.log(error);
            }
        }
    }

    async downloadTemplate(projectInfo) {
        // 1. 获取项目模板信息：（1）通过egg.js搭建一套后端系统（2）使用npm存储模板（3）将项目信息存储到数据库中MongoDB（4）通过egg.js 获取数据并返回
        const tempInfo = this.templateList.find(t => t.key === projectInfo.temp_type);
        if (!tempInfo) {
            throw new Error('未获取到模板信息');
        }
        // 2. 创建一个package类
        const homePath = process.env.STEAMED_CLI_HOME_PATH;
        const targetPath = path.resolve(homePath, CACHE_DIR);
        const storeDir = path.resolve(targetPath, 'node_modules');;
        const pkg = new Package({
            targetPath,
            storeDir,
            packageName: tempInfo.packageName,
            packageVersion: tempInfo.version
        });
        this.templateNpm = pkg;
        // 3. 判断缓存中的模板是否为最新版本(如果不是最新版本，需要更新)
        if (await pkg.exists()) {
            // 更新
            await pkg.update();
        } else {
            // 安装
            await pkg.install();
        }
        // 4. 将缓存中的模板复制到当前目录下
        this.installNormalTemp();
    }

    // 安装普通模板
    installNormalTemp() {
        const cacheFilePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
        const currentPath = process.cwd();

        log.verbose('tempCacheFilePath', cacheFilePath);
        log.verbose('currentPath', currentPath);

        fes.ensureDirSync(cacheFilePath);
        fes.ensureDirSync(currentPath);
        fes.copySync(cacheFilePath, currentPath);
    }

    async prepare() {
        // 1. 判断当前目录是否为空
        const localPath = process.cwd();
        const templateList = await request.get('/template');
        this.templateList = templateList;
        let isForce = false;
        if (!this.isDirEmpty(localPath)) {
            if (!this.force) {  // 没有--fore参数
                isForce = (await inquirer.prompt({
                    name: "isForce",
                    type: "confirm",
                    default: false,
                    message: "当前文件夹不为空，是否强制创建？"
                })).isForce;
            }
            if (this.force || isForce) {
                const { confirmForce } = await inquirer.prompt({
                    name: "confirmForce",
                    type: "confirm",
                    default: false,
                    message: "强制创建会清空当前目录下的所有文件，是否继续？"
                });
                if (confirmForce) {
                    fes.emptyDirSync(localPath);
                    return this.getProjectInfo();
                }
            }
        }
        
        return this.getProjectInfo();
    }
    
    isDirEmpty(localPath) {
        const fileList = fes.readdirSync(localPath);
        return fileList.filter(f => !f.startsWith('.')).length === 0; 
    }
    
    // 获取用户配置信息
    async getProjectInfo() {
        let projectInfo = {};
        const { type } = await inquirer.prompt({
            name: 'type',
            message: '选择类型',
            type: 'list',
            choices: [
                {
                    value: TYPE_PROJECT,
                    name: '项目'
                },
                {
                    value: TYPE_COMPONENT,
                    name: '组件'
                }
            ]
        });
        log.verbose('Create Type', type);
        if (type === TYPE_PROJECT) {
            const project = await inquirer.prompt([
                {
                    name: 'temp_type',
                    message: '选择项目模板类型',
                    type: 'list',
                    choices: this.templateList.map(t => ({
                        ...t,
                        value: t.key
                    }))
                },
                {
                    name: 'projectName',
                    message: `请输入项目名称:`,
                    type: 'input',
                    default: this.projectName,
                    validate: function(value) {
                        var done = this.async();
                        setTimeout(function() {
                            if (!/^[a-zA-Z]+([(-|_)][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*[a-zA-Z0-9]$/g.test(value)) {
                                done('项目名称不符合规定');
                                return;
                            }
                            done(null, true);
                        }, 0);
                    }
                },
                {
                    name: 'describe',
                    message: '请输入描述信息:',
                    type: 'input'
                },
                {
                    name: 'version',
                    message: '请输入版本号:',
                    type: 'input',
                    default: '1.0.0',
                    validate: function(value) {
                        var done = this.async();
                        setTimeout(function() {
                            if (!semver.valid(value)) {
                                done('版本号不符合规定');
                                return;
                            }
                            done(null, true);
                        }, 0);
                    },
                    filter: (value) => {
                        return semver.valid(value) || value;
                    }
                }
            ])
            this.tempInfo = this.templateList.find(t => t.key === project.temp_type);
            projectInfo = {
                type,
                ...project,
            }
        }
        return projectInfo;
    }

}

function init(argv) {
    return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
