import type { DailyRecord, GuideItem, Moment } from "./types";

export const initialRecords: DailyRecord[] = [
	{ id: "milk-1", kind: "喂奶", value: "180 ml", time: "2小时前" },
	{ id: "sleep-1", kind: "睡眠", value: "3 h", time: "今日总计" },
];

export const guideItems: GuideItem[] = [
	{
		id: "cold",
		category: "护理",
		title: "如何预防感冒",
		description: "换季时节，注意室内通风，适时增减衣物。",
	},
	{
		id: "pacifier",
		category: "护理",
		title: "安抚奶嘴的使用",
		description: "正确使用能有效安抚宝宝情绪，但需注意清洁。",
	},
	{
		id: "feeding",
		category: "喂养",
		title: "宝宝第一口辅食",
		description: "从高铁米粉开始，少量尝试并观察过敏反应。",
	},
	{
		id: "play",
		category: "早教",
		title: "适合六个月宝宝的游戏",
		description: "用声音、颜色和触感陪宝宝探索新的世界。",
	},
];

export const initialMoments: Moment[] = [
	{
		id: "sunshine",
		title: "阳光下的温暖时光",
		date: "2023年10月15日",
		accent: "orange",
		favorite: false,
	},
	{
		id: "smile",
		title: "今天笑得特别甜",
		date: "10月12日",
		accent: "blue",
		favorite: false,
	},
	{
		id: "toy",
		title: "第一次抓住小玩具",
		date: "10月08日",
		accent: "green",
		favorite: true,
	},
];
