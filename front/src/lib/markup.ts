/**
 * Renders blog bodies written in the admin. Deliberately tiny and text-only —
 * no HTML is ever interpreted, so an article cannot inject markup:
 *
 *   blank line   new paragraph
 *   "## Title"   section heading       "### Title"  sub-heading
 *   "- item"     list item (consecutive lines form one list)
 */

export type Block =
  | { type: 'h2' | 'h3' | 'p'; text: string }
  | { type: 'ul'; items: string[] }

export function parseBody(body: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') })
    paragraph = []
  }
  const flushList = () => {
    if (list.length) blocks.push({ type: 'ul', items: list })
    list = []
  }

  for (const raw of body.split('\n')) {
    const line = raw.trim()

    if (!line) {
      flushParagraph()
      flushList()
    } else if (line.startsWith('### ') || line.startsWith('## ')) {
      flushParagraph()
      flushList()
      const level = line.startsWith('### ') ? 'h3' : 'h2'
      blocks.push({ type: level, text: line.slice(level === 'h3' ? 4 : 3).trim() })
    } else if (line.startsWith('- ')) {
      flushParagraph()
      list.push(line.slice(2).trim())
    } else {
      flushList()
      paragraph.push(line)
    }
  }

  flushParagraph()
  flushList()
  return blocks
}

const WORDS_PER_MINUTE = 200

export function readingMinutes(body: string): number {
  return Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / WORDS_PER_MINUTE))
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}
