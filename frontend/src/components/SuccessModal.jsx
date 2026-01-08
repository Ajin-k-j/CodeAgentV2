import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function SuccessModal({ title, message, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-[#333] rounded-2xl shadow-2xl max-w-md w-full animate-fade-in">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#333] bg-green-900/20">
                    <CheckCircle size={24} className="text-green-400" />
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                </div>

                <div className="p-6">
                    <p className="text-gray-300 whitespace-pre-line">{message}</p>
                </div>

                <div className="px-6 py-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end">
                    <button onClick={onClose} className="btn btn-primary">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
