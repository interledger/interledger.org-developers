import { useState, useEffect } from "react";
import styles from "./Spec.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Spec({ source }) {
  const [data, setData] = useState();

  const getApiData = async () => {
    const data = await fetch(source).then((response) => response.text());
    const frontMatterPos = data.indexOf("---", 1) + 3;
    const specBody = data.slice(frontMatterPos);
    setData(specBody);
  };

  const generateSlug = (string) => {
    let str = string.replace(/^\s+|\s+$/g, "");
    str = str.toLowerCase();
    str = str
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    return str;
  };

  useEffect(() => {
    getApiData();
  }, []);

  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ node, ...props }) => (
            <h2 id={generateSlug(props.children[0])} {...props}></h2>
          ),
          h3: ({ node, ...props }) => (
            <h3 id={generateSlug(props.children[0])} {...props}></h3>
          ),
        }}
      >
        {data}
      </ReactMarkdown>
    </>
  );
}
