#!/usr/bin/env node

const fs = require("fs");
const moment = require("moment");
const package = require("../package.json");
const HttpsProxyAgent = require('https-proxy-agent');

const url = package.config["token-url"];
const validationUrl = package.config["validation-url"];
const fileName = package.config["file-name"];
const expiresIn = package.config["expires-in"];

var proxy = null;
var auth = null;


const checkRateLimit = async (user, argv) => {
  if (argv.proxy) {
    proxy = argv.proxy;
  }

  auth = user;

  const data = await getToken();

  if (data.error) {
    return data;
  }

  const config = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  };

  try {

    const response = await getAxios().head(validationUrl, config);

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

const getToken = async () => {
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
      const response = await getAxios().get(url, { auth });
      
      if(!auth) {
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

const getProxyConfig = () => {
   
    if(!proxy) {
        return null;
    }

    return axiosDefaultConfig = {
        proxy: false,
        httpsAgent: new HttpsProxyAgent(`${proxy.host}:${proxy.port}`)
    };
}

const getAxios = () => {
    const axiosDefaultConfig = getProxyConfig()
    const axios = require ('axios').create(axiosDefaultConfig);
    
    return axios;
}

module.exports = {
  checkRateLimit,
};
