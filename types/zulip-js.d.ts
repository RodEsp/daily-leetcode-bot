/**
 * Type declarations for zulip-js
 * No publicly available types exist for this package
 */

declare module "zulip-js" {
	export type ZulipInitOptions =
		| {
				username: string;
				apiKey: string;
				realm: string;
		  }
		| {
				zuliprc: string;
		  };

	export type ZulipClient = {
		messages: {
			send: (params: {
				to: string | number[];
				type: "direct" | "stream";
				topic: string;
				content: string;
			}) => Promise<unknown>;
		};
	};

	function zulipInit(options: ZulipInitOptions): Promise<ZulipClient>;

	export default zulipInit;
}

