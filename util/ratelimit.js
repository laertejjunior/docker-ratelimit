#!/usr/bin/env node

const fs = require('fs')
const yargs = require('yargs')
const axios = require("axios-https-proxy-fix");
const moment = require('moment')
const package = require("../package.json")

const url = package.config['token-url']
const validationUrl = package.config['validation-url']
const fileName = package.config['file-name']
const expiresIn = package.config['expires-in']

var proxy = null;

yargs.version('1.0.0')

const checkRateLimit = (argv, callback) => {

    if (argv.proxy) {
        proxy = argv.proxy
    }

    getToken((data) => {
        if (data.error) {
            callback(data)
        }

        const config = {
            headers: {
                Authorization: `Bearer ${data.token}`,
                'User-Agent': 'curl/7.64.1'
            },
            proxy: proxy,
        };

        axios
            .head(validationUrl, config)
            .then((response) => {
                callback(response.headers);
            })
            .catch((error) => {
                const data = {
                    error: getErrorMessage(error)
                }

                callback(data)
            });
    })
};

const getErrorMessage = (err) => {
    if (err.response) {
        return `${err.response.status}: ${err.response.statusText}`;
    } else if (err.request) {
        return err.message;
    } else {
        return err.message;
    }
}

const getToken = (callback) => {

    let now = moment();
    const token = loadToken()
    let issuedAt = null
    let minutes = null

    if (token) {
        issuedAt = moment(token.issued_at);
        minutes = now.diff(issuedAt, 'seconds')
    }

    if (token && minutes < expiresIn) {
        callback({
            token: token.token
        });
    } else {
        axios
            .get(url, { proxy })
            .then((response) => {
                saveToken(response.data)
                callback({
                    token: response.data.token
                });
            })
            .catch((error) => {
                const data = {
                    error: getErrorMessage(error)
                }
                callback(data)
            });
    }

}

const saveToken = (token) => {
    const jsonString = JSON.stringify(token)
    fs.writeFileSync(fileName, jsonString)
}

const loadToken = () => {
    try {
        const tokenBuffer = fs.readFileSync(fileName)

        return JSON.parse(tokenBuffer.toString());
    } catch (error) {
        return null
    }
}

module.exports = {
    checkRateLimit
};