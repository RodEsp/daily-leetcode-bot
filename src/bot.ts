import cron from "node-cron";
import g75 from "../data/grind75.json" with { type: "json" };
import type {
	ActiveDailyCodingChallengeQuestion,
	AlfaLeetCodeApiResponse,
	Grind75ProblemList,
	LeetCodeGraphQLResponse,
	Message,
} from "../types/index.ts";
import { initializeZulip, type ZulipSetup } from "./config.ts";
import { questionOfTheDay } from "./graphql-queries.ts";
import { postMessageToSlack, postMessageToZulip } from "./messaging.ts";
import { fetchWithRetry, random } from "./utils.ts";

// Type assertion for the imported JSON data
const grind75Problems: Grind75ProblemList = g75 as Grind75ProblemList;

let zulipSetup: ZulipSetup | undefined;
try {
	zulipSetup = await initializeZulip();
} catch (error) {
	if (!process.env.DLB_SLACK_WEBHOOK) {
		// If there is no Slack webhook, throw the error and exit the program
		throw error;
	} else {
		// If there is a Slack webhook, continue without Zulip client
		console.info(`Will continue without Zulip client: ${error}`);
	}
}

const timezone = process.env.DLB_TIMEZONE || "Etc/UTC";
const cronSchedule = process.env.DLB_CRON_SCHEDULE || "0 0 * * *"; // See https://www.npmjs.com/package/node-cron#cron-syntax for more info
const slackWebhookURL = process.env.DLB_SLACK_WEBHOOK;

