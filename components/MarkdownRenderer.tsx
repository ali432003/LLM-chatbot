
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  return (
    <div className="text-base lg:text-lg leading-relaxed text-[var(--text)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-5 mb-3">
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-4 mb-2">
              {children}
            </h2>
          ),

          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-3 mb-2">
              {children}
            </h3>
          ),

          p: ({ children }) => (
            <p className="leading-7 mb-3 last:mb-0">
              {children}
            </p>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),

          ul: ({ children }) => (
            <ul className="list-disc pl-6 space-y-2 mb-3">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="list-decimal pl-6 space-y-2 mb-3">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="pl-1">{children}</li>
          ),

          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-500 pl-4 my-4 text-zinc-400">
              {children}
            </blockquote>
          ),

          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");

            return isBlock ? (
              <code className="block font-mono text-sm">
                {children}
              </code>
            ) : (
              <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-sky-300">
                {children}
              </code>
            );
          },

          pre: ({ children }) => (
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 overflow-x-auto my-4">
              {children}
            </pre>
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 underline underline-offset-2"
            >
              {children}
            </a>
          ),

          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th className="border border-zinc-700 bg-zinc-800 p-2 text-left font-semibold">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="border border-zinc-700 p-2">
              {children}
            </td>
          ),

          hr: () => (
            <hr className="border-zinc-700 my-4" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
