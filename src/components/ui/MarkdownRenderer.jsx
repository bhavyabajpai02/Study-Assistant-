import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Check, Copy } from "lucide-react"

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)
  const language = className ? className.replace("language-", "") : "text"
  const codeString = String(children).replace(/\n$/, "")

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors text-[10px] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-zinc-200 leading-relaxed font-mono">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body text-zinc-200 text-xs md:text-sm leading-relaxed space-y-2 font-sans">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-lg md:text-xl font-extrabold text-zinc-100 mt-4 mb-2 border-b border-zinc-800 pb-1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-base md:text-lg font-bold text-zinc-100 mt-3 mb-1.5" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-sm md:text-base font-semibold text-zinc-200 mt-2.5 mb-1" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 leading-relaxed text-zinc-300 font-light" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-1 my-2 text-zinc-300 pl-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 text-zinc-300 pl-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-blue-500 bg-blue-500/5 px-3 py-2 rounded-r-lg my-2 italic text-zinc-300 text-xs" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-zinc-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-zinc-200" {...props} />
          ),
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            if (!inline && match) {
              return <CodeBlock className={className}>{children}</CodeBlock>
            }
            if (!inline && String(children).includes("\n")) {
              return <CodeBlock className={className}>{children}</CodeBlock>
            }
            return (
              <code className="bg-zinc-900 text-blue-400 font-mono text-[11px] px-1.5 py-0.5 rounded border border-zinc-800" {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
