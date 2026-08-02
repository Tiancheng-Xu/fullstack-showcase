import { z } from "zod";

export const MessageSchema = z.object({
	role: z.enum(["system", "user", "assistant"]),
	content: z.string().min(1).max(8000),
});

export const SftExampleSchema = z.object({
	id: z.string().regex(/^[a-z0-9-]+$/),
	sourceIds: z.array(z.string().regex(/^sha256:[a-f0-9]{64}$/)).min(1),
	topic: z.enum(["learn", "interview", "architecture", "execute", "refusal"]),
	messages: z.tuple([
		MessageSchema.extend({ role: z.literal("system") }),
		MessageSchema.extend({ role: z.literal("user") }),
		MessageSchema.extend({ role: z.literal("assistant") }),
	]),
	review: z.discriminatedUnion("status", [
		z.object({ status: z.literal("draft") }),
		z.object({ status: z.literal("approved"), reviewedAt: z.iso.datetime() }),
		z.object({ status: z.literal("rejected"), reason: z.string().min(1) }),
	]),
});

export type SftExample = z.infer<typeof SftExampleSchema>;
export type TrainingRecord = Readonly<{ messages: SftExample["messages"] }>;
