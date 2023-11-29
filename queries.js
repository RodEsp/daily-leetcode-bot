import { gql } from 'graphql-request';

export const questionOfTheDay = gql`
query questionOfToday {
	activeDailyCodingChallengeQuestion {
	  date
	  userStatus
	  link
	  question {
		acRate
		difficulty
		freqBar
		frontendQuestionId: questionFrontendId
		isFavor
		paidOnly: isPaidOnly
		status
		title
		titleSlug
		hasVideoSolution
		hasSolution
		topicTags {
		  name
		  id
		  slug
		}
	  }
	}
  }`;

export const dailyCodingQuestions = gql`
query dailyCodingQuestionRecords($year: Int!, $month: Int!) {
	dailyCodingChallengeV2(year: $year, month: $month) {
	  challenges {
		date
		userStatus
		link
		question {
		  questionFrontendId
		  title
		  titleSlug
		}
	  }
	  weeklyChallenges {
		date
		userStatus
		link
		question {
		  questionFrontendId
		  title
		  titleSlug
		}
	  }
	}
  }`;


//

export const leetcodeProblemTags = [
	"Array",
	"String",
	"Hash Table",
	"Dynamic Programming",
	"Math",
	"Sorting",
	"Greedy",
	"Depth-First Search",
	"Binary Search",
	"Database",
	"Breadth-First Search",
	"Tree",
	"Matrix",
	"Two Pointers",
	"Bit Manipulation",
	"Binary Tree",
	"Heap (Priority Queue)",
	"Stack",
	"Prefix Sum",
	"Graph",
	"Simulation",
	"Design",
	"Counting",
	"Sliding Window",
	"Backtracking",
	"Union Find",
	"Linked List",
	"Enumeration",
	"Ordered Set",
	"Monotonic Stack",
	"Trie",
	"Divide and Conquer",
	"Recursion",
	"Number Theory",
	"Bitmask",
	"Queue",
	"Binary Search Tree",
	"Segment Tree",
	"Memoization",
	"Binary Indexed Tree",
	"Geometry",
	"Topological Sort",
	"Game Theory",
	"Hash Function",
	"Combinatorics",
	"Shortest Path",
	"Interactive",
	"String Matching",
	"Data Stream",
	"Rolling Hash",
	"Brainteaser",
	"Randomized",
	"Monotonic Queue",
	"Merge Sort",
	"Iterator",
	"Concurrency",
	"Doubly-Linked List",
	"Probability and Statistics",
	"Quickselect",
	"Bucket Sort",
	"Suffix Array",
	"Minimum Spanning Tree",
	"Counting Sort",
	"Shell",
	"Line Sweep",
	"Reservoir Sampling",
	"Strongly Connected Component",
	"Eulerian Circuit",
	"Radix Sort",
	"Rejection Sampling",
	"Biconnected Component",
	"Collapse"
];

/* To filter by tag the filter in this query should be (using array as an example):
	{"tags": ["array"]}
*/
export const problemListByCategory = gql`
query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
	problemsetQuestionList: questionList(
	  categorySlug: $categorySlug
	  limit: $limit
	  skip: $skip
	  filters: $filters
	) {
	  total: totalNum
	  questions: data {
		acRate
		difficulty
		freqBar
		frontendQuestionId: questionFrontendId
		isFavor
		isPaidOnly
		status
		title
		titleSlug
		topicTags {
		  name
		  id
		  slug
		}
		hasSolution
		hasVideoSolution
	  }
	}
  }`;