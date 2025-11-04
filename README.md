<p align="center">
	<img width="200px" height="200px" src="https://github.com/RodEsp/daily-leetcode-bot/assets/1084688/30e9f79f-0b6a-4691-8537-77f892c635bf">
</p>

# Daily Leetcode Bot 
> If you're a recurser, ping me on Zulip for any questions. <br/>
> If you're a vertical flat plate, ping me on Slack for any questions.

The Daily Leetcode Bot can post questions from [leetcode.com](https://leetcode.com) to Zulip or Slack every day.

It is primarily intended to be used for the [Recurse Center](https://recurse.com/) but it can be easily configured to post with any frequency to any Zulip realm or Slack workspace.

## Getting Started
> To run this bot you must have [Node.js](https://nodejs.org/) v24.0.0 or higher installed.

### Configuration
The bot can be configured by using the following environment variables:

* Zulip
	* `ZULIP_USERNAME` - the e-mail address of your Zulip bot
	* `ZULIP_API_KEY` - the API_KEY of your Zulip bot
	* `ZULIP_REALM` - your [Zulip Realm](https://zulip.readthedocs.io/en/latest/subsystems/realms.html) or the https address of your Zulip instance
		* e.g. https://myorg.zulipchat.com
	> You can also place a [zuliprc](https://zulip.com/api/configuring-python-bindings#download-a-zuliprc-file) at the root of this repo.

* Slack
	* `DLB_SLACK_WEBHOOK` - the webhook URL for an [incoming webhook](https://api.slack.com/messaging/webhooks)

* Bot
	* `DLB_TIMEZONE` - A timezone identifier as defined by [IANA](https://www.iana.org/) (list [here](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones))
	* `DLB_CRON_SCHEDULE` - A `cron` expression as defined by [node-cron](https://www.npmjs.com/package//node-cron#cron-syntax)
	* `DLB_USER_ID` - A Zulip user ID or a stream name
	* `DLB_TOPIC` - A Zulip topic name

### Running
1. Clone this repo
1. Install dependencies
	1. `npm install`
1. Run the bot
	1. `npm start`

## Repo Overview

This repository is organized into the following structure:

### Source Files (`src/`)

#### [bot.ts](./src/bot.ts)
The main entry point and orchestration logic. Handles:
- Cron job scheduling
- Fetching LeetCode daily problems (with fallback to alfa-leetcode-api)
- Selecting random Grind75 problems
- Fetching Advent of Code problems (during December)
- Coordinating message posting
- Graceful shutdown handling

#### [config.ts](./src/config.ts)
Zulip client initialization and configuration management. Validates and parses environment variables for Zulip setup.

#### [messaging.ts](./src/messaging.ts)
Message posting logic for both Zulip and Slack. Formats messages with LeetCode, Grind75, and Advent of Code problems.

#### [utils.ts](./src/utils.ts)
Utility functions including:
- `fetchWithRetry()` - HTTP requests with exponential backoff retry logic
- `random()` - Random number generation helper

#### [graphql-queries.ts](./src/graphql-queries.ts)
GraphQL queries for the LeetCode API. <br/>
Unfortunately the LeetCode API is not documented but useful information about it can be found [here](https://github.com/aylei/leetcode-rust/issues/12), [here](https://leetcode.com/discuss/general-discussion/1297705/is-there-public-api-endpoints-available-for-leetcode), and by searching the intertubez.

### Type Definitions (`types/`)

TypeScript type definitions for:
- LeetCode API responses (`leetcode.ts`)
- Grind75 problem data structure (`grind75.ts`)
- Message data structure (`message.ts`)
- Zulip-js module declarations (`zulip-js.d.ts`)

### Data Files (`data/`)

#### [grind75.json](./data/grind75.json)
A JSON dataset containing the problems found [here](https://www.techinterviewhandbook.org/grind75?mode=all&grouping=topics) which were compiled by the talented [@yangshun](https://github.com/yangshun/tech-interview-handbook).

## Contributing

> Please read our [Code of Conduct](CODE_OF_CONDUCT.md)

### [Pull Requests](https://github.com/RodEsp/daily-leetcode-bot/pulls)
Please create an [issue](https://github.com/RodEsp/daily-leetcode-bot/issues) if you want to submit a PR and link it to your PR with one of these [keywords](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/using-keywords-in-issues-and-pull-requests#linking-a-pull-request-to-an-issue).

### [Issues](https://github.com/RodEsp/daily-leetcode-bot/issues)
Feel free to create issues for any bugs or feature requests. If submitting a bug, please include as many details as possible. Including, but not limited to, reproduction steps, logs, and screenshots that show the problem.

## TODO

Future improvements and enhancements:

- [ ] **Structured Logging**: Replace `console.log/error/warn` with a structured logging for better log parsing and production observability
- [ ] **Permanent Logs**: Log to a file so we can debug if the server crashes
- [ ] **Health Check Endpoint**: Add a simple HTTP server with a health check endpoint for monitoring and alerting
- [ ] **Error Handling Consistency**: Standardize error handling patterns across the codebase for consistent error visibility
- [ ] **Message Posting Retry Logic**: Add retry logic with exponential backoff for message posting failures to prevent silent message loss
- [ ] **Response Validation**: Add runtime validation for API responses (e.g., using Zod) to handle unexpected API response structures gracefully
- [ ] **Test Suite**: Add unit and integration tests for critical paths (fetchWithRetry, message formatting, etc.)
- [ ] **Rate Limiting**: Add rate limiting considerations or documentation for API usage to prevent hitting API rate limits
- [ ] **Type Safety Improvements**: Add runtime type validation for type assertions (e.g., difficulty levels) to catch unexpected API values early
