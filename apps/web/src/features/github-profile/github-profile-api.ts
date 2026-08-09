import {
	apiErrorBodySchema,
	type GitHubProfile,
	githubProfileSchema,
	type SaveGitHubProfileInput,
} from "@course-homework/api/contracts";

export interface GitHubProfileApi {
	readFromGitHub(): Promise<GitHubProfile>;
	readSaved(): Promise<GitHubProfile | null>;
	save(input: SaveGitHubProfileInput): Promise<GitHubProfile>;
}

export class ProfileApiError extends Error {
	readonly code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = "ProfileApiError";
		this.code = code;
	}
}

async function responseBody(response: Response): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		throw new ProfileApiError(
			"INVALID_RESPONSE",
			"服务器返回了无法识别的数据。",
		);
	}
}

async function readProfileResponse(response: Response): Promise<GitHubProfile> {
	const body = await responseBody(response);
	if (!response.ok) {
		const parsedError = apiErrorBodySchema.safeParse(body);
		if (parsedError.success) {
			throw new ProfileApiError(
				parsedError.data.error.code,
				parsedError.data.error.message,
			);
		}
		throw new ProfileApiError("REQUEST_FAILED", "请求暂时无法完成。");
	}

	const parsedProfile = githubProfileSchema.safeParse(body);
	if (!parsedProfile.success) {
		throw new ProfileApiError(
			"INVALID_RESPONSE",
			"服务器返回了无法识别的数据。",
		);
	}
	return parsedProfile.data;
}

export function createGitHubProfileApi(
	fetchFn: typeof fetch = fetch,
): GitHubProfileApi {
	return {
		async readFromGitHub() {
			return readProfileResponse(await fetchFn("/api/github/me"));
		},

		async readSaved() {
			const response = await fetchFn("/api/github-profile");
			if (response.status === 404) {
				const body = await responseBody(response);
				const parsed = apiErrorBodySchema.safeParse(body);
				if (parsed.success && parsed.data.error.code === "PROFILE_NOT_FOUND") {
					return null;
				}
			}
			return readProfileResponse(response);
		},

		async save(input) {
			return readProfileResponse(
				await fetchFn("/api/github-profile", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(input),
				}),
			);
		},
	};
}
