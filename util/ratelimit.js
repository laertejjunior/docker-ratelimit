#!/usr/bin/env node

const fs = require("fs");
const moment = require("moment");
const package = require("../package.json");
const HttpsProxyAgent = require('https-proxy-agent');

const url = package.config["token-url"];
const validationUrl = package.config["validation-url"];
const fileName = package.config["file-name"];
const expiresIn = package.config["expires-in"];

var axios = null;

const checkRateLimit = async (auth, argv) => {

    const axiosDefaultConfig = getProxyConfig(argv.proxy)
    axios = require('axios').create(axiosDefaultConfig);

    const data = await getToken(auth);

    if (data.error) {
        return data;
    }

    const config = {
        headers: {
            Authorization: `Bearer ${data.token}`,
        },
    };

    try {
        const response = await axios.head(validationUrl, config);

        return response.headers;
    } catch (error) {
        const data = {
            error: getErrorMessage(error),
        };

        return data;
    }
};

const getErrorMessage = (err) => {
    if (err.response) {
        return `${err.response.status}: ${err.response.statusText}`;
    } else if (err.request) {
        return err.message;
    } else {
        return err.message;
    }
};

const getToken = async (auth) => {
    let now = moment();
    let issuedAt = null;
    let minutes = null;

    const token = loadToken();
    if (token) {
        issuedAt = moment(token.issued_at);
        minutes = now.diff(issuedAt, "seconds");
    }

    if (!auth && token && minutes < expiresIn) {
        return {
            token: token.token,
        };
    } else {
        try {
            const response = await axios.get(url, { auth });

            if (!auth) {
                saveToken(response.data);
            }
            return {
                token: response.data.token,
            };
        } catch (error) {
            const data = {
                error: getErrorMessage(error),
            };
            return data;
        }
    }
};

const saveToken = (token) => {
    const jsonString = JSON.stringify(token);
    fs.writeFileSync(fileName, jsonString);
};

const loadToken = () => {
    try {
        const tokenBuffer = fs.readFileSync(fileName);

        return JSON.parse(tokenBuffer.toString());
    } catch (error) {
        return null;
    }
};

const getProxyConfig = (proxy) => {

    if (!proxy) {
        return null;
    }

    return axiosDefaultConfig = {
        proxy: false,
        httpsAgent: new HttpsProxyAgent(`${proxy.host}:${proxy.port}`)
    };
}

module.exports = {
    checkRateLimit,
};
