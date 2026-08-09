import type { ApiErrorBody } from "../contracts/github-profile";

export class AppError extends Error {
	readonly status: number;
	readonly code: string;
	readonly safeMessage: string;

	constructor(options: {
		status: number;
		code: string;
		safeMessage: string;
		cause?: unknown;
	}) {
		super(options.safeMessage);
		this.name = "AppError";
		this.status = options.status;
		this.code = options.code;
		this.safeMessage = options.safeMessage;

		if (options.cause !== undefined) {
			Object.defineProperty(this, "cause", {
				configurable: true,
				enumerable: false,
				value: options.cause,
				writable: false,
			});
		}
	}

	toResponseBody(): ApiErrorBody {
		return {
			error: {
				code: this.code,
				message: this.safeMessage,
			},
		};
	}
}
