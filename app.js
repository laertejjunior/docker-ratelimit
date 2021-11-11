#!/usr/bin/env node

const chalk = require("chalk");
const yargs = require("yargs");
const inquirer = require("inquirer");
const package = require("./package.json");

const rateLimit = require("./util/ratelimit");

const version = package.config["version"];

yargs.version(version);

const getUserData = async () => {
    const auth = await inquirer
      .prompt([
        {
          type: "input",
          name: "username",
          message: "username",
        },
        {
          type: "password",
          message: "password",
          name: "password",
          mask: "*",
        },
      ]);

      return auth;
}

yargs.command("$0", "Default command", {
  command: "show",
  describe: "Show docker pull rate limit",
  builder: {
    "proxy.host": {
      describe: "Proxy host",
      type: "string",
    },
    "proxy.port": {
      describe: "Proxy port",
      type: "string",
    },
    authenticated: {
      describe: "Verify authenticated request limits",
      type: "boolean",
    },
    raw: {
        describe: "show raw head return",
        type: "boolean",
      },
  },
  handler: async (argv) => {
    userData = null;

    if(argv.authenticated) {
        userData = await getUserData();
    }
    
    rateLimit.checkRateLimit(userData, argv).then((data) => {
      if (data.error) {
        console.log(data.error);
      } else if(argv.raw) {
        console.log(data);
      } else {
        const ratelimitRemaining = data["ratelimit-remaining"].split(";")[0];
        const ratelimitLimit = data["ratelimit-limit"].split(";")[0];
        const limitHours = data["ratelimit-limit"].split("=")[1] / 3600;
        const dots = 20;

        let remaining = "Remaining";
        let date = "Date";
        let limit = "Limit";
        let source = "Source";

        if (ratelimitRemaining > 0) {
          remaining = chalk.greenBright(
            `${remaining.padEnd(dots, ".")}: ${ratelimitRemaining}`
          );
        } else {
          remaining = chalk.red(
            `${remaining.padEnd(dots, ".")}: ${ratelimitRemaining}`
          );
        }

        date = chalk.whiteBright(`${date.padEnd(dots, ".")}: ${data["date"]}`);

        limit = chalk.whiteBright(
          `${limit.padEnd(dots, ".")}: ${ratelimitLimit}/${limitHours}h`
        );

        source = chalk.whiteBright(
          `${source.padEnd(dots, ".")}: ${data["docker-ratelimit-source"]}`
        );

        console.log(date);
        console.log(limit);
        console.log(remaining);
        console.log(source);
      }
    });
  },
});

yargs.parse();
