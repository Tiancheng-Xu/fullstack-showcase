import { useState } from "react";
import overreactedNote from "./content/overreacted-reading-route.md?raw";
import { conferenceEntries } from "./sharing-data";
import { overreactedArticleSummaries } from "./overreacted-article-summaries";

type Topic = "all" | "conference" | "v8" | "overreacted";

type Article = {
  title: string;
  group: string;
  summary?: string;
  status: string;
  original: string;
  note?: string;
};

export const v8Articles: Article[] = [
  { title: "Sparkplug — a non-optimizing JavaScript compiler", group: "执行分层", status: "V8 官方文章 · 2021", original: "https://v8.dev/blog/sparkplug", summary: "从 Ignition 字节码快速生成机器码，以低编译成本去掉解释器分派开销；兼容解释器的栈帧便于调试和层级切换。" },
  { title: "Maglev - V8’s Fastest Optimizing JIT", group: "执行分层", status: "V8 官方文章 · 2023", original: "https://v8.dev/blog/maglev", summary: "位于 Sparkplug 与 TurboFan 之间，利用运行反馈与 SSA 做较快的优化；Phi 节点汇合分支变量，猜测失效时需要反优化。" },
  { title: "Land ahoy: leaving the Sea of Nodes", group: "执行分层", status: "V8 官方文章 · 2025", original: "https://v8.dev/blog/leaving-the-sea-of-nodes", summary: "解释 TurboFan 后端转向 Turboshaft 控制流图 IR 的取舍；讨论的是编译器内部表示，不是 JavaScript 语法变化。" },
  { title: "Fast properties in V8", group: "数据表示", status: "V8 官方文章 · 2017", original: "https://v8.dev/blog/fast-properties", summary: "对象的命名属性与索引元素有不同存储路径；HiddenClass 描述对象形状，帮助优化属性访问。" },
  { title: "Elements kinds in V8", group: "数据表示", status: "V8 官方文章 · 2017，后续更新", original: "https://v8.dev/blog/elements-kinds", summary: "数组元素种类与稀疏状态影响可走的优化路径；从紧密数组变成有空洞的数组，可能增加检查成本。" },
  { title: "How we made JSON.stringify more than twice as fast", group: "数据表示", status: "V8 官方文章 · 2025", original: "https://v8.dev/blog/json-stringify", summary: "在可确认无副作用的序列化场景使用专门快路径；提速依赖适用条件，并未改变 JSON 语义。" },
  { title: "Trash talk: the Orinoco garbage collector", group: "内存与安全", status: "V8 官方文章 · 2019", original: "https://v8.dev/blog/trash-talk", summary: "通过增量、并行和并发回收分摊或缩短主线程影响；分析卡顿时要区分工作何时、在哪个线程执行。" },
  { title: "Pointer Compression in V8", group: "内存与安全", status: "V8 官方文章 · 2020", original: "https://v8.dev/blog/pointer-compression", summary: "压缩堆内指针降低内存占用，但解压和编译器优化也要相应调整；省内存不自动等于更快。" },
  { title: "The V8 Sandbox", group: "内存与安全", status: "V8 官方文章 · 2024", original: "https://v8.dev/blog/sandbox", summary: "尝试把堆内存破坏限制在隔离区域，避免扩散到进程其他内存；这不等于漏洞不存在或浏览器整体沙箱。" },
];

function parseOverreactedArticles(markdown: string): Article[] {
  const articles: Article[] = [];
  let group = "";
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^## 第[一二三四五六七]阶段：(.+)$/);
    if (heading) {
      group = heading[1];
      continue;
    }
    const article = line.match(/^\d+\. \[([^\]]+)\]\((https:\/\/overreacted\.io\/[^)]+)\)$/);
    if (article && group) {
      const slug = article[2].replace(/\/$/, "").split("/").pop() ?? "";
      articles.push({ title: article[1], group, summary: overreactedArticleSummaries[slug], status: "阅读提炼初稿 · 待本人复核", original: article[2] });
    }
  }
  return articles;
}

