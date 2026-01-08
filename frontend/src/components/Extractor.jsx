import React, { useState } from 'react';
import { Sparkles, Save } from 'lucide-react';
import SuccessModal from './SuccessModal';
import { api } from '../services/api';

export default function Extractor() {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleAnalyze = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const data = await api.extractMetadata(text);
            setResult(data);
        } catch (e) {
            console.error(e);
            setSuccessMessage({ title: 'Error', message: 'Failed to analyze content. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!text.trim()) return;
        setSaving(true);
        try {
            const data = await api.extractAndSave(text, 'code');
            setSuccessMessage({
                title: 'Success!',
                message: `Document saved to Knowledge Base!\n\nID: ${data.id}\nTitle: ${data.title}\nTags: ${data.tags.join(', ')}`
            });
            setText('');
            setResult(null);
        } catch (e) {
            console.error(e);
            setSuccessMessage({ title: 'Error', message: 'Failed to save to Knowledge Base. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-2">AI Extractor</h1>
            <p className="text-gray-400 mb-8">Paste code or text to automatically generate metadata and add to KB.</p>

            <div className="flex gap-8 flex-1 min-h-0">
                <div className="flex-1 flex flex-col">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your Groovy script, Impex, or Query here..."
                        className="flex-1 bg-[#111] border border-[#333] rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-blue-500 resize-none mb-4"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !text.trim()}
                        className="btn btn-primary w-full py-3"
                    >
                        {loading ? <Sparkles className="animate-spin" /> : <Sparkles />}
                        {loading ? 'Analyzing...' : 'Analyze Content'}
                    </button>
                </div>

                {result && (
                    <div className="w-1/3 bg-[#111] border border-[#333] rounded-xl p-6 flex flex-col animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4 text-blue-400">Analysis Result</h3>

                        <div className="mb-4">
                            <label className="text-xs text-gray-500 uppercase font-bold">Title</label>
                            <div className="text-white font-medium mt-1">{result.title}</div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs text-gray-500 uppercase font-bold">Summary</label>
                            <p className="text-gray-300 text-sm mt-1">{result.summary}</p>
                        </div>

                        <div className="mb-6">
                            <label className="text-xs text-gray-500 uppercase font-bold">Tags</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {result.tags.map((tag, i) => (
                                    <span key={i} className="text-xs bg-blue-600/20 border border-blue-500/30 px-3 py-1 rounded-full text-blue-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-secondary w-full"
                            >
                                {saving ? 'Saving...' : 'Save to Knowledge Base'}
                                {!saving && <Save size={16} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {successMessage && (
                <SuccessModal
                    title={successMessage.title}
                    message={successMessage.message}
                    onClose={() => setSuccessMessage(null)}
                />
            )}
        </div>
    );
}
