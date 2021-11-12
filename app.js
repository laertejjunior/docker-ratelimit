#!/usr/bin/env node

const chalk = require("chalk");
const yargs = require("yargs");
const inquirer = require("inquirer");
const package = require("./package.json");
const rateLimit = require("./util/ratelimit");
const ora = require("ora");

const version = package["version"];

yargs.version(version);

const getAuth = async () => {
  const auth = await inquirer.prompt([
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
};

yargs
  .scriptName("docker-ratelimit")
  .usage("$0 [args]")
  .command(
    "$0",
    "Show docker pull rate limit",
    {
      "proxy.host": {
        alias: 'h',
        describe: "Proxy host",
        type: "string",
      },
      "proxy.port": {
        alias: 'p',
        describe: "Proxy port",
        type: "string",
      },
      authenticated: {
        alias: 'a',
        describe: "Verify authenticated request limits",
        type: "boolean",
      },
      raw: {
        alias: 'r',
        describe: 'show raw head return',
        type: 'boolean',
      },
    },
    async (argv) => {
      auth = null;

      if (argv.authenticated) {
        auth = await getAuth();
      }
      console.clear();

      showResult(auth, argv);
    }
  );

const showResult = (auth, argv) => {
  const spinner = ora("Loading data...").start();
  rateLimit.checkRateLimit(auth, argv).then((data) => {
    if (data.error) {
      spinner.fail(data.error);
    } else if (argv.raw) {
      spinner.succeed("Done");
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

      spinner.succeed("Done");
      console.log(date);
      console.log(limit);
      console.log(remaining);
      console.log(source);
    }
  });
};

yargs.parse();
