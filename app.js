#!/usr/bin/env node

const chalk = require("chalk");
const yargs = require("yargs");

const rateLimit = require("./util/ratelimit");

yargs.version("0.1.2");

yargs.command("$0", "Default command", {
  command: "show",
  describe: "Show docker pull rate limit",
  builder: {
    "proxy.host": {
      describe: "proxy host",
      type: "string",
    },
    "proxy.port": {
      describe: "proxy port",
      type: "string",
    },
  },
  handler: (argv) => {
    rateLimit.checkRateLimit(argv).then((data) => {
      if (data.error) {
        console.log(data.error);
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