export const overreactedArticles = parseOverreactedArticles(overreactedNote);
const conferenceArticles: Article[] = conferenceEntries.map((entry) => ({
  title: entry.title,
  group: entry.event,
  summary: entry.summary,
  status: entry.status + " · " + entry.date,
  original: entry.source,
  note: "/ai-conference-notes/" + entry.slug,
}));

const groups: { id: Exclude<Topic, "all">; title: string; articles: Article[]; note?: string }[] = [
  { id: "conference", title: "AI 前瞻会议", articles: conferenceArticles, note: "/ai-conferences" },
  { id: "v8", title: "V8 引擎专题", articles: v8Articles },
  { id: "overreacted", title: "Overreacted 阅读路线", articles: overreactedArticles, note: "/overreacted-reading-route" },
];

const filters: { id: Topic; label: string; count: number }[] = [
  { id: "all", label: "全部", count: conferenceArticles.length + v8Articles.length + overreactedArticles.length },
  { id: "conference", label: "AI 会议", count: conferenceArticles.length },
  { id: "v8", label: "V8", count: v8Articles.length },
  { id: "overreacted", label: "Overreacted", count: overreactedArticles.length },
];

function articleNotePath(article: Article, topic: Exclude<Topic, "all">): string {
  if (article.note) return article.note;
  const slug = article.original.replace(/\/$/, "").split("/").pop() ?? "";
  return `/sharing-notes/${topic}/${slug}`;
}

export function SharingArticleDirectory() {
  const [topic, setTopic] = useState<Topic>("all");
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase();
  const visibleGroups = groups
    .filter((group) => topic === "all" || topic === group.id)
    .map((group) => ({
      ...group,
      articles: group.articles.filter((article) =>
        !search || [article.title, article.group, article.summary ?? "", article.status].some((value) => value.toLocaleLowerCase().includes(search))),
    }))
    .filter((group) => group.articles.length > 0);

  return (
    <section className="sharing-directory" id="sharing-articles" aria-labelledby="sharing-directory-title">
      <header className="sharing-directory-head">
        <span>ALL ARTICLES / 文章目录</span>
        <h2 id="sharing-directory-title">按专题读，也可以交叉找</h2>
        <p>会议可阅读完整笔记；V8 与 Overreacted 提供逐篇阅读提炼初稿，待本人复核，不等同于全文翻译或已完成精读。每篇均保留作者原文入口。</p>
      </header>
      <div className="sharing-directory-controls">
        <div className="sharing-directory-filters" role="group" aria-label="按专题筛选">
          {filters.map((filter) => (
            <button type="button" key={filter.id} className="sharing-directory-filter" aria-pressed={topic === filter.id} onClick={() => setTopic(filter.id)}>
              {filter.label} · {filter.count}
            </button>
          ))}
        </div>
        <input className="sharing-directory-search" type="search" aria-label="搜索文章" placeholder="搜索标题、主题或摘要" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      {visibleGroups.length ? visibleGroups.map((group) => (
        <section className="sharing-directory-group" key={group.id} aria-labelledby={"directory-" + group.id}>
          <div className="sharing-directory-group-head">
            <h3 id={"directory-" + group.id}>{group.title}</h3>
            <span>{group.articles.length} 篇{group.note ? " · 可查看专题页" : ""}</span>
          </div>
          {group.articles.map((article, index) => (
            <article className="sharing-directory-item" key={article.original}>
              <a className="sharing-directory-item-link" href={articleNotePath(article, group.id)} aria-label={`${group.id === "conference" ? "阅读" : "查看"}《${article.title}》的${group.id === "conference" ? "笔记" : "原文要点"}`}>
                <span className="sharing-directory-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="sharing-directory-meta">{article.group} · {article.status}</div>
                  <h4>{article.title}</h4>
                  {article.summary && <p>{article.summary}</p>}
                </div>
              </a>
              <div className="sharing-directory-actions">
                <a href={article.original} target="_blank" rel="noreferrer">作者原文 ↗</a>
              </div>
            </article>
          ))}
        </section>
      )) : <p className="sharing-directory-empty">没有匹配的文章。试试其他关键词或专题。</p>}
    </section>
  );
}