async function postMessages() {
	const date = new Date(); // '2022-12-17T10:00:00.000-05:00' <- Use this date string for testing Advent of Code functionality

	const humanReadableDateString = date.toLocaleDateString("en-US", {
		weekday: "long",
		day: "numeric",
		month: "short",
		timeZone: timezone,
	});
	console.info(`Getting leetcode problem for ${humanReadableDateString}`);

	// Fetch LeetCode daily problem - wrapped in try-catch so failures don't prevent posting
	let leetcode_data: ActiveDailyCodingChallengeQuestion | undefined;
	try {
		let response = await fetchWithRetry("https://leetcode.com/graphql", {
			method: "POST",
			headers: {
				authority: "leetcode.com",
				referer: "https://leetcode.com/problemset/",
				"Content-Type": "application/json",
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
			},
			body: JSON.stringify({
				query: questionOfTheDay,
				operationName: "questionOfToday",
			}),
		});

		if (response.ok) {
			const jsonResponse = (await response.json()) as LeetCodeGraphQLResponse;
			leetcode_data = jsonResponse.data.activeDailyCodingChallengeQuestion;
		} else {
			console.group("There was a problem fetching data from the Leetcode API.");
			console.error(response.status, response.statusText);
			console.groupCollapsed("Response body:");
			console.error(await response.text(), "\n");
			console.groupEnd();
			console.groupEnd();

			console.info("Trying alfa-leetcode-api...");
			// If we can't get the response from the leetcode API directly, try alfa-leetcode-api.
			// https://github.com/alfaArghya/alfa-leetcode-api
			response = await fetchWithRetry(
				"https://alfa-leetcode-api.onrender.com/daily",
			);

			if (response.ok) {
				const alfaResponse = (await response.json()) as AlfaLeetCodeApiResponse;
				// Structure the data in the original Leetcode API format
				const linkMatch = alfaResponse.questionLink.match(/\/problems\/.*/);
				if (!linkMatch || !linkMatch[0]) {
					throw new Error(
						`Could not extract link from alfa-leetcode-api response: ${alfaResponse.questionLink}`,
					);
				}
				const isoDate = new Date().toISOString().split("T")[0];
				if (!isoDate) {
					throw new Error("Could not generate ISO date string");
				}
				leetcode_data = {
					date: isoDate,
					userStatus: "NotStart",
					link: linkMatch[0],
					question: {
						acRate: 0,
						difficulty: alfaResponse.difficulty as "Easy" | "Medium" | "Hard",
						freqBar: null,
						frontendQuestionId: "",
						isFavor: false,
						paidOnly: false,
						status: null,
						title: alfaResponse.questionTitle,
						titleSlug: "",
						hasVideoSolution: false,
						hasSolution: false,
						topicTags: [],
					},
				};
			} else {
				console.group(
					"There was a problem fetching data from alfa-leetcode-api.",
				);
				console.error(response.status, response.statusText);
				console.groupCollapsed("Response body:");
				console.error(await response.text(), "\n");
				console.groupEnd();
				console.groupEnd();
			}
		}
	} catch (error) {
		console.warn(
			`Failed to fetch LeetCode daily problem after trying both APIs: ${error}`,
		);
		// leetcode_data remains undefined, which will trigger the fallback message
	}

	// Choose problems from grind75 by selecting a random topic and then random questions for each difficulty from that topic
	const topics = Object.keys(grind75Problems).filter(
		(topic) => topic !== "//comment" && topic !== "premium",
	) as Array<keyof Omit<Grind75ProblemList, "//comment" | "premium">>;
	const topic = topics[random(topics.length - 1)];
	const topicData = grind75Problems[topic];
	const problems: Record<string, { title: string; link: string }> =
		Object.entries(topicData ?? {}).reduce(
			(acc, [key, problemList]) => {
				if (
					problemList &&
					Array.isArray(problemList) &&
					problemList.length > 0
				) {
					acc[key] = problemList[random(problemList.length - 1)];
				}
				return acc;
			},
			{} as Record<string, { title: string; link: string }>,
		);

	const messageData: Message = {
		date: humanReadableDateString,
		problems: {
			leetcode_daily: {
				...leetcode_data?.question,
				link: leetcode_data?.link,
			},
			grind75: { topic, problems },
		},
	};

	if (leetcode_data === undefined) {
		messageData.problems.leetcode_daily = undefined;
	}

	// Get the problem of the day from Advent of Code if the current date is between Dec 1st and Dec 25th
	const currentYear = date.getFullYear();
	const dec_1st = new Date(`${currentYear}-12-01T00:00:00.000-05:00`); // Get date for Dec 1st EST
	const dec_26th = new Date(`${currentYear}-12-26T00:00:00.000-05:00`); // Get date for Dec 26th EST
	if (date >= dec_1st && date < dec_26th) {
		try {
			const aoc_link = `https://adventofcode.com/${currentYear}/day/${date.getDate()}`;
			const response = await fetchWithRetry(aoc_link);
			if (!response.ok) {
				throw new Error(
					`${aoc_link} returned: ${response.status} ${response.statusText}`,
				);
			}
			const aoc_html = await response.text();
			const match = aoc_html.match(/<h2>(.*)<\/h2>/);
			const title =
				match?.[1]?.replace(/---/g, "").trim() ??
				`Advent of Code ${currentYear} - Day ${date.getDate()}`;

			messageData.problems.advent_of_code = {
				title,
				year: currentYear,
				link: aoc_link,
			};
		} catch (error) {
			console.group(
				`There was a problem getting the Advent of Code problem for ${humanReadableDateString}`,
			);
			console.error(error);
			console.groupEnd();
		}
	}

	try {
		await postMessageToZulip(messageData, zulipSetup);
		await postMessageToSlack(messageData, slackWebhookURL);
	} catch (error) {
		console.group(
			`There was a problem posting the messages for ${humanReadableDateString}`,
		);
		console.error(error);
		console.groupEnd();
	}
}

async function run() {
	const cronTask = cron.schedule(cronSchedule, postMessages, {
		scheduled: true,
		timezone,
	});

	console.info(`Daily Leetcode Bot is running and will post to Zulip with the following configuration:
		Schedule(cron): ${cronSchedule}
		Recipient: ${zulipSetup?.config.receiver ?? "N/A"}
		Topic: ${zulipSetup?.config.topic ?? "N/A"}
		Timezone: ${timezone}`);

	// Set up graceful shutdown handlers
	const shutdown = (signal: string) => {
		console.info(`\nReceived ${signal}. Shutting down gracefully...`);
		cronTask.stop();
		console.info("Cron job stopped. Exiting.");
		process.exit(0);
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));

	// Handle uncaught exceptions
	process.on("uncaughtException", (error) => {
		console.error("Uncaught Exception:", error);
		cronTask.stop();
		process.exit(1);
	});

	// Handle unhandled promise rejections
	process.on("unhandledRejection", (reason, promise) => {
		console.error("Unhandled Rejection at:", promise, "reason:", reason);
		cronTask.stop();
		process.exit(1);
	});
}

run();
