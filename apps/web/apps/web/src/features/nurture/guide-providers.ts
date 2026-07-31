export type GuideProvider = {
	id: "nhc" | "phda" | "jcph" | "pubmed";
	name: string;
	kind: "public-document" | "metadata-api" | "content-api" | "evidence-api";
	locale: "zh-CN" | "en";
	baseUrl: string;
	access: "public" | "approval-required";
	use: string;
};

/**
 * Future Go adapters. V1 intentionally renders reviewed local Mock content and
 * never calls these providers from the browser.
 */
export const guideProviders: GuideProvider[] = [
	{
		id: "nhc",
		name: "国家卫生健康委员会公开资料",
		kind: "public-document",
		locale: "zh-CN",
		baseUrl: "https://www.nhc.gov.cn/",
		access: "public",
		use: "中国儿童保健、喂养和预防接种口径的首要人工审核来源",
	},
	{
		id: "phda",
		name: "国家人口健康科学数据中心（PHDA）",
		kind: "metadata-api",
		locale: "zh-CN",
		baseUrl: "https://www.ncmi.cn/phda/api/dataSearch/",
		access: "approval-required",
		use: "检索国内人口健康科学数据集元数据，不直接生成医疗建议",
	},
	{
		id: "jcph",
		name: "《十万个为什么》少儿科普开放平台",
		kind: "content-api",
		locale: "zh-CN",
		baseUrl: "https://platform.jcph.com/",
		access: "approval-required",
		use: "早教和非医疗少儿科普的候选内容源",
	},
	{
		id: "pubmed",
		name: "PubMed E-utilities",
		kind: "evidence-api",
		locale: "en",
		baseUrl: "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/",
		access: "public",
		use: "补充研究文献题录与证据链接，不直接复制论文正文",
	},
];
