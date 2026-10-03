import type { ReactNode } from "react";
import type { ConferenceEntry } from "./sharing-data";
import "./sharing-index.css";

function inline(text: string): ReactNode[] {
  const tokens = text.split(/(\[\[[^\]]+\]\]|\[[^\]]+\]\((?:<[^>]+>|[^)]+)\)|\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((token, index) => {
    const wiki = token.match(/^\[\[([^\]]+)\]\]$/);
    if (wiki) return <span key={index} className="conference-note-local-ref">{wiki[1].split("|").at(-1)?.split("/").at(-1)}</span>;
    const link = token.match(/^\[([^\]]+)\]\((?:<([^>]+)>|([^)]*))\)$/);
    if (link) {
      const href = link[2] ?? link[3];
      return /^https?:\/\//.test(href)
        ? <a key={index} href={href} target="_blank" rel="noreferrer">{link[1]}</a>
        : <span key={index} className="conference-note-local-ref">{link[1]}</span>;
    }
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index}>{token.slice(1, -1)}</code>;
    return token;
  });
}

function renderMarkdown(markdown: string): ReactNode[] {
  const body = markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
    .replace(/\n## 返回\s*[\s\S]*$/, "")
    .trim();
  const lines = body.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const key = i;
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const content = inline(heading[2]);
      nodes.push(heading[1].length === 1 ? <h1 key={key}>{content}</h1>
        : heading[1].length === 2 ? <h2 key={key}>{content}</h2>
        : heading[1].length === 3 ? <h3 key={key}>{content}</h3>
        : <h4 key={key}>{content}</h4>);
      i++; continue;
    }
    if (/^```/.test(line)) {
      const code: string[] = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      nodes.push(<pre key={key}><code>{code.join("\n")}</code></pre>);
      i++; continue;
    }
    if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/.test(lines[i]) : /^\s*[-*+]\s+/.test(lines[i]))) {
        items.push(lines[i++].replace(ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/, ""));
      }
      nodes.push(ordered ? <ol key={key}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</ol>
        : <ul key={key}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</ul>);
      continue;
    }
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|?[\s:|-]+\|?$/.test(lines[i + 1])) {
      const rows: string[][] = [line.split("|").slice(1, -1).map((cell) => cell.trim())];
      i += 2;
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++].split("|").slice(1, -1).map((cell) => cell.trim()));
      nodes.push(<table key={key}><thead><tr>{rows[0].map((cell, n) => <th key={n}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, n) => <tr key={n}>{row.map((cell, m) => <td key={m}>{inline(cell)}</td>)}</tr>)}</tbody></table>);
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""));
      nodes.push(<blockquote key={key}>{inline(quote.join(" "))}</blockquote>);
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(line)) { nodes.push(<hr key={key} />); i++; continue; }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s?|\s*[-*+]\s+|\s*\d+\.\s+)/.test(lines[i])) paragraph.push(lines[i++]);
    if (paragraph.length) nodes.push(<p key={key}>{inline(paragraph.join(" "))}</p>);
    else i++;
  }
  return nodes;
}

export function AiConferenceOriginalNoteContent({ entry, markdown }: { entry: ConferenceEntry; markdown: string }) {
  return (
    <article className="sharing-index conference-original-note">
      <div className="sharing-intro">
        <a href="/sharing#sharing-articles" className="sharing-back">← 返回文章列表</a>
        <p>以下为资料库原笔记正文。为适配网页，Obsidian 内链与本地素材链接只显示名称、不提供无效跳转；正文内容和证据限制保持原样。</p>
        <div className="conference-meta"><span>{entry.event}</span><span>{entry.date}</span><span>{entry.status}</span><span>核对 {entry.reviewed}</span></div>
      </div>
      <div className="reading-route-body">{renderMarkdown(markdown)}</div>
      <div className="sharing-bottom-note"><a href={entry.source} target="_blank" rel="noreferrer">官方来源 ↗</a></div>
    </article>
  );
}
