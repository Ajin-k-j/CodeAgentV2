import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, type = 'danger', singleButton = false }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-[#333] rounded-2xl shadow-2xl max-w-md w-full">
                <div className={`flex items-center gap-3 px-6 py-4 border-b border-[#333] ${type === 'danger' ? 'bg-red-900/20' : 'bg-green-900/20'
                    }`}>
                    {type === 'danger' ? (
                        <AlertTriangle size={24} className="text-red-400" />
                    ) : (
                        <CheckCircle size={24} className="text-green-400" />
                    )}
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                </div>

                <div className="p-6">
                    <p className="text-gray-300">{message}</p>
                </div>

                <div className="px-6 py-4 border-t border-[#333] bg-[#0a0a0a] flex justify-end gap-3">
                    {!singleButton && (
                        <button onClick={onCancel} className="btn btn-secondary bg-[#1a1a1a] hover:bg-[#222] text-gray-300 px-4 py-2 rounded-lg transition-colors">
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${type === 'danger'
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                    >
                        {singleButton ? 'Close' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}
