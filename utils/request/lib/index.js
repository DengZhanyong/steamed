'use strict';

const axios = require('axios');

const baseURL = process.env.STEAMED_CLI_REQUEST_BASEURL || 'https://api.dengzhanyong.com/steamed'

const request = axios.create({
    baseURL,
    timeout: 10000
})

request.interceptors.response.use((response) => {
    return response.data;
}, (err) => {
    return Promise.reject(err);
})



module.exports = request;

