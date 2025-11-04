/**
 * Type definitions for Grind75.json
 */

export type Problem = {
	title: string;
	link: string;
};

export type TopicProblems = {
	Easy?: Problem[];
	Medium?: Problem[];
	Hard?: Problem[];
};

export type PremiumProblems = {
	arrays?: TopicProblems;
	strings?: TopicProblems;
	graphs?: TopicProblems;
	binary_search_trees?: TopicProblems;
	queues?: TopicProblems;
	tries?: TopicProblems;
};

export type Grind75ProblemList = {
	arrays?: TopicProblems;
	strings?: TopicProblems;
	matrices?: TopicProblems;
	binary_search?: TopicProblems;
	graphs?: TopicProblems;
	binary_search_trees?: TopicProblems;
	binary_trees?: TopicProblems;
	hash_tables?: TopicProblems;
	recursion?: TopicProblems;
	linked_lists?: TopicProblems;
	stacks?: TopicProblems;
	heaps?: TopicProblems;
	tries?: TopicProblems;
	dynamic_programing?: TopicProblems;
	binary?: TopicProblems;
	math?: TopicProblems;
	premium?: PremiumProblems;
};

