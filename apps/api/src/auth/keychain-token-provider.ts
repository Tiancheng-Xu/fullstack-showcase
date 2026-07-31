import { execFile } from "node:child_process";
import { AppError } from "../errors/app-error";

export interface GitHubTokenProvider {
	getToken(): Promise<string | undefined>;
}

export interface KeychainTokenProviderOptions {
	service: string;
	account: string;
	execFileFn?: typeof execFile;
}

export function createMacOSKeychainTokenProvider({
	service,
	account,
	execFileFn = execFile,
}: KeychainTokenProviderOptions): GitHubTokenProvider {
	return {
		getToken: () =>
			new Promise((resolve, reject) => {
				execFileFn(
					"/usr/bin/security",
					["find-generic-password", "-s", service, "-a", account, "-w"],
					{ encoding: "utf8", maxBuffer: 4096 },
					(error, stdout) => {
						if (error) {
							const code = (error as { code?: number | string }).code;
							if (code === 44 || code === "44") {
								resolve(undefined);
								return;
							}

							reject(
								new AppError({
									status: 503,
									code: "GITHUB_CREDENTIAL_UNAVAILABLE",
									safeMessage: "GitHub credential is temporarily unavailable.",
									cause: error,
								}),
							);
							return;
						}

						const token = stdout.trim();
						resolve(token.length > 0 ? token : undefined);
					},
				);
			}),
	};
}
