import React, { useEffect, useState } from 'react';
import { X, FileText, Tag, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

export default function DocumentModal({ docId, onClose }) {
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!docId) return;

        const fetchDocument = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`http://localhost:8000/api/kb/${docId}`);
                if (!response.ok) {
                    throw new Error('Document not found');
                }
                const data = await response.json();
                setDocument(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [docId]);

    if (!docId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#111] border border-[#333] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                            <FileText size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Knowledge Base Document</h2>
                            <p className="text-xs text-gray-400">ID: {docId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                            <p className="font-medium">Error loading document</p>
                            <p className="text-sm mt-1 text-red-300">{error}</p>
                        </div>
                    )}

                    {document && (
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">{document.title}</h3>
                                {document.summary && (
                                    <p className="text-gray-400 text-sm">{document.summary}</p>
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-4 text-sm">
                                {/* Status */}
                                <div className="flex items-center gap-2">
                                    {document.status === 'verified' ? (
                                        <>
                                            <CheckCircle size={16} className="text-green-500" />
                                            <span className="text-green-400 font-medium">Verified</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle size={16} className="text-yellow-500" />
                                            <span className="text-yellow-400 font-medium">Unverified</span>
                                        </>
                                    )}
                                </div>

                                {/* Type */}
                                <div className="flex items-center gap-2 text-gray-400">
                                    <FileText size={16} />
                                    <span className="capitalize">{document.type || 'code'}</span>
                                </div>
                            </div>

                            {/* Tags */}
                            {document.tags && document.tags.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag size={16} className="text-gray-400" />
                                        <span className="text-sm font-medium text-gray-300">Tags</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {document.tags.map((tag, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-xs text-blue-300"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-3">Content</h4>
                                <div className="bg-[#0a0a0a] border border-[#333] rounded-lg p-4">
                                    <div className="markdown-content whitespace-pre-wrap">
                                        <ReactMarkdown components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const codeString = String(children).replace(/\n$/, '');
                                                const isBlock = !inline || (match && match.length > 0);
                                                return isBlock ? (
                                                    <CodeBlock code={codeString} language={match ? match[1] : 'sql'} />
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}>
                                            {document.content || 'No content available'}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
