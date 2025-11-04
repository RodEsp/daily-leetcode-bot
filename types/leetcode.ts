/**
 * Type definitions for LeetCode GraphQL API responses
 * 
 * Modeled after this response from the LeetCode GraphQL API:
  "data": {
    "activeDailyCodingChallengeQuestion": {
      "date": "2025-11-03",
      "userStatus": "NotStart",
      "link": "/problems/minimum-time-to-make-rope-colorful/",
      "question": {
        "acRate": 65.14725344651929,
        "difficulty": "Medium",
        "freqBar": null,
        "frontendQuestionId": "1578",
        "isFavor": false,
        "paidOnly": false,
        "status": null,
        "title": "Minimum Time to Make Rope Colorful",
        "titleSlug": "minimum-time-to-make-rope-colorful",
        "hasVideoSolution": false,
        "hasSolution": true,
        "topicTags": [
          {
            "name": "Array",
            "id": "VG9waWNUYWdOb2RlOjU=",
            "slug": "array"
          },
          {
            "name": "String",
            "id": "VG9waWNUYWdOb2RlOjEw",
            "slug": "string"
          },
          {
            "name": "Dynamic Programming",
            "id": "VG9waWNUYWdOb2RlOjEz",
            "slug": "dynamic-programming"
          },
          {
            "name": "Greedy",
            "id": "VG9waWNUYWdOb2RlOjE3",
            "slug": "greedy"
          }
        ]
      }
    }
  }
*/

export type TopicTag = {
	name: string;
	id: string;
	slug: string;
};

export type LeetCodeQuestion = {
	acRate: number;
	difficulty: "Easy" | "Medium" | "Hard";
	freqBar: number | null;
	frontendQuestionId: string;
	isFavor: boolean;
	paidOnly: boolean;
	status: string | null;
	title: string;
	titleSlug: string;
	hasVideoSolution: boolean;
	hasSolution: boolean;
	topicTags: TopicTag[];
};

export type ActiveDailyCodingChallengeQuestion = {
	date: string;
	userStatus: string;
	link: string;
	question: LeetCodeQuestion;
};

export type LeetCodeGraphQLResponse = {
	data: {
		activeDailyCodingChallengeQuestion: ActiveDailyCodingChallengeQuestion;
	};
};

/**
 * Alternative API response format (from alfa-leetcode-api)
 */
export type AlfaLeetCodeApiResponse = {
	difficulty: string;
	questionTitle: string;
	questionLink: string;
};

