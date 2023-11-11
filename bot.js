import zulipInit from 'zulip-js';

import { request } from 'graphql-request';
import cron from 'node-cron';

import { dailyCodingQuestions, problemListByCategory, questionOfTheDay } from './queries.js';

// Use { zuliprc: 'zuliprc' } as a config object to use the zuliprc file instead of environment variables
const zulipClient = await zulipInit({
	username: process.env.ZULIP_USERNAME,
	apiKey: process.env.ZULIP_API_KEY,
	realm: process.env.ZULIP_REALM,
});

const baseUrl = 'https://leetcode.com';
const timezone = "America/New_York";

class LeetCodeBot {
	static async run () {
		// Schedule the task to run every day at 10:00 AM
		cron.schedule('0 10 * * *', async () => {
			const date = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', timeZone: timezone });
			console.log(`Getting leetcode question for ${date}`);

			try {
				const data = (await request(`${baseUrl}/graphql`, questionOfTheDay)).activeDailyCodingChallengeQuestion;

				const message = `${date}
### [${data.question.title}](${baseUrl}${data.link})
> (${data.question.difficulty}) | ${data.question.topicTags.map((tag) => tag.name).join(', ')}`;

				await this.postMessageToZulip(message);

				console.log('Successfully posted message to Zulip.', message);
			} catch (error) {
				console.log('Error fetching the problem of the day:', error);
			}
		}, {
			scheduled: true,
			timezone
		});

		console.log(`Started successfully. Will post to Zulip everyday at 10 am, ${timezone} timezone`);
	}

	static async postMessageToZulip (message) {
		let params = {
			to: 'Daily LeetCode',
			type: 'stream',
			topic: "Daily Leetcode Problem",
			content: message,
		};

		try {
			console.log(await zulipClient.messages.send(params));
		} catch (error) {
			console.error('Error posting message:', error);
		}
	}
}


export default LeetCodeBot;