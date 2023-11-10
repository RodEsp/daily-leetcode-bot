import zulipInit from 'zulip-js';

import { request } from 'graphql-request';
import cron from 'node-cron';

import { dailyCodingQuestions, problemListByCategory, questionOfTheDay } from './queries.js';

const baseUrl = 'https://leetcode.com';

const zulipClient = await zulipInit({ zuliprc: 'zuliprc' });

class LeetCodeBot {
	static async run () {
		// Schedule the task to run every day at 10:00 AM
		cron.schedule('0 10 * * *', async () => {
			console.log('Getting leetcode questions for today');

			try {
				const data = (await request(`${baseUrl}/graphql`, questionOfTheDay)).activeDailyCodingChallengeQuestion;

				const message = `${new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
### [${data.question.title}](${baseUrl}${data.link})
> (${data.question.difficulty}) | ${data.question.topicTags.map((tag) => tag.name).join(', ')}`;

				await this.postMessageToZulip(message);
			} catch (error) {
				console.log('Error fetching the problem of the day:', error);
			}
		});
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