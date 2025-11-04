import type { ZulipClient } from "zulip-js";
import zulipInit from "zulip-js";

export type ZulipConfig = {
	receiver: string | number[];
	type: "direct" | "stream";
	topic: string;
};

export type ZulipSetup = {
	client: ZulipClient;
	config: ZulipConfig;
};

/**
 * Validates and parses the USER_ID environment variable
 */
function parseUserId(): string | number[] {
	if (process.env.DLB_USER_ID) {
		const parsedUserId = Number.parseInt(process.env.DLB_USER_ID, 10);
		if (Number.isNaN(parsedUserId) || parsedUserId <= 0) {
			throw new Error(
				`Invalid DLB_USER_ID "${process.env.DLB_USER_ID}". Expected a positive integer.`,
			);
		}
		return [parsedUserId];
	}
	return "Daily LeetCode";
}

/**
 * Initializes and returns the Zulip client and configuration
 * Uses environment variables if available, otherwise falls back to zuliprc file
 * @returns The initialized Zulip setup with client and config
 * @throws Error if initialization fails
 */
export async function initializeZulip(): Promise<ZulipSetup> {
	try {
		let client: ZulipClient;
		if (
			process.env.ZULIP_USERNAME &&
			process.env.ZULIP_API_KEY &&
			process.env.ZULIP_REALM
		) {
			client = await zulipInit({
				username: process.env.ZULIP_USERNAME,
				apiKey: process.env.ZULIP_API_KEY,
				realm: process.env.ZULIP_REALM,
			});
		} else {
			// Use the zuliprc file for configuration instead of environment variables
			client = await zulipInit({ zuliprc: "zuliprc" });
		}

		const config: ZulipConfig = {
			receiver: parseUserId(),
			type: process.env.DLB_USER_ID ? "direct" : "stream",
			topic: process.env.DLB_TOPIC || "Daily Leetcode Problem",
		};

		return { client, config };
	} catch (error) {
		console.error("Error initializing Zulip client");
		throw error;
	}
}

