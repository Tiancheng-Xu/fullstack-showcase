import { z } from "zod";

const serverEnvSchema = z.object({
	KEYCHAIN_SERVICE: z.string().min(1).default("course-homework.github-profile"),
	KEYCHAIN_ACCOUNT: z.string().min(1).default("Tiancheng-Xu"),
	DB_FILE_NAME: z.string().min(1).default("./data/github-profile.sqlite"),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function readServerEnv(
	environment: Record<string, string | undefined> = process.env,
): ServerEnv {
	return serverEnvSchema.parse(environment);
}
