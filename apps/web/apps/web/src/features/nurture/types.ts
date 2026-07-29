export type RecordKind = "喂奶" | "睡眠" | "身高" | "体重";

export type DailyRecord = {
	id: string;
	kind: RecordKind;
	value: string;
	time: string;
};

export type GuideCategory = "全部" | "喂养" | "护理" | "疫苗" | "早教";

export type GuideItem = {
	id: string;
	category: Exclude<GuideCategory, "全部">;
	title: string;
	description: string;
};

export type Moment = {
	id: string;
	title: string;
	date: string;
	accent: "orange" | "blue" | "green";
	favorite: boolean;
};
