import { STITCH_ASSETS } from "./stitch-assets";
import type {
	BabyProfile,
	DailyRecord,
	GuideItem,
	Moment,
	Vaccine,
} from "./types";

export const babyProfile: BabyProfile = {
	id: "baby-jinjin",
	nickname: "金金",
	birthDate: "2026-01-16",
	ageDisplay: "6个月15天",
	gender: "女",
	bloodType: "O",
	heightCm: 68,
	weightKg: 8.5,
	avatar: STITCH_ASSETS.babyProfile,
};

export const growthRecords: DailyRecord[] = [
	{
		id: "milk-1",
		kind: "喂奶",
		value: "180 ml",
		time: "今天 10:30",
		recordedAt: "2026-07-31T10:30:00-04:00",
		note: "小家伙今天胃口很好。",
	},
	{
		id: "sleep-1",
		kind: "睡眠",
		value: "1.5 hr",
		time: "今天 15:00",
		recordedAt: "2026-07-31T15:00:00-04:00",
		note: "入睡很快，中途没有惊醒。",
	},
	{
		id: "height-1",
		kind: "身高",
		value: "68 cm",
		time: "昨天 09:00",
		recordedAt: "2026-07-30T09:00:00-04:00",
	},
	{
		id: "weight-1",
		kind: "体重",
		value: "8.5 kg",
		time: "昨天 09:00",
		recordedAt: "2026-07-30T09:00:00-04:00",
	},
];

export const initialRecords = growthRecords;

export const vaccines: Vaccine[] = [
	{
		id: "pentavalent-1",
		title: "五联疫苗",
		dose: "第 1 剂",
		scheduledDate: "2026-03-16",
		status: "completed",
		reminderEnabled: false,
		sourceName: "当地免疫规划公开资料",
	},
	{
		id: "hepatitis-b-3",
		title: "乙肝疫苗",
		dose: "第 3 剂",
		scheduledDate: "2026-08-03",
		status: "upcoming",
		reminderEnabled: true,
		sourceName: "当地免疫规划公开资料",
	},
];

export const guideItems: GuideItem[] = [
	{
		id: "cold",
		category: "护理",
		title: "如何预防感冒",
		description: "换季时节，注意室内通风，适时增减衣物。",
		sourceName: "国家卫生健康委员会公开资料",
		sourceUrl:
			"https://www.nhc.gov.cn/jws/c100073/202312/ee37054edbe3496fb590d364617c02d4.shtml",
		sourceProviderId: "nhc",
		sourceAccessedAt: "2026-07-31",
		reviewedAt: "2026-07-28",
		ageRange: "0–12个月",
		disclaimer: "本文仅作育儿科普参考，不能替代医生诊断与治疗建议。",
		readingMinutes: 3,
	},
	{
		id: "pacifier",
		category: "护理",
		title: "安抚奶嘴的使用",
		description: "正确使用能有效安抚宝宝情绪，但需注意清洁。",
		sourceName: "PubMed E-utilities 公开文献索引",
		sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/?term=infant+pacifier+safety",
		sourceProviderId: "pubmed",
		sourceAccessedAt: "2026-07-31",
		reviewedAt: "2026-07-26",
		ageRange: "0–12个月",
		disclaimer: "本文仅作育儿科普参考，不能替代医生诊断与治疗建议。",
		readingMinutes: 4,
	},
	{
		id: "feeding",
		category: "喂养",
		title: "宝宝第一口辅食",
		description: "从高铁米粉开始，少量尝试并观察过敏反应。",
		body: [
			"辅食不是为了立刻替代母乳或配方奶，而是让宝宝逐步认识新的味道和质地。",
			"第一次尝试可以从单一、细腻、易吞咽的食物开始，每次只增加一种新食材。",
			"进食时让宝宝保持坐直并由成人全程陪伴，如有异常反应及时停止并咨询专业人员。",
		],
		image: STITCH_ASSETS.articleFeeding,
		sourceName: "国家卫生健康委员会公开资料",
		sourceUrl:
			"https://www.nhc.gov.cn/wjw/c100378/202502/bca60484803f4acfb6cdcfa1c054000b.shtml",
		sourceProviderId: "nhc",
		sourceAccessedAt: "2026-07-31",
		reviewedAt: "2026-07-30",
		ageRange: "约6个月起",
		disclaimer: "本文仅作育儿科普参考，不能替代医生诊断与治疗建议。",
		readingMinutes: 3,
	},
	{
		id: "play",
		category: "早教",
		title: "适合六个月宝宝的游戏",
		description: "用声音、颜色和触感陪宝宝探索新的世界。",
		sourceName: "《十万个为什么》少儿科普开放平台（候选）",
		sourceUrl: "https://platform.jcph.com/",
		sourceProviderId: "jcph",
		sourceAccessedAt: "2026-07-31",
		reviewedAt: "2026-07-24",
		ageRange: "5–8个月",
		disclaimer: "请根据宝宝实际发展情况选择活动，并由成人全程陪伴。",
		readingMinutes: 5,
	},
];

export const moments: Moment[] = [
	{
		id: "sunshine",
		title: "阳光下的温暖时光",
		date: "2026年7月28日",
		accent: "orange",
		favorite: false,
		image: STITCH_ASSETS.momentLaughing,
		description: "午后的阳光刚刚好，金金看见妈妈就笑弯了眼睛。",
		tags: ["6个月", "笑容"],
	},
	{
		id: "smile",
		title: "第一次牵住妈妈的手",
		date: "2026年7月21日",
		accent: "blue",
		favorite: false,
		image: STITCH_ASSETS.momentHands,
		description: "小小的手握得很紧，这一刻想一直记住。",
		tags: ["亲子", "第一次"],
	},
	{
		id: "toy",
		title: "金金六个月啦",
		date: "2026年7月16日",
		accent: "green",
		favorite: true,
		image: STITCH_ASSETS.momentSixMonths,
		description: "用一张小卡片记录第六个月的到来。",
		tags: ["纪念日"],
	},
	{
		id: "lullaby",
		title: "睡前的摇篮曲",
		date: "2026年7月10日",
		accent: "blue",
		favorite: false,
		image: STITCH_ASSETS.momentLullaby,
		description: "安静的夜晚，慢慢进入甜甜的梦乡。",
		tags: ["睡前"],
	},
	{
		id: "crawling",
		title: "第一次向前爬",
		date: "2026年7月05日",
		accent: "orange",
		favorite: true,
		image: STITCH_ASSETS.momentCrawling,
		description: "努力了好多次，终于向前挪动了一小步。",
		tags: ["里程碑", "第一次"],
	},
];

export const initialMoments = moments;
