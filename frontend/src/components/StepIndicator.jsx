import React from 'react';
import { Loader2 } from 'lucide-react';

export default function StepIndicator({ step }) {
    if (!step) return null;

    return (
        <div className="fixed top-0 left-64 right-0 z-50 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-md border-b border-blue-500/30">
            <div className="max-w-4xl mx-auto px-6 py-3 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-sm font-medium text-blue-200 animate-pulse">
                    {step}
                </span>
            </div>
        </div>
    );
}
