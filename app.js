#!/usr/bin/env node

const chalk = require('chalk')
const yargs = require('yargs')

const rateLimit = require('./util/ratelimit')

yargs.version('1.0.0')

yargs.command('$0', 'Default command', {
    command: 'show',
    describe: 'Show docker pull rate limit',
    builder: {
        'proxy.host': {
            describe: 'proxy host',
            type: 'string'
        },
        'proxy.port': {
            describe: 'proxy port',
            type: 'string'
        }
    },
    handler: (argv) => {
        rateLimit.checkRateLimit(argv, (data) => {
            if (data.error) {
                console.log(data.error)
            } else {
                const rateLimit = data['ratelimit-remaining'].split(';')[0]
                let remaining = 'Remaining'
                let date = 'Date'
                let limit = 'Limit'
                let source = 'Source'

                if (rateLimit > 0) {
                    remaining = chalk.greenBright(`${remaining.padEnd(18, '.')}: ${rateLimit}`)
                } else {
                    remaining = chalk.red(`${remaining.padEnd(18, '.')}: ${rateLimit}`)
                }

                date = chalk.whiteBright(`${date.padEnd(18, '.')}: ${data['date']}`)
                limit = chalk.whiteBright(`${limit.padEnd(18, '.')}: ${data['ratelimit-limit'].split(';')[0]}/${data['ratelimit-limit'].split('=')[1] / 3600}h`)
                source = chalk.whiteBright(`${source.padEnd(18, '.')}: ${data['docker-ratelimit-source']}`)

                console.log(date)
                console.log(limit)
                console.log(remaining)
                console.log(source)
            }
        })
    }
})

yargs.parse()