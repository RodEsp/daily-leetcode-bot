import zulipInit from 'zulip-js';

import { request } from 'graphql-request';
import cron from 'node-cron';

import { dailyCodingQuestions, problemListByCategory, questionOfTheDay } from './queries.js';

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
			console.log(`Getting leetcode question for ${date}`);

			try {
				const data = (await request(`${baseLeetcodeURL}/graphql`, questionOfTheDay)).activeDailyCodingChallengeQuestion;
				const messageDate = { date, question: { ...data.question, link: data.link } };

				await this.postMessageToZulip(messageDate);

				if (slackWebhookURL) {
					await this.postMessageToSlack(messageDate);
				}
			} catch (error) {
				console.log('Error fetching the problem of the day:', error);
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

	static async postMessageToZulip ({ date, question }) {
		const message = `${date}
#### [${question.title}](${baseLeetcodeURL}${question.link}) - ${question.difficulty}
\`\`\`spoiler Tags
${question.topicTags.map((tag) => tag.name).join(', ')}
\`\`\``;

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

	static async postMessageToSlack ({ date, question }) {
		const payload = {
			text: `${date} - ${question.title}: ${baseLeetcodeURL}${question.link}`,
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
						text: `<${baseLeetcodeURL}${question.link}|${question.title}> - ${question.difficulty}`
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
						options: question.topicTags.map((tag) => ({
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