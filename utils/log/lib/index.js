'use strict';

const log = require('npmlog');

log.level = process.env.STEAMED_CLI_LOG_LEVEL || 'info';
log.heading = 'Steamed';
log.headingStyle = { bg: 'white', fg: 'black' }

module.exports = log;

