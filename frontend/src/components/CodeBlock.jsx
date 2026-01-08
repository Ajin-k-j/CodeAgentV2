import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeBlock({ code, language = 'sql' }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4">
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 rounded-md text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1.5"
                title="Copy code"
            >
                {copied ? (
                    <>
                        <Check size={14} className="text-white" />
                        Copied
                    </>
                ) : (
                    <>
                        <Copy size={14} className="text-white" />
                        Copy
                    </>
                )}
            </button>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                className="rounded-lg text-sm !mt-0"
                customStyle={{ margin: 0, padding: '1rem', background: '#0a0a0a', border: '1px solid #333', borderRadius: '0.5rem' }}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
}
