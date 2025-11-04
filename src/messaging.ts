import type { Message } from "../types/index.ts";
import type { ZulipSetup } from "./config.ts";
import { fetchWithRetry, random } from "./utils.ts";

const BASE_LEETCODE_URL = "https://leetcode.com";

/**
 * Posts a message to Zulip
 */
export async function postMessageToZulip(
	{ date, problems }: Message,
	setup: ZulipSetup | undefined,
): Promise<void> {
	if (!setup) {
		console.warn("Zulip client not available. Skipping Zulip message.");
		return;
	}
	const { client, config } = setup;
	let leetcode_message: string;
	if (problems.leetcode_daily) {
		leetcode_message = `1. (${problems.leetcode_daily.difficulty}) [${problems.leetcode_daily.title}](${BASE_LEETCODE_URL}${problems.leetcode_daily.link})`;
	} else {
		leetcode_message = `> There was a problem accessing the leetcode API.
> Find the daily problem on the calendar [here](https://leetcode.com/problemset/).`;
	}

	const grind75ProblemsList = Object.entries(problems.grind75.problems)
		.map(
			([difficulty, problem]) =>
				`1. (${difficulty}) [${problem.title}](${problem.link})`,
		)
		.join("\n");

	let message = `${date}
\`Daily Question\` at [leetcode.com](https://leetcode.com/problemset/all/)
${leetcode_message}

\`Grind75\` at [techinterviewhandbook.org](https://www.techinterviewhandbook.org/grind75?mode=all&grouping=topics)
Topic is: ${problems.grind75.topic.replaceAll("_", " ")}
${grind75ProblemsList}
`;

	if (problems.advent_of_code) {
		const emoji = [
			"snowflake",
			"snowman",
			"holiday_tree",
			"santa",
			"cabin-with-snow",
			"gift",
		][random(5)];

		message += `
\`Daily Puzzle\` at [adventofcode.com](https://adventofcode.com/)
:${emoji}:. [${problems.advent_of_code.title}](${problems.advent_of_code.link})
`;
	}

	console.info(
		"  Posting message to Zulip:",
		`\n    ${message.replaceAll("\n", "\n    ")}`,
	);

	const params = {
		to: config.receiver,
		type: config.type,
		topic: config.topic,
		content: message,
	};

	try {
		const response = await client.messages.send(params);
		console.info(`  Response: ${JSON.stringify(response, null, 4)}`);
	} catch (error) {
		console.error("Error posting message to Zulip:", error);
	}
}

/**
 * Posts a message to Slack
 */
export async function postMessageToSlack(
	{ date, problems }: Message,
	webhookURL: string | undefined,
): Promise<void> {
	if (!webhookURL) {
		console.error("Slack webhook URL is not configured");
		return;
	}

	const payload = {
		blocks: [
			{
				type: "header",
				text: {
					type: "plain_text",
					text: date,
				},
			},
			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: "`Daily Question` at <https://leetcode.com/problemset/all/|leetcode.com>",
					},
				],
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
										text: `${problems.leetcode_daily ? `(${problems.leetcode_daily.difficulty}) ` : "There was a problem with the Leetcode API."}`,
									},
									{
										type: "link",
										url: `${BASE_LEETCODE_URL}${problems.leetcode_daily ? problems.leetcode_daily.link : "/problemset"}`,
										text: problems.leetcode_daily
											? problems.leetcode_daily.title
											: "Find the daily problem on the calendar here",
									},
								],
							},
						],
					},
				],
			},
			{
				type: "context",
				elements: [
					{
						type: "mrkdwn",
						text: `\`Grind75\` at <https://www.techinterviewhandbook.org/grind75?mode=all&grouping=topics|techinterviewhandbook.org>
   Topic is: ${problems.grind75.topic.replaceAll("_", " ")}`,
					},
				],
			},
			{
				type: "rich_text",
				elements: [
					{
						type: "rich_text_list",
						style: "ordered",
						elements: [],
					},
				],
			},
		],
	};

	Object.entries(problems.grind75.problems).forEach(([difficulty, problem]) => {
		const problemBlock = payload.blocks[4];
		if (
			problemBlock &&
			"elements" in problemBlock &&
			Array.isArray(problemBlock.elements)
		) {
			const richTextList = problemBlock.elements[0];
			if (
				richTextList &&
				"elements" in richTextList &&
				Array.isArray(richTextList.elements)
			) {
				richTextList.elements.push({
					type: "rich_text_section",
					elements: [
						{
							type: "text",
							text: `(${difficulty}) `,
						},
						{
							type: "link",
							url: problem.link,
							text: problem.title,
						},
					],
				});
			}
		}
	});

	if (problems.advent_of_code) {
		const emoji = ["snowflake", "snowman", "christmas_tree", "santa", "gift"][
			random(4)
		];

		payload.blocks.push({
			type: "context",
			elements: [
				{
					type: "mrkdwn",
					text: "`Daily Puzzle` at <https://adventofcode.com|adventofcode.com>",
				},
			],
		});
		payload.blocks.push({
			type: "section",
			text: {
				type: "mrkdwn",
				text: `:${emoji}:. <${problems.advent_of_code.link}|${problems.advent_of_code.title}>`,
			},
		});
	}

	console.info(
		"  Posting message to Slack:",
		`\n    ${JSON.stringify(payload)}`,
	);

	try {
		const response = await fetchWithRetry(webhookURL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const result = await response.text();
		console.info("  Response:", result);
	} catch (error) {
		console.error("Error posting message to Slack:", error);
	}
}
