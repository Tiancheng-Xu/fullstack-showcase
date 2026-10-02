import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import note from "./content/overreacted-reading-route.md?raw";
import "./sharing-index.css";

const body = note.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

function renderBlock(block: string, index: number): ReactNode {
  const heading = block.match(/^(#{1,4})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length;
    const text = heading[2];
    if (level === 1) return <h1 key={index}>{inline(text)}</h1>;
    if (level === 2) return <h2 key={index}>{inline(text)}</h2>;
    if (level === 3) return <h3 key={index}>{inline(text)}</h3>;
    return <h4 key={index}>{inline(text)}</h4>;
  }
  const lines = block.split(/\r?\n/);
  if (lines.every((line) => /^\d+\.\s+/.test(line))) {
    return <ol key={index}>{lines.map((line, item) => <li key={item}>{inline(line.replace(/^\d+\.\s+/, ""))}</li>)}</ol>;
  }
  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return <ul key={index}>{lines.map((line, item) => <li key={item}>{inline(line.replace(/^[-*]\s+/, ""))}</li>)}</ul>;
  }
  if (lines.every((line) => line.startsWith("> "))) {
    return <blockquote key={index}>{inline(lines.map((line) => line.slice(2)).join(" "))}</blockquote>;
  }
  return <p key={index}>{inline(lines.join(" "))}</p>;
}

export function OverreactedReadingRouteContent() {
  return (
    <article className="sharing-index reading-route-page">
      <div className="sharing-intro">
        <Link to="/sharing" className="sharing-back">← 返回分享</Link>
        <p>阅读路线已整理，逐篇带读进行中。目录核对于 2026.10.01，公开笔记更新于 2026.10.02；这不是 59 篇文章的已读声明。</p>
        <a href="https://overreacted.io/" target="_blank" rel="noreferrer">原作者 Dan Abramov · Overreacted.io ↗</a>
      </div>
      <div className="reading-route-body">{body.split(/\r?\n\s*\r?\n/).map(renderBlock)}</div>
    </article>
  );
}
