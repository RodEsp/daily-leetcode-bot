import cron from 'node-cron';
import fetchCookie from 'fetch-cookie'
import zulipInit from 'zulip-js';


import { questionOfTheDay } from './queries.js';
import grind75_problems from './Grind75.json' assert { type: 'json' };

let zulipClient;
if (process.env.ZULIP_USERNAME && process.env.ZULIP_API_KEY && process.env.ZULIP_REALM) {
	zulipClient = await zulipInit({
		username: process.env.ZULIP_USERNAME,
		apiKey: process.env.ZULIP_API_KEY,
		realm: process.env.ZULIP_REALM,
	});
} else {
	// Use the zuliprc file for configuration instead of environment variables
	zulipClient = await zulipInit({ zuliprc: 'zuliprc' });
}

const baseLeetcodeURL = 'https://leetcode.com';
const timezone = process.env.DLB_TIMEZONE || 'Etc/UTC';
const cronSchedule = process.env.DLB_CRON_SCHEDULE || '0 0 * * *'; // See https://www.npmjs.com/package/node-cron#cron-syntax for more info
const messageReceiver = process.env.DLB_USER_ID ? [parseInt(process.env.DLB_USER_ID, 10)] : 'Daily LeetCode'; // Must be a Zulip user ID or a stream name
const messageType = process.env.DLB_USER_ID ? 'direct' : 'stream';
const messageTopic = process.env.DLB_TOPIC || 'Daily Leetcode Problem';
const slackWebhookURL = process.env.DLB_SLACK_WEBHOOK;

// Fetch with a cookie jar scoped to the client object.
const fetch_with_cookies = fetchCookie(fetch);

class LeetCodeBot {
	static async run () {
		// Schedule the task to run every day at 10:00 AM
		cron.schedule(cronSchedule, async () => {
			const date = new Date(); // '2022-12-17T10:00:00.000-05:00' <- Use this date string for testing Advent of Code functionality

			const humanReadableDateString = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
			console.log(`Getting leetcode problem for ${humanReadableDateString}`);

			try {
				const response = await fetch_with_cookies('https://leetcode.com/graphql', {
					method: 'POST',
					headers: {
						referer: 'https://leetcode.com/problemset/',
						'Content-Type': 'application/json',
					},
					body: `{"query":"${questionOfTheDay}","operationName":"questionOfToday"}`
				});

				let leetcode_data;
				if (response.ok) {
					leetcode_data = (await response.json()).activeDailyCodingChallengeQuestion;
				} else {
					console.error('There was a problem fetching data from the Leetcode API.');
					console.error(await response.text());
				}

				// Choose problems from grind75 by selecting a random topic and then random questions for each difficulty from that topic
				const topics = Object.keys(grind75_problems).filter((topic) => topic !== '//comment' && topic !== 'premium');
				const topic = topics[random(topics.length - 1)];
				const problems = Object.entries(grind75_problems[topic]).reduce((acc, [key, problems]) => {
					acc[key] = problems[random(problems.length - 1)];
					return acc;
				}, {});

				const messageData = {
					date: humanReadableDateString,
					problems: {
						leetcode_daily: { ...leetcode_data?.question, link: leetcode_data?.link },
						grind75: { topic, problems }
					}
				};

				if (leetcode_data === undefined) {
					messageData.problems.leetcode_daily = undefined;
				}

				// Get the problem of the day from Advent of Code if the current date is between Dec 1st and Dec 25th
				const currentYear = date.getFullYear();
				const dec_1st = new Date(`${currentYear}-12-01T00:00:00.000-05:00`); // Get date for Dec 1st EST
				const dec_26th = new Date(`${currentYear}-12-26T00:00:00.000-05:00`); // Get date for Dec 26th EST
				if (date >= dec_1st && date < dec_26th) {
					const aoc_link = `https://adventofcode.com/${currentYear}/day/${date.getDate()}`; // 
					const aoc_html = await (await fetch(aoc_link)).text();
					const title = aoc_html.match(/<h2>(.*)<\/h2>/)[1].replace(/---/g, '').trim();

					messageData.problems.advent_of_code = { title, year: currentYear, link: aoc_link };
				}

				await this.postMessageToZulip(messageData);

				if (slackWebhookURL) {
					await this.postMessageToSlack(messageData);
				}
			} catch (error) {
				console.group('Error getting problems:');
				if (error.response?.headers) {
					console.error(error.response.status);
					// console.group('Response Headers');
					// console.error(error.response.headers);
					console.groupEnd();
				} else {
					console.error(error);
				}
				console.groupEnd();
			}
		}, {
			scheduled: true,
			timezone
		});

		console.log(`Daily Leetcode Bot is running and will post to Zulip with the following configuration:
		Schedule(cron): ${cronSchedule}
		Recipient: ${messageReceiver}
		Topic: ${messageTopic}
		Timezone: ${timezone}`);
	}

