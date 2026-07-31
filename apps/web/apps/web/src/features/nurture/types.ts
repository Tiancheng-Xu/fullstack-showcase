export type RecordKind = "喂奶" | "睡眠" | "身高" | "体重";

export type DailyRecord = {
	id: string;
	kind: RecordKind;
	value: string;
	time: string;
	recordedAt?: string;
	note?: string;
	image?: string;
};

export type GuideCategory = "全部" | "喂养" | "护理" | "疫苗" | "早教";

export type GuideItem = {
	id: string;
	category: Exclude<GuideCategory, "全部">;
	title: string;
	description: string;
	body?: string[];
	image?: string;
	sourceName: string;
	sourceUrl: string;
	sourceProviderId: "nhc" | "phda" | "jcph" | "pubmed";
	sourceAccessedAt: string;
	reviewedAt?: string;
	ageRange?: string;
	disclaimer?: string;
	readingMinutes?: number;
};

export type Moment = {
	id: string;
	title: string;
	date: string;
	accent: "orange" | "blue" | "green";
	favorite: boolean;
	image?: string;
	description?: string;
	tags?: string[];
};

export type BabyProfile = {
	id: string;
	nickname: string;
	birthDate: string;
	ageDisplay: string;
	gender: "女" | "男" | "暂不填写";
	bloodType: "A" | "B" | "AB" | "O" | "未知";
	heightCm: number;
	weightKg: number;
	avatar: string;
};

export type Vaccine = {
	id: string;
	title: string;
	dose: string;
	scheduledDate: string;
	status: "upcoming" | "completed";
	reminderEnabled: boolean;
	sourceName: string;
};
