import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AIResponseRendererProps {
  content: string;
  className?: string;
}

const AIResponseRenderer: React.FC<AIResponseRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;
  
  return (
    <div className={`ai-response-content prose prose-invert prose-orange max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Personalización de elementos para la estética Aurora
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-aurora-text/90 text-sm md:text-base">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold text-primary mb-4 mt-6">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold text-primary/90 mb-3 mt-5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-md font-bold text-primary/80 mb-2 mt-4">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2 text-aurora-secondary">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2 text-aurora-secondary">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          code: ({ children }) => (
            <code className="bg-background-dark px-1.5 py-0.5 rounded border border-aurora-border font-mono text-xs text-secondary">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-aurora-muted">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse border border-aurora-border text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => <th className="border border-aurora-border bg-white/5 p-2 text-left font-bold">{children}</th>,
          td: ({ children }) => <td className="border border-aurora-border p-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AIResponseRenderer;
