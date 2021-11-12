#!/usr/bin/env node

const package = require("../package.json");
const HttpsProxyAgent = require('https-proxy-agent');
const url = package.config["token-url"];
const validationUrl = package.config["validation-url"];

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

    const rateLimitInfo = await getRaleLimitInfo(config);

    return rateLimitInfo;
};

const getToken = async (auth) => {
    try {
        const response = await axios.get(url, { auth });

        return {
            token: response.data.token,
        };
    } catch (error) {
        const data = {
            error: getErrorMessage(error),
        };
        return data;
    }
};

const getRaleLimitInfo = async (config) => {
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

const getProxyConfig = (proxy) => {

    if (!proxy) {
        return null;
    }

    return axiosDefaultConfig = {
        proxy: false,
        httpsAgent: new HttpsProxyAgent(`${proxy.host}:${proxy.port}`)
    };
}

const getErrorMessage = (err) => {
    if (err.response) {
        return `${err.response.status}: ${err.response.statusText}`;
    } else if (err.request) {
        return err.message;
    } else {
        return err.message;
    }
};


module.exports = {
    checkRateLimit,
};
