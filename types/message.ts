import type { Problem } from "./grind75.ts";

export type Message = {
	date: string;
	problems: {
		leetcode_daily?: {
			difficulty?: string;
			title?: string;
			link?: string;
		};
		grind75: {
			topic: string;
			problems: Record<string, Problem>;
		};
		advent_of_code?: {
			title: string;
			year: number;
			link: string;
		};
	};
};
