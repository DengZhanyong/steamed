'use strict';

const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const npmInstall = require('npminstall');
const pkgDir = require('pkg-dir');
const log = require('@steamed/log');
const { isObject, formatPath } = require('@steamed/utils');
const { getLatestVersion, getDefaultRegistry } = require('@steamed/get-npm-info');

class Package {
    constructor(props) {
        if (!props) {
            throw new Error('请传递参数');
        }
        if (!isObject(props)) {
            throw new Error('参数应该是一个对象');
        }
        this.targetPath = props.targetPath;  // 本地路径
        this.storePath = props.storePath;  // 缓存路径
        this.packageName = props.packageName;  // 包名
        this.packageVersion = props.packageVersion;  // 版本
        this.cacheFilePathPrefix = this.packageName.replace('/', '_');
    }

    // 获取缓路径
    get cacheFilePath() {
        return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
    }

    // 准备
    async prepare() {
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getLatestVersion(this.packageName);
        }
    }

    // 判断缓存中是否存在
    async exists() {
        if (this.storePath) {
            await this.prepare();
            return fs.existsSync(this.cacheFilePath);
        } else {
            return fs.existsSync(this.targetPath);
        }
    }

    // 安装
    async install() {
        await this.prepare();
        npmInstall({
            root: this.targetPath,
            storeDir: this.storePath,
            registry: getDefaultRegistry(),
            pkgs: [{
                name: this.packageName,
                version: this.packageVersion
            }]
        });
    }

    // 更新
    async update() {
        await this.prepare();
        // todo
    }

    // 复制
    copy() {
        console.log(this.cacheFilePath);
        fse.copyFileSync(this.cacheFilePath, process.cwd());
    }

    // 获取到执行文件路径
    getRootFilePath() {
        if (!this.storePath) {
            const dir = pkgDir.sync(this.targetPath);
            const pkgFile = require(path.resolve(dir, 'package.json'))
            if (pkgFile && pkgFile.main) {
                return formatPath(path.resolve(dir, pkgFile.main));
            }
            return null;
        } else {
            // todo
        }
    }
}

module.exports = Package;
