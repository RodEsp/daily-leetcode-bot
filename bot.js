import zulipInit from 'zulip-js';

import { request } from 'graphql-request';
import cron from 'node-cron';

import { dailyCodingQuestions, problemListByCategory, questionOfTheDay } from './queries.js';
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
const timezone = process.env.DLB_TIMEZONE || 'America/New_York';
const cronSchedule = process.env.DLB_CRON_SCHEDULE || '0 10 * * *'; // See https://www.npmjs.com/package/node-cron#cron-syntax for more info
const messageReceiver = process.env.DLB_USER_ID ? [parseInt(process.env.DLB_USER_ID, 10)] : 'Daily LeetCode'; // Must be a Zulip user ID or a stream name
const messageType = process.env.DLB_USER_ID ? 'direct' : 'stream';
const messageTopic = process.env.DLB_TOPIC || 'Daily Leetcode Problem';
const slackWebhookURL = process.env.DLB_SLACK_WEBHOOK;

class LeetCodeBot {
	static async run () {
		// Schedule the task to run every day at 10:00 AM
		cron.schedule(cronSchedule, async () => {
			const date = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
			console.log(`Getting leetcode problem for ${date}`);

			try {
				const leetcode_data = (await request(`${baseLeetcodeURL}/graphql`, questionOfTheDay)).activeDailyCodingChallengeQuestion;

				// Choose problems from grind75 by selecting a random topic and then random questions for each difficulty from that topic
				const topics = Object.keys(grind75_problems).filter((topic) => topic !== '//comment' && topic !== 'premium');
				const topic = topics[Math.floor(Math.random() * (topics.length - 1))];
				const problems = Object.entries(grind75_problems[topic]).reduce((acc, [key, problems]) => {
					acc[key] = problems[Math.floor(Math.random() * problems.length)];
					return acc;
				}, {});

				const messageData = {
					date,
					problems: {
						leetcode_daily: { ...leetcode_data.question, link: leetcode_data.link },
						grind75: { topic, problems }
					}
				};

				await this.postMessageToZulip(messageData);

				if (slackWebhookURL) {
					await this.postMessageToSlack(messageData);
				}
			} catch (error) {
				console.log('Error getting problems:', error);
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
		const message = `${date}
\`Daily Question\` at [leetcode.com](https://leetcode.com/problemset/all/)
1. (${problems.leetcode_daily.difficulty}) [${problems.leetcode_daily.title}](${baseLeetcodeURL}${problems.leetcode_daily.link})

\`Grind75\` at [techinterviewhandbook.org](https://www.techinterviewhandbook.org/grind75?mode=all)
Topic is: ${problems.grind75.topic.replaceAll('_', ' ')}
${Object.entries(problems.grind75.problems).reduce((acc, [difficulty, problem]) => `${acc}1. (${difficulty}) [${problem.title}](${problem.link}})\n`, '')}
`;

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
			text: `${date} - ${problems.leetcode_daily.title}: ${baseLeetcodeURL}${problems.leetcode_daily.link}`,
			blocks: [
				{
					type: "header",
					text: {
						type: "plain_text",
						text: date
					}
				},
				{
					type: "section",
					text: {
						type: "mrkdwn",
						text: `<${baseLeetcodeURL}${problems.leetcode_daily.link}|${problems.leetcode_daily.title}> - ${problems.leetcode_daily.difficulty}`
					}
				},
				{
					type: "divider"
				},
				{
					type: "section",
					text: {
						type: "plain_text",
						text: "Tags"
					},
					accessory: {
						type: "overflow",
						options: problems.leetcode_daily.topicTags.map((tag) => ({
							text: {
								type: "plain_text",
								text: tag.name,
								emoji: true
							},
							value: tag.name
						})),
						action_id: "overflow-action"
					}
				}
			]
		};

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


export default LeetCodeBot;