# Daily Leetcode Bot
> If you're a recurser, ping me on Zulip for any questions.

The Daily Leetcode Bot posts questions from [leetcode.com](https://leetcode.com) to Zulip every day.

It is primarily intended to be used for the [Recurse Center](https://recurse.com/) but it can be easily configured to post with any frequency to any Zulip instance.

## Getting Started
> To run this bot you must have [Node.js](https://nodejs.org/) installed.

### Configuration
The bot can be configured by using the following environment variables:

* Zulip
	* `ZULIP_USERNAME` - the e-mail address of your Zulip bot
	* `ZULIP_API_KEY` - the API_KEY of your Zulip bot
	* `ZULIP_REALM` - your [Zulip Realm](https://zulip.readthedocs.io/en/latest/subsystems/realms.html) or the https address of your Zulip instance
		* e.g. https://myorg.zulipchat.com
	> You can also place a [zuliprc](https://zulip.com/api/running-bots#running-a-bot) at the root of this repo.

* Bot
	* `DLB_TIMEZONE` - A timezone identifier as defined by [IANA](https://www.iana.org/) (list [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones))
	* `DLB_CRON_SCHEDULE` - A `cron` expression as defined by [node-cron](https://www.npmjs.com/package//node-cron#cron-syntax)
	* `DLB_USER_ID` - A Zulip user ID or a stream name
	* `DLB_TOPIC` - A Zulip topic name

### Running
1. Clone this repo
1. Install dependencies
	1. `npm install`
1. Start the server
	1. `npm start`

## Repo Overview

This repository is composed of three main files.
#### [server.js](./server.js)
This houses an express server that isn't really used right now but could be expanded to house an API. It's also the entry point for our bot.

#### [bot.js](./bot.js)
This is the business logic for the bot and where all the configuration gets applied.

#### [queries.js](./queries.js)
This contains GraphQL queries that can be used with the Leetcode API. Unfortunately the Leetcode API is not documented but useful information about it can be found [here](https://github.com/aylei/leetcode-rust/issues/12), [here](https://leetcode.com/discuss/general-discussion/1297705/is-there-public-api-endpoints-available-for-leetcode), and by searching the intertubez.

## Contributing

> Please read our [Code of Conduct](CODE_OF_CONDUCT.md)

### [Pull Requests](https://github.com/RodEsp/daily-leetcode-bot/pulls)
Pease create an [issue](https://github.com/RodEsp/daily-leetcode-bot/issues) if you want to submit a PR and link it to your PR with one of these [keywords](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/using-keywords-in-issues-and-pull-requests#linking-a-pull-request-to-an-issue).

### [Issues](https://github.com/RodEsp/daily-leetcode-bot/issues)
Feel free to create issues for any bugs or feature requests. If submitting a bug, please include as many details as possible. Including, but not limited to, reproduction steps, logs, and screenshots that show the problem.