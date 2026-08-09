import { z } from "zod";

export const MessageSchema = z.object({
	role: z.enum(["system", "user", "assistant"]),
	content: z.string().min(1).max(8000),
});

export const CapabilitySchema = z.enum([
	"learn",
	"interview",
	"architecture",
	"execute",
	"grill-me",
	"verification",
	"memory",
	"safety",
]);

export const KnowledgeTopicSchema = z.enum([
	"ai-foundations",
	"rag",
	"agent-behavior",
	"mastra",
	"langchain",
	"langgraph",
	"frontend",
	"backend",
	"cloud",
	"web3",
	"training",
	"harness-engineering",
	"career",
	"cross-topic",
]);

const ReviewSchema = z.discriminatedUnion("status", [
	z.object({
		status: z.literal("draft"),
		rubricVersion: z.number().int().positive().default(2),
	}),
	z.object({
		status: z.literal("approved"),
		reviewedAt: z.iso.datetime(),
		rubricVersion: z.number().int().positive(),
	}),
	z.object({
		status: z.literal("rejected"),
		reason: z.string().min(1),
		rubricVersion: z.number().int().positive().default(2),
	}),
]);

const FormalSftExampleSchema = z
	.object({
		id: z.string().regex(/^[a-z0-9-]+$/),
		sourceIds: z.array(z.string().regex(/^sha256:[a-f0-9]{64}$/)).min(1),
		capability: CapabilitySchema,
		topic: KnowledgeTopicSchema,
		messages: z.array(MessageSchema).min(3).max(15),
		provenance: z.object({
			sourceKind: z.enum([
				"course-derived",
				"official-derived",
				"agent-authored",
				"legacy-derived",
			]),
			sourceGroup: z.string().min(1).max(160),
		}),
		legacyTopic: z
			.enum(["learn", "interview", "architecture", "execute", "refusal"])
			.optional(),
		review: ReviewSchema,
	})
	.superRefine((example, context) => {
		if (example.messages[0]?.role !== "system") {
			context.addIssue({
				code: "custom",
				path: ["messages", 0, "role"],
				message: "The first message must use the system role",
			});
		}
		for (let index = 1; index < example.messages.length; index += 1) {
			const expectedRole = index % 2 === 1 ? "user" : "assistant";
			if (example.messages[index]?.role !== expectedRole) {
				context.addIssue({
					code: "custom",
					path: ["messages", index, "role"],
					message: `Message ${index} must use the ${expectedRole} role`,
				});
			}
		}
		if (example.messages.at(-1)?.role !== "assistant") {
			context.addIssue({
				code: "custom",
				path: ["messages"],
				message: "The final message must use the assistant role",
			});
		}
	});

const LegacyTopicSchema = z.enum([
	"learn",
	"interview",
	"architecture",
	"execute",
	"refusal",
]);

const LegacyReviewSchema = z.discriminatedUnion("status", [
	z.object({ status: z.literal("draft") }),
	z.object({ status: z.literal("approved"), reviewedAt: z.iso.datetime() }),
	z.object({ status: z.literal("rejected"), reason: z.string().min(1) }),
]);

const LegacySftExampleSchema = z
	.object({
		id: z.string().regex(/^[a-z0-9-]+$/),
		sourceIds: z.array(z.string().regex(/^sha256:[a-f0-9]{64}$/)).min(1),
		topic: LegacyTopicSchema,
		messages: z.tuple([
			MessageSchema.extend({ role: z.literal("system") }),
			MessageSchema.extend({ role: z.literal("user") }),
			MessageSchema.extend({ role: z.literal("assistant") }),
		]),
		review: LegacyReviewSchema,
	})
	.transform((example) => ({
		id: example.id,
		sourceIds: example.sourceIds,
		capability:
			example.topic === "refusal" ? ("safety" as const) : example.topic,
		topic: "cross-topic" as const,
		messages: example.messages,
		provenance: {
			sourceKind: "legacy-derived" as const,
			sourceGroup: "rag-sft-20260802-v1",
		},
		legacyTopic: example.topic,
		review: { ...example.review, rubricVersion: 1 },
	}));

export const SftExampleSchema = z.union([
	FormalSftExampleSchema,
	LegacySftExampleSchema,
]);

export type Capability = z.infer<typeof CapabilitySchema>;
export type KnowledgeTopic = z.infer<typeof KnowledgeTopicSchema>;

export type SftExample = z.infer<typeof SftExampleSchema>;
export type TrainingRecord = Readonly<{ messages: SftExample["messages"] }>;
