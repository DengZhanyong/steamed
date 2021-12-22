'use strict';

const path = require('path');
const fs = require('fs');
const npmInstall = require('npminstall');
const fse = require('fs-extra');
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
        this.storeDir = props.storeDir;  // 缓存路径
        this.packageName = props.packageName;  // 包名
        this.packageVersion = props.packageVersion;  // 版本
        this.cacheFilePathPrefix = this.packageName.replace('/', '_');
    }

    // 获取缓路径
    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
    }

    getSpecificCacheFilePath (packageVersion) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${packageVersion}@${this.packageName}`);
    }

    // 准备
    async prepare() {
        if (this.storeDir && !fs.existsSync(this.storeDir)) {
            fse.mkdirpSync(this.storeDir);
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getLatestVersion(this.packageName);
        }
    }

    // 判断缓存中是否存在
    async exists() {
        if (this.storeDir) {
            await this.prepare();
            return fs.existsSync(this.cacheFilePath);
        } else {
            return fs.existsSync(this.targetPath);
        }
    }

    // 安装
    async install() {
        await this.prepare();
        await npmInstall({
            root: this.targetPath,
            storeDir: this.storeDir,
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
        // 1. 获取到最新版本
        const latestPackageVersion = await getLatestVersion(this.packageName);
        // 2. 判断缓存中是否存在最新版本
        log.verbose('latestPackageVersion', latestPackageVersion);
        const latestPackagePath = this.getSpecificCacheFilePath(latestPackageVersion);
        log.verbose('latestPackagePath', latestPackagePath);
        // 3. 如果不存在，需要更新下载
        if (!fs.existsSync(latestPackagePath)) {
            log.verbose('update', 'command package');
            await npmInstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [{
                    name: this.packageName,
                    version: latestPackageVersion
                }]
            });
        }
        this.packageVersion = latestPackageVersion;
    }

    // 获取到执行文件路径
    getRootFilePath() {
        function _getRootFile(targetPath) {
            const dir = pkgDir.sync(targetPath);
            if (dir) {
                const pkgFile = require(path.resolve(dir, 'package.json'))
                if (pkgFile && pkgFile.main) {
                    return formatPath(path.resolve(dir, pkgFile.main));
                }
            }
            return null;
        }
        return _getRootFile(this.storeDir ? this.cacheFilePath : this.targetPath);
    }
}

module.exports = Package;
