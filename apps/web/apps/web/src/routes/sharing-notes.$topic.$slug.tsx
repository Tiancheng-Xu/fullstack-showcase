import { createFileRoute, notFound } from "@tanstack/react-router";
import { overreactedArticles, v8Articles } from "@/features/portfolio/sharing-article-directory";
import { sharingNoteDrafts } from "@/features/portfolio/sharing-note-drafts";
import { PortfolioIndexShell } from "@/features/portfolio/portfolio-index-shell";
import "@/features/portfolio/sharing-index.css";

export const Route = createFileRoute("/sharing-notes/$topic/$slug")({ component: SharingNoteRoute });

function SharingNoteRoute() {
  const { topic, slug } = Route.useParams();
  const articles = topic === "v8" ? v8Articles : topic === "overreacted" ? overreactedArticles : null;
  const article = articles?.find((item) => item.original.replace(/\/$/, "").split("/").pop() === slug);
  if (!article?.summary) throw notFound();
  const hasReadingDraft = topic === "overreacted" && slug === "on-let-vs-const";
  const draft = sharingNoteDrafts[topic + "/" + slug];

  return (
    <PortfolioIndexShell current="sharing" kicker="READING NOTES / 待本人复核" title={article.title} description={article.group}>
      <article className="sharing-index sharing-article-note">
        <div className="sharing-intro">
          <a href="/sharing#sharing-articles" className="sharing-back">← 返回文章列表</a>
          <div className="sharing-directory-meta">{topic === "v8" ? "V8 引擎专题" : "Overreacted 阅读路线"} · {article.group} · {article.status}</div>
        </div>
        <section className="reading-route-body" aria-labelledby="sharing-note-heading">
          <span className="sharing-eyebrow">READING NOTES / 阅读提炼初稿</span>
          <h2 id="sharing-note-heading">{hasReadingDraft ? "On let vs const：不必把偏好变成争论" : "我的总结（待本人复核）"}</h2>
          {hasReadingDraft ? (
            <>
              <p>作者讨论的不是 <code>let</code> 和 <code>const</code> 哪个语法更高级，而是团队是否值得强制“能用 <code>const</code> 就不用 <code>let</code>”。这篇文章分别列出支持和反对的理由，最后建议遵循项目既有约定，把机械检查交给工具。</p>
              <h3>先分清两个动作</h3>
              <p><code>const</code> 禁止给变量重新赋值，不会冻结它指向的对象。修改对象属性与把变量改指向另一个对象，是两回事：</p>
              <pre><code>{`const settings = { retries: 1 };
settings.retries = 2; // 允许：修改对象属性
// settings = { retries: 3 }; // 不允许：重新赋值`}</code></pre>
              <h3>双方在争什么</h3>
              <ul>
                <li>支持默认使用 <code>const</code>：统一约定减少选择成本，也能更早暴露意外重新赋值；在闭包或 React Hooks 等场景，单向流动的值尤其适合不再赋值。</li>
                <li>反对一律使用 <code>const</code>：当所有只赋值一次的变量都写成 <code>const</code>，它就较难表达“这里特别不能重新赋值”的设计意图；同时它并不能防止跨模块的对象修改。</li>
                <li>不要拿性能当决定性理由：作者认为引擎本身通常能识别只赋值一次的变量，文章没有给出 <code>const</code> 更快的实测证据。</li>
              </ul>
              <h3>我的工程取舍</h3>
              <p>先遵循仓库已有规则；若团队要统一偏好，用 lint 自动检查和修复，不把风格争论塞进代码审查。遇到复杂的条件赋值，也不必为了坚持 <code>const</code> 把清晰的分支硬改成难读的表达式。这是基于原文的工程推论，不是新的 JavaScript 语言规则。</p>
              <p className="sharing-note-boundary">这是依据作者原文写的阅读提炼初稿，尚待本人复核；不是全文翻译，也不代表这些取舍已在项目中验证。</p>
            </>
          ) : (
            <>
              <p>{article.summary}</p>
              <h3>技术理解</h3>
              <p>{draft?.insight}</p>
              <h3>实践判断</h3>
              <p>{draft?.practice}</p>
              <p className="sharing-note-boundary">依据作者原文与已有目录摘要整理的阅读初稿，尚待本人逐篇复核；不是全文翻译，也不代表对应技术已在项目中验证。</p>
            </>
          )}
          <a className="sharing-action" href={article.original} target="_blank" rel="noreferrer">作者原文 <span aria-hidden="true">↗</span></a>
        </section>
      </article>
    </PortfolioIndexShell>
  );
}
