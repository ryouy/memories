import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export function renderMarkdown(markdown: string) {
  const html = marked.parse(markdown, { async: false, gfm: true, breaks: true });
  return sanitizeHtml(html, {
    allowedTags: ["p", "strong", "em", "a", "ul", "ol", "li", "blockquote", "br", "code"],
    allowedAttributes: {
      a: ["href", "target", "rel"]
    },
    allowedSchemes: ["http", "https", "mailto"]
  });
}
