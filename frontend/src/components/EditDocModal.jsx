import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

export default function EditDocModal({ doc, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        summary: '',
        tags: '',
        type: 'code',
        status: 'unverified',
        ai_created: false
    });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        const fetchFullDoc = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/kb/${doc.id}`);
                const fullDoc = await response.json();
                setFormData({
                    title: fullDoc.title || '',
                    content: fullDoc.content || '',
                    summary: fullDoc.summary || '',
                    tags: fullDoc.tags?.join(', ') || '',
                    type: fullDoc.type || 'code',
                    status: fullDoc.status || 'unverified',
                    ai_created: fullDoc.ai_created || false
                });
            } catch (error) {
                console.error('Error fetching document:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFullDoc();
    }, [doc.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
            await fetch(`http://localhost:8000/api/kb/${doc.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    summary: formData.summary,
                    tags: tagsArray,
                    type: formData.type,
                    status: formData.status,
                    ai_created: formData.ai_created
                })
            });
            onSave();
            onClose();
        } catch (error) {
            alert('Error saving document');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-[#333] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                    <h2 className="text-lg font-semibold text-white">Edit Document</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-300 block mb-2">Title</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input" />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-300 block mb-2">Summary</label>
                                <textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} className="textarea" rows="2" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-300">Content</label>
                                    <button
                                        onClick={() => setPreviewMode(!previewMode)}
                                        className="text-xs flex items-center gap-1 px-2 py-1 bg-blue-900/30 hover:bg-blue-900/50 rounded text-blue-300 transition-colors"
                                    >
                                        {previewMode ? <><Edit3 size={12} /> Edit Raw</> : <><Eye size={12} /> Preview</>}
                                    </button>
                                </div>

                                {previewMode ? (
                                    <div className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 min-h-[250px] max-h-[500px] overflow-y-auto markdown-content">
                                        <ReactMarkdown components={{
                                            code({ node, inline, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const codeString = String(children).replace(/\n$/, '');
                                                return !inline && match ? (
                                                    <CodeBlock code={codeString} language={match[1]} />
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                        }}>
                                            {formData.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full bg-[#111] border border-[#333] rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:border-blue-500 resize-none"
                                        rows="10"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-300 block mb-2">Tags (comma separated)</label>
                                <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="input" placeholder="flexsearch, product, query" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-2">Type</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input">
                                        <option value="code">Code</option>
                                        <option value="text">Text</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-300 block mb-2">Status</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input">
                                        <option value="verified">Verified</option>
                                        <option value="unverified">Unverified</option>
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-secondary">Cancel</button>
                    <button onClick={handleSave} disabled={saving || loading} className="btn btn-primary">
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
