import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

export default function SourceBadge({ docId, onClick }) {
    return (
        <button
            onClick={() => onClick(docId)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-full text-xs font-medium text-blue-300 transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
        >
            <FileText size={12} />
            <span>Source: {docId.substring(0, 8)}...</span>
            <ExternalLink size={10} className="opacity-60" />
        </button>
    );
}