	static async postMessageToZulip ({ date, problems }) {
		let leetcode_message;
		if (problems.leetcode_daily) {
			leetcode_message = `1. (${problems.leetcode_daily.difficulty}) [${problems.leetcode_daily.title}](${baseLeetcodeURL}${problems.leetcode_daily.link})`
		} else {
			leetcode_message = `> There was a problem accessing the leetcode API.
> Find the daily problem on the calenadar [here](https://leetcode.com/problemset/).`
		}

		let message = `${date}
\`Daily Question\` at [leetcode.com](https://leetcode.com/problemset/all/)
${leetcode_message}

\`Grind75\` at [techinterviewhandbook.org](https://www.techinterviewhandbook.org/grind75?mode=all&grouping=topics)
Topic is: ${problems.grind75.topic.replaceAll('_', ' ')}
${Object.entries(problems.grind75.problems).reduce((acc, [difficulty, problem]) => `${acc}1. (${difficulty}) [${problem.title}](${problem.link})\n`, '')}
`;

		if (problems.advent_of_code) {
			const emoji = ['snowflake', 'snowman', 'holiday_tree', 'santa', 'cabin-with-snow', 'gift'][random(5)];

			message += `
\`Daily Puzzle\` at [adventofcode.com](https://adventofcode.com/)
:${emoji}:. [${problems.advent_of_code.title}](${problems.advent_of_code.link})
`;
		}

		console.log('  Posting message to Zulip:', `\n    ${message.replaceAll('\n', '\n    ')}`);

		let params = {
			to: messageReceiver,
			type: messageType,
			topic: messageTopic,
			content: message,
		};

		try {
			const response = await zulipClient.messages.send(params);
			console.log(`  Response: ${JSON.stringify(response, null, 4)}`);
		} catch (error) {
			console.error('Error posting message to Zulip:', error);
		}
	}

	static async postMessageToSlack ({ date, problems }) {
		const payload = {
			blocks: [
				{
					type: "header",
					text: {
						type: "plain_text",
						text: date
					}
				},
				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: "`Daily Question` at <https://leetcode.com/problemset/all/|leetcode.com>"
						}
					]
				},
				{
					type: "rich_text",
					elements: [
						{
							type: "rich_text_list",
							style: "ordered",
							elements: [
								{
									type: "rich_text_section",
									elements: [
										{
											type: "text",
											text: `${problems.leetcode_daily ? `(${problems.leetcode_daily.difficulty})` : 'There was a problem with the Leetcode API\n'}`
										},
										{
											type: "link",
											url: `${baseLeetcodeURL}${problems.leetcode_daily ? problems.leetcode_daily.link : '/problemset'}`,
											text: problems.leetcode_daily ? problems.leetcode_daily.title : 'Find the daily problem on the calenadar here',
										}
									]
								}
							]
						}
					]
				},
				{
					type: "context",
					elements: [
						{
							type: "mrkdwn",
							text: `\`Grind75\` at <https://www.techinterviewhandbook.org/grind75?mode=all&grouping=topics|techinterviewhandbook.org>
   Topic is: ${problems.grind75.topic.replaceAll('_', ' ')}`
						}
					]
				},
				{
					type: "rich_text",
					elements: [
						{
							type: "rich_text_list",
							style: "ordered",
							elements: []
						}
					]
				}
			]
		};

		Object.entries(problems.grind75.problems).forEach(([difficulty, problem]) => {
			payload.blocks[4].elements[0].elements.push({
				type: "rich_text_section",
				elements: [{
					"type": "text",
					"text": `(${difficulty}) `
				}, {
					"type": "link",
					"url": problem.link,
					"text": problem.title,
				}]
			});
		});

		if (problems.advent_of_code) {
			const emoji = ['snowflake', 'snowman', 'christmas_tree', 'santa', 'gift'][random(4)];

			payload.blocks.push({
				"type": "context",
				"elements": [
					{
						"type": "mrkdwn",
						"text": "`Daily Puzzle` at <https://adventofcode.com|adventofcode.com>"
					}
				]
			});
			payload.blocks.push({
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": `:${emoji}:. <${problems.advent_of_code.link}|${problems.advent_of_code.title}>`
				}
			});
		}

		console.log('  Posting message to Slack:', `\n    ${JSON.stringify(payload)}`);

		try {
			const response = await fetch(slackWebhookURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			const result = await response.text();
			console.log('  Response:', result);
		} catch (error) {
			console.error('Error posting message to Slack:', error);
		}
	}
}

/**
 * Returns a random number from 0 to max
 * @type {(max: number) => number}
 */
const random = (max) => Math.floor(Math.random() * (max + 1));

LeetCodeBot.run();
