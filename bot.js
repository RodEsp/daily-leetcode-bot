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

const baseUrl = 'https://leetcode.com';
const timezone = process.env.DLB_TIMEZONE || 'America/New_York';
const cronSchedule = process.env.DLB_CRON_SCHEDULE || '0 10 * * *'; // See https://www.npmjs.com/package/node-cron#cron-syntax for more info
const messageReceiver = process.env.DLB_USER_ID ? [parseInt(process.env.DLB_USER_ID, 10)] : 'Daily LeetCode'; // Must be a Zulip user ID or a stream name
const messageType = process.env.DLB_USER_ID ? 'direct' : 'stream';
const messageTopic = process.env.DLB_TOPIC || 'Daily Leetcode Problem';

class LeetCodeBot {
	static async run () {
		// Schedule the task to run every day at 10:00 AM
		cron.schedule(cronSchedule, async () => {
			const date = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
			console.log(`Getting leetcode question for ${date}`);

			try {
				const data = (await request(`${baseUrl}/graphql`, questionOfTheDay)).activeDailyCodingChallengeQuestion;

				const message = `${date}
#### [${data.question.title}](${baseUrl}${data.link}) - ${data.question.difficulty}
\`\`\`spoiler Tags
${data.question.topicTags.map((tag) => tag.name).join(', ')}
\`\`\``;

				console.log('  Posting message to Zulip:', `\n    ${message.replaceAll('\n', '\n    ')}`);
				let response = await this.postMessageToZulip(message);
				console.log(`  Response: ${JSON.stringify(response, null, 4)}`);
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

	static async postMessageToZulip (message) {
		let params = {
			to: messageReceiver,
			type: messageType,
			topic: messageTopic,
			content: message,
		};

		try {
			return await zulipClient.messages.send(params);
		} catch (error) {
			console.error('Error posting message to Zulip:', error);
		}
	}
}


export default LeetCodeBot;;;;;;