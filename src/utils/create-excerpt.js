import MarkdownIt from "markdown-it";
import { convert } from "html-to-text";
const parser = new MarkdownIt();

export const createExcerpt = (body) => {
  const html = parser.render(body);
  const options = {
    wordwrap: null,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
      { selector: "figure", format: "skip" }
    ]
  };
  const text = convert(html, options);
  const distilled = convert(text, options);
  return distilled;
};
