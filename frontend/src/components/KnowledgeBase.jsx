import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, Trash2, Edit2, Bot, X } from 'lucide-react';
import DocumentModal from './DocumentModal';
import EditDocModal from './EditDocModal';
import ConfirmModal from './ConfirmModal';

export default function KnowledgeBase() {
    const [docs, setDocs] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [aiFilter, setAiFilter] = useState('all');
    const [selectedTags, setSelectedTags] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [editingDoc, setEditingDoc] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        fetchDocs();
    }, []);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/kb');
            const data = await res.json();
            setDocs(data);
        } catch (e) {
            console.error(e);
            setConfirmAction({
                type: 'error',
                title: 'Connection Error',
                message: 'Could not connect to the backend. Please check your internet connection and try again.'
            });
        }
    };

    const handleDelete = (id) => {
        setConfirmAction({
            type: 'delete',
            id,
            title: 'Delete Document',
            message: 'Are you sure you want to delete this document? This action cannot be undone.'
        });
    };

    const confirmDelete = async () => {
        if (confirmAction?.type === 'delete') {
            await fetch(`http://localhost:8000/api/kb/${confirmAction.id}`, { method: 'DELETE' });
            fetchDocs();
        }
        setConfirmAction(null);
    };

    const handleVerify = (doc) => {
        setConfirmAction({
            type: 'verify',
            doc,
            title: 'Verify Document',
            message: 'Mark this document as verified? This will indicate that the content has been reviewed and approved.'
        });
    };

    const confirmVerify = async () => {
        if (confirmAction?.type === 'verify') {
            const doc = confirmAction.doc;
            await fetch(`http://localhost:8000/api/kb/${doc.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: doc.title,
                    content: doc.content,
                    tags: doc.tags,
                    type: doc.type,
                    summary: doc.summary,
                    ai_created: doc.ai_created,
                    status: 'verified'
                })
            });
            fetchDocs();
        }
        setConfirmAction(null);
    };

    const closeConfirm = () => {
        setConfirmAction(null);
    };

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const filteredDocs = docs.filter(doc => {
        const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
        const matchesAI = aiFilter === 'all' || (aiFilter === 'ai' && doc.ai_created) || (aiFilter === 'manual' && !doc.ai_created);
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => doc.tags?.includes(tag));
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase()) ||
            doc.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
        return matchesStatus && matchesAI && matchesTags && matchesSearch;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Knowledge Base</h1>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#111] border border-[#333] rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#111] border border-[#333] rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="verified">✓ Verified</option>
                        <option value="unverified">⚠ Unverified</option>
                    </select>
                    <select
                        value={aiFilter}
                        onChange={(e) => setAiFilter(e.target.value)}
                        className="bg-[#111] border border-[#333] rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                    >
                        <option value="all">All Sources</option>
                        <option value="ai">🤖 AI Created</option>
                        <option value="manual">👤 Manual</option>
                    </select>
                </div>
            </div>

            {/* Tag Filter Removed */}


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map(doc => (
                    <div
                        key={doc.id}
                        className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer group"
                        onClick={() => setSelectedDocId(doc.id)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${doc.status === 'verified'
                                ? 'bg-green-900/30 text-green-400'
                                : 'bg-yellow-900/30 text-yellow-400'
                                }`}>
                                {doc.status === 'verified' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                {doc.status.toUpperCase()}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingDoc(doc); }}
                                    className="p-1.5 hover:bg-blue-900/50 rounded text-blue-400"
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </button>
                                {doc.status === 'unverified' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleVerify(doc); }}
                                        className="p-1.5 hover:bg-green-900/50 rounded text-green-400"
                                        title="Verify"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                    className="p-1.5 hover:bg-red-900/50 rounded text-red-400"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{doc.title}</h3>
                        {doc.summary && <p className="text-sm text-gray-400 line-clamp-2 mb-3">{doc.summary}</p>}

                        <div className="flex flex-wrap gap-2 mt-4">
                            {doc.tags?.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-600/20 border border-blue-500/30 px-2 py-1 rounded-full text-blue-300">
                                    {tag}
                                </span>
                            ))}
                            {doc.tags?.length > 3 && (
                                <span className="text-xs text-gray-500">+{doc.tags.length - 3}</span>
                            )}
                        </div>

                        {/* AI Created Badge */}
                        {doc.ai_created && (
                            <div className="mt-3 pt-3 border-t border-[#333]">
                                <div className="flex items-center gap-1.5 text-xs text-purple-400">
                                    <Bot size={12} />
                                    <span>Added by AI</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredDocs.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                    <p>No documents found matching your filters.</p>
                </div>
            )}

            {selectedDocId && (
                <DocumentModal
                    docId={selectedDocId}
                    onClose={() => setSelectedDocId(null)}
                />
            )}

            {editingDoc && (
                <EditDocModal
                    doc={editingDoc}
                    onClose={() => setEditingDoc(null)}
                    onSave={fetchDocs}
                />
            )}

            {confirmAction && (
                <ConfirmModal
                    title={confirmAction.title}
                    message={confirmAction.message}
                    type={confirmAction.type === 'delete' ? 'danger' : confirmAction.type === 'error' ? 'danger' : 'success'}
                    onConfirm={confirmAction.type === 'error' ? closeConfirm : confirmAction.type === 'delete' ? confirmDelete : confirmVerify}
                    onCancel={closeConfirm}
                    singleButton={confirmAction.type === 'error'}
                />
            )}
        </div>
    );
}
