import React from "react";

// A compact, dependency-free Markdown renderer covering exactly what the Writer
// agent emits: headings, bold/italic/code/links inline, unordered + ordered
// lists, blockquotes, and horizontal rules. Kept intentionally small so the
// report surface has zero third-party rendering dependencies.

let keySeed = 0;
const key = () => `md-${keySeed++}`;

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Order matters: links, bold, italic, code.
  const pattern =
    /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));

    if (m[1]) {
      nodes.push(
        <a key={key()} href={m[3]} target="_blank" rel="noopener noreferrer">
          {m[2]}
        </a>
      );
    } else if (m[4]) {
      nodes.push(<strong key={key()}>{m[5]}</strong>);
    } else if (m[6]) {
      nodes.push(<code key={key()}>{m[7]}</code>);
    } else if (m[8]) {
      nodes.push(<em key={key()}>{m[9]}</em>);
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  keySeed = 0;
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push(<hr key={key()} />);
      i++;
      continue;
    }

    // Headings
    const h = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = Math.min(h[1].length, 3);
      const content = renderInline(h[2]);
      if (level === 1) blocks.push(<h1 key={key()}>{content}</h1>);
      else if (level === 2) blocks.push(<h2 key={key()}>{content}</h2>);
      else blocks.push(<h3 key={key()}>{content}</h3>);
      i++;
      continue;
    }

    // Blockquote (consecutive >)
    if (/^>\s?/.test(trimmed)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote key={key()}>{renderInline(quote.join(" "))}</blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key()}>
          {items.map((it) => (
            <li key={key()}>{renderInline(it)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key()}>
          {items.map((it) => (
            <li key={key()}>{renderInline(it)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph — gather consecutive plain lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s?|(-{3,}|\*{3,}|_{3,})$)/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(<p key={key()}>{renderInline(para.join(" "))}</p>);
  }

  return <div className="prose-report">{blocks}</div>;
}
