import { Link } from "@tanstack/react-router";
import { conferenceEntries } from "./sharing-data";
import { SharingArticleDirectory } from "./sharing-article-directory";
import "./sharing-index.css";

export function SharingIndexContent() {
  return (
    <div className="sharing-index">
      <div className="sharing-intro">
        <span className="sharing-eyebrow">PUBLIC NOTES / 公开分享</span>
        <p>阅读路线、引擎技术与技术会议文字资料，各自保留来源、日期和整理边界。下方文章目录可按专题筛选和搜索；阅读或问答不算已交付项目。</p>
      </div>
      <div className="sharing-grid">
        <article className="sharing-feature-card">
          <div className="sharing-card-top"><span>01 / 阅读路线</span><span>长期更新</span></div>
          <h2>Overreacted 阅读路线</h2>
          <p>从 JavaScript 和 React 出发，走向工程设计、Server Components、开放社交协议，以及编程语言与表达。七阶段、一篇完整笔记。</p>
          <div className="sharing-card-meta">Dan Abramov · 路线已整理，逐篇带读进行中</div>
          <div className="sharing-card-actions">
            <a href="#sharing-articles" className="sharing-action">查看文章目录 <span aria-hidden="true">↘</span></a>
            <Link to="/overreacted-reading-route" className="sharing-secondary-action">完整阅读路线 ↗</Link>
          </div>
        </article>
        <article className="sharing-feature-card sharing-feature-card--conference">
          <div className="sharing-card-top"><span>02 / 技术会议</span><span>官方文字来源</span></div>
          <h2>AI 前瞻会议</h2>
          <p>按会议和议题整理已有正文的演讲总结、官方文字资料与公开回顾。每条都标出已核对的来源和整理状态。</p>
          <div className="sharing-card-meta">{conferenceEntries.length} 篇会议总结 · 仅收录已有内容</div>
          <div className="sharing-card-actions">
            <a href="#sharing-articles" className="sharing-action">查看文章目录 <span aria-hidden="true">↘</span></a>
            <Link to="/ai-conferences" className="sharing-secondary-action">会议总结归档 ↗</Link>
          </div>
        </article>
        <article className="sharing-feature-card sharing-feature-card--v8">
          <div className="sharing-card-top"><span>03 / 引擎专题</span><span>V8 官方文章选读</span></div>
          <h2>V8：从 JavaScript 到机器码</h2>
          <p>沿着执行分层、对象与数组表示、内存和安全边界三条线索，提炼九篇 V8 官方技术文章，理解性能取舍背后的机制。</p>
          <div className="sharing-card-meta">9 篇精选 · 原文与发布时间可追溯</div>
          <a href="#sharing-articles" className="sharing-action">查看文章目录 <span aria-hidden="true">↘</span></a>
        </article>
      </div>
      <SharingArticleDirectory />
      <div className="sharing-bottom-note">原文属于各作者及主办方。本站仅提供个人阅读路线与有边界的整理；引擎文章中的实现细节以对应原文发布时间为准。</div>
    </div>
  );
}

export function AiConferenceContent() {
  return (
    <div className="sharing-index">
      <div className="sharing-intro">
        <a href="/sharing#sharing-articles" className="sharing-back">← 返回文章列表</a>
        <p>仅收录可追溯的官方文字资料。摘要不标作逐字稿；未阅读的 PPT 正文、回放及字幕不用于补充会议结论。</p>
      </div>
      <div className="conference-list">
        {conferenceEntries.map((entry, index) => (
          <article className="conference-item" key={`${entry.event}-${entry.title}`}>
            <a className="conference-item-link" href={`/ai-conference-notes/${entry.slug}`} aria-label={`阅读《${entry.title}》的总结`} />
            <span className="conference-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="conference-main">
              <div className="conference-meta"><span>{entry.event}</span><span>{entry.date}</span></div>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
              <div className="conference-foot"><span className="conference-status">{entry.status}</span><span>核对 {entry.reviewed}</span></div>
            </div>
            <div className="conference-actions">
              <a className="sharing-action conference-source" href={entry.source} target="_blank" rel="noreferrer">官方来源 <span aria-hidden="true">↗</span></a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
