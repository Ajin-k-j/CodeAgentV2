import React, { useState, useEffect } from 'react';
import { Send, Eye, EyeOff, Bot, User } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';
import SourceBadge from './SourceBadge';
import DocumentModal from './DocumentModal';
import CodeBlock from './CodeBlock';

export default function Chat() {
    const [input, setInput] = useState('');
    const { messages, setMessages, isLoading, setIsLoading, selectedDocId, setSelectedDocId, sessionId, messagesEndRef } = useChatContext();
    const [showThinkingFor, setShowThinkingFor] = useState({});

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const toggleThinking = (msgIndex) => {
        setShowThinkingFor(prev => ({
            ...prev,
            [msgIndex]: !prev[msgIndex]
        }));
    };

    const renderContentWithSources = (content) => {
        const parts = [];
        let lastIndex = 0;
        const sourcePattern = /\[Source:\s*([^\]]+)\]/g;
        let match;

        while ((match = sourcePattern.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(<ReactMarkdown key={`text-${lastIndex}`} components={{
                    code({ node, inline, className, children, ...props }) {
                        const codeString = String(children).replace(/\n$/, '');
                        const language = /language-(\w+)/.exec(className || '')?.[1] || 'sql';
                        return !inline ? (
                            <CodeBlock code={codeString} language={language} />
                        ) : <code className="bg-blue-600/20 px-1.5 py-0.5 rounded text-sm text-blue-300">{children}</code>;
                    }
                }}>{content.substring(lastIndex, match.index)}</ReactMarkdown>);
            }

            const sourceIds = match[1].split(',').map(s => s.trim()).filter(s => s);
            sourceIds.forEach((id, i) => {
                parts.push(<SourceBadge key={`source-${match.index}-${i}`} docId={id} onClick={setSelectedDocId} />);
                parts.push(' ');
            });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < content.length) {
            parts.push(<ReactMarkdown key={`text-${lastIndex}`} components={{
                code({ node, inline, className, children, ...props }) {
                    const codeString = String(children).replace(/\n$/, '');
                    const language = /language-(\w+)/.exec(className || '')?.[1] || 'sql';
                    return !inline ? (
                        <CodeBlock code={codeString} language={language} />
                    ) : <code className="bg-blue-600/20 px-1.5 py-0.5 rounded text-sm text-blue-300">{children}</code>;
                }
            }}>{content.substring(lastIndex)}</ReactMarkdown>);
        }

        return <>{parts}</>;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        const thinkingMsg = { role: 'model', content: '', isThinking: true, thinkingSteps: [] };
        setMessages(prev => [...prev, thinkingMsg]);

        try {
            const response = await api.chat(input, sessionId);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let thinkingSteps = [];

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                for (const line of chunk.split('\n')) {
                    if (!line.trim()) continue;
                    try {
                        const data = JSON.parse(line);
                        if (data.type === 'step' || data.type === 'info') {
                            thinkingSteps.push(data.content);
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1] = { role: 'model', content: '', isThinking: true, thinkingSteps: [...thinkingSteps] };
                                return newMsgs;
                            });
                        } else if (data.type === 'answer') {
                            setMessages(prev => {
                                const newMsgs = [...prev];
                                newMsgs[newMsgs.length - 1] = { role: 'model', content: data.content, isThinking: false, thinkingSteps: [...thinkingSteps] };
                                return newMsgs;
                            });
                        }
                    } catch (e) { }
                }
            }
        } catch (error) {
            setMessages(prev => [...prev.slice(0, -1), { role: 'model', content: 'Sorry, something went wrong.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-4 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <Bot size={48} className="mx-auto mb-4 opacity-50" />
                            <h2 className="text-xl font-semibold mb-2">How can I help you with Hybris today?</h2>
                            <p>Ask for FlexSearch queries, Groovy scripts, or Impex.</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot size={18} className="text-blue-400" />
                                </div>
                            )}

                            <div className={`max-w-[75%] rounded-2xl px-6 py-4 ${msg.role === 'user' ? 'bg-blue-600 text-white [&_p]:text-white' : msg.isThinking ? 'bg-[#1a1a1a]/50 border border-blue-500/30 text-gray-300 animate-pulse' : 'bg-[#1a1a1a] border border-[#333] text-gray-100'}`}>
                                {msg.role === 'model' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && !msg.isThinking && (
                                    <button onClick={() => toggleThinking(idx)} className="text-xs text-blue-400 hover:text-blue-300 mb-2 flex items-center gap-1">
                                        {showThinkingFor[idx] ? <><EyeOff size={12} /> Hide thinking</> : <><Eye size={12} /> Show thinking</>}
                                    </button>
                                )}
                                {msg.role === 'model' && showThinkingFor[idx] && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                                    <div className="mb-4 p-3 bg-[#0a0a0a] rounded-lg text-xs text-gray-400">
                                        {msg.thinkingSteps.map((step, i) => <div key={i} className="mb-1">{i + 1}. {step}</div>)}
                                    </div>
                                )}
                                <div className="markdown-content">
                                    {msg.isThinking ? (
                                        <div>Thinking...{msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-400">
                                                {msg.thinkingSteps.map((s, i) => <div key={i}>{i + 1}. {s}</div>)}
                                            </div>
                                        )}</div>
                                    ) : msg.role === 'model' ? renderContentWithSources(msg.content) : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                                </div>
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-1">
                                    <User size={18} className="text-gray-400" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="border-t border-[#333] bg-[#0a0a0a] p-4">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Ask a question..."
                        className="w-full bg-[#111] border border-[#333] rounded-xl pl-6 pr-14 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none min-h-[60px] max-h-[200px]"
                        disabled={isLoading}
                        rows={1}
                        style={{ height: 'auto', minHeight: '60px' }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-3 bottom-3 p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"><Send size={18} /></button>
                </form>
            </div>
            {selectedDocId && <DocumentModal docId={selectedDocId} onClose={() => setSelectedDocId(null)} />}
        </div>
    );
}
