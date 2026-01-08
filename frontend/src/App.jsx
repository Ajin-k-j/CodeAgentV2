import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MessageSquare, Database, FileCode, Cpu } from 'lucide-react';
import Chat from './components/Chat';
import KnowledgeBase from './components/KnowledgeBase';
import Extractor from './components/Extractor';
import { ChatProvider } from './context/ChatContext';

function NavItem({ to, icon: Icon, label }) {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </Link>
    );
}

function App() {
    return (
        <Router>
            <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-[#333] flex flex-col p-4 bg-[#111]">
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Cpu size={20} className="text-white" />
                        </div>
                        <h1 className="font-bold text-xl tracking-tight">HD Code Agent</h1>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <NavItem to="/" icon={MessageSquare} label="Chat" />
                        <NavItem to="/kb" icon={Database} label="Knowledge Base" />
                        <NavItem to="/extract" icon={FileCode} label="AI Extractor" />
                    </nav>

                    <div className="mt-auto pt-4 border-t border-[#333] text-xs text-gray-500 px-2">
                        v0.1.0 Prototype
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-purple-900/10 pointer-events-none" />
                    <ChatProvider>
                        <Routes>
                            <Route path="/" element={<Chat />} />
                            <Route path="/kb" element={<KnowledgeBase />} />
                            <Route path="/extract" element={<Extractor />} />
                        </Routes>
                    </ChatProvider>
                </div>
            </div>
        </Router>
    );
}

export default App;
