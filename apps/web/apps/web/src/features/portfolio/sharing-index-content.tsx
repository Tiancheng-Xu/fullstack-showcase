import { Link } from "@tanstack/react-router";
import { conferenceEntries } from "./sharing-data";
import "./sharing-index.css";

export function SharingIndexContent() {
  return (
    <div className="sharing-index">
      <div className="sharing-intro">
        <span className="sharing-eyebrow">PUBLIC NOTES / 公开分享</span>
        <p>阅读路线与技术会议文字资料，各自保留来源、日期和整理边界。这里记录如何理解，不把阅读或问答包装成已交付项目。</p>
      </div>
      <div className="sharing-grid">
        <article className="sharing-feature-card">
          <div className="sharing-card-top"><span>01 / 阅读路线</span><span>长期更新</span></div>
          <h2>Overreacted 阅读路线</h2>
          <p>从 JavaScript 和 React 出发，走向工程设计、Server Components、开放社交协议，以及编程语言与表达。七阶段、一篇完整笔记。</p>
          <div className="sharing-card-meta">Dan Abramov · 路线已整理，逐篇带读进行中</div>
          <Link to="/overreacted-reading-route" className="sharing-action">打开阅读路线 <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="sharing-feature-card sharing-feature-card--conference">
          <div className="sharing-card-top"><span>02 / 技术会议</span><span>官方文字来源</span></div>
          <h2>AI 前瞻会议</h2>
          <p>按会议和议题整理已有正文的演讲总结、官方文字资料与公开回顾。每条都标出已核对的来源和整理状态。</p>
          <div className="sharing-card-meta">{conferenceEntries.length} 篇会议总结 · 仅收录已有内容</div>
          <Link to="/ai-conferences" className="sharing-action">查看会议归档 <span aria-hidden="true">↗</span></Link>
        </article>
      </div>
      <div className="sharing-bottom-note">原文属于各作者及主办方。本站仅提供个人阅读路线与有边界的整理。</div>
    </div>
  );
}

export function AiConferenceContent() {
  return (
    <div className="sharing-index">
      <div className="sharing-intro">
        <Link to="/sharing" className="sharing-back">← 返回分享</Link>
        <p>仅收录可追溯的官方文字资料。摘要不标作逐字稿；未阅读的 PPT 正文、回放及字幕不用于补充会议结论。</p>
      </div>
      <div className="conference-list">
        {conferenceEntries.map((entry, index) => (
          <article className="conference-item" key={`${entry.event}-${entry.title}`}>
            <span className="conference-number">{String(index + 1).padStart(2, "0")}</span>
            <div className="conference-main">
              <div className="conference-meta"><span>{entry.event}</span><span>{entry.date}</span></div>
              <h2>{entry.title}</h2>
              <p>{entry.summary}</p>
              <div className="conference-foot"><span className="conference-status">{entry.status}</span><span>核对 {entry.reviewed}</span></div>
            </div>
            <div className="conference-actions">
              <a className="sharing-action" href={`/ai-conference-notes/${entry.slug}`}>我的总结 <span aria-hidden="true">↗</span></a>
              <a className="sharing-action conference-source" href={entry.source} target="_blank" rel="noreferrer">官方来源 <span aria-hidden="true">↗</span></a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
