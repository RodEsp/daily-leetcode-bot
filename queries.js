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