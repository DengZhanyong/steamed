'use strict';

const axios = require('axios');
const semver = require('semver');

// 获取默认的npm源
function getDefaultRegistry(origin = true) {
    return origin ? 'https://registry.npmjs.org/' : 'https://registry.npm.taobao.org/'
}


async function getNpmVersions(npmName, registry) {
    const npmRegistry = registry || getDefaultRegistry();
    return axios.get(`${npmRegistry}${npmName}`)
        .then((res) => {
            if (res.status === 200) {
                return Object.keys(res.data.versions);
            }
            return [];
        })
        .catch(() => {
            return [];
        })
}

async function getLatestVersion(npmName, registry) {
    const versions = (await getNpmVersions(npmName, registry))
        .sort((a, b) => semver.gte(a, b) ? -1 : 1);
    if (versions[0]) {
        return versions[0]
    } else {
        throw new Error('检查更新失败');
    }
}


module.exports = {
    getDefaultRegistry,
    getNpmVersions,
    getLatestVersion
};
