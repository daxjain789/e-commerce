import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Minimal, safe markdown subset: ## headings, - lists, **bold**, *italic*
 * and [links](url). Renders to React nodes — never uses innerHTML, so CMS
 * content cannot inject scripts.
 */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  const parts = text.split(pattern).filter((part) => part !== '');
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith('/')) {
        return (
          <Link key={key} href={href}>
            {label}
          </Link>
        );
      }
      return (
        <a key={key} href={href} target="_blank" rel="noreferrer noopener">
          {label}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = (text ?? '').replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const joined = paragraph.join(' ').trim();
    if (joined) blocks.push(<p key={`p-${blocks.length}`}>{renderInline(joined, `p-${blocks.length}`)}</p>);
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {list.map((item, index) => (
          <li key={`li-${index}`}>{renderInline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    if (line.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={`h3-${index}`}>{renderInline(line.slice(4), `h3-${index}`)}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={`h2-${index}`}>{renderInline(line.slice(3), `h2-${index}`)}</h2>);
      return;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      list.push(line.slice(2));
      return;
    }
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      return;
    }
    flushList();
    paragraph.push(line);
  });

  flushParagraph();
  flushList();

  return <div className={className ?? 'prose-meridian'}>{blocks}</div>;
}
