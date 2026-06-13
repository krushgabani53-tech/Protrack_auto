import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { api } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Users, FileText, CheckCircle2, XCircle, Loader2, Target, X, ShieldAlert } from 'lucide-react';

interface Group {
    group_id: string;
    group_name: string;
    status: string;
    member_count: string | number;
    created_at: string;
}

interface Member {
    student_id: string;
    email: string;
    prn_no: string;
    roll_no: string;
    is_leader?: boolean;
}

interface Proposal {
    proposal_id: string;
    title: string;
    domain_tags: string[];
    is_approved: boolean | null;
    plagiarism_score?: number | null;
}

export const GuideGroups: React.FC = () => {
    const { token } = useAuthStore();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'CHAT'>('DETAILS');
    const [newMessage, setNewMessage] = useState('');
    
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isActioning, setIsActioning] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchGroups = async () => {
            if (!token) return;
            setIsLoadingGroups(true);
            try {
                const list = await api.getGroups(token);
                setGroups(list);
                if (list.length > 0) {
                    loadGroupDetails(list[0]);
                }
            } catch (err: any) {
                console.error(err);
                showToast('error', err.message || 'Failed to load groups');
            } finally {
                setIsLoadingGroups(false);
            }
        };
        fetchGroups();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    const loadGroupDetails = async (group: Group) => {
        if (!token) return;
        setSelectedGroup(group);
        setIsLoadingDetails(true);
        try {
            const [mList, pList, chatList] = await Promise.all([
                api.getMembers(token, group.group_id),
                api.getProposals(token, group.group_id),
                api.getGroupChat(token, group.group_id)
            ]);
            setMembers(Array.isArray(mList) ? mList : []);
            setProposals(Array.isArray(pList) ? pList : []);
            setChatMessages(Array.isArray(chatList) ? chatList : []);
        } catch (err: any) {
            console.error(err);
            showToast('error', err.message || 'Failed to load details');
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const handleProposalAction = async (proposalId: string, isApproved: boolean) => {
        // Obsolete: Guides should use the dedicated Topic Approvals page for the multi-stage SPPU workflow
        showToast('error', 'Please use the dedicated Topic Approvals tab to review topics.');
    };

    const handleCheckPlagiarism = async (proposalId: string) => {
        if (!token || !selectedGroup) return;
        setIsActioning(true);
        try {
            const data = await api.checkPlagiarism(token, proposalId);
            showToast('success', `Plagiarism score: ${data.plagiarism_score}%`);
            // Reload proposals
            const pList = await api.getProposals(token, selectedGroup.group_id);
            setProposals(Array.isArray(pList) ? pList : []);
        } catch (err: any) {
            console.error(err);
            showToast('error', err.message || 'Failed to check plagiarism');
        } finally {
            setIsActioning(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !newMessage.trim() || !token) return;
        try {
            await api.sendGroupMessage(token, selectedGroup.group_id, newMessage.trim());
            setNewMessage('');
            // refresh chat
            const chatData = await api.getGroupChat(token, selectedGroup.group_id);
            setChatMessages(Array.isArray(chatData) ? chatData : []);
        } catch (err) {
            showToast('error', 'Failed to send message');
        }
    };

    return (
        <AppShell currentPage="/guide/groups">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-slide-up ${
                    toast.type === 'success'
                        ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-900/90 border-red-500/30 text-red-300'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
                </div>
            )}

            <div className="mb-8 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                    <Users size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white">My Groups</h1>
                    <p className="text-white/40 text-sm">Review groups and project proposals</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Panel: Group List */}
                <div className="col-span-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                    <div className="p-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">
                            Assigned Groups ({groups.length})
                        </h3>
                        {isLoadingGroups && <Loader2 size={14} className="animate-spin text-white/30" />}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {groups.length === 0 && !isLoadingGroups && (
                            <div className="text-center py-8 text-white/30 text-sm font-semibold">
                                No groups assigned yet.
                            </div>
                        )}
                        {groups.map(g => (
                            <button
                                key={g.group_id}
                                onClick={() => loadGroupDetails(g)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    selectedGroup?.group_id === g.group_id
                                        ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/10'
                                        : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                                }`}
                            >
                                <h4 className={`text-sm font-bold mb-1 ${selectedGroup?.group_id === g.group_id ? 'text-purple-300' : 'text-white'}`}>
                                    {g.group_name}
                                </h4>
                                <div className="text-[10px] text-white/40 font-semibold flex justify-between uppercase tracking-wider">
                                    <span>{g.member_count} Members</span>
                                    <span>{g.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Details */}
                <div className="col-span-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                    {!selectedGroup ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/20">
                            <Target size={48} className="mb-4 opacity-50" />
                            <p className="font-semibold">Select a group to view details</p>
                        </div>
                    ) : isLoadingDetails ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 size={24} className="animate-spin text-purple-500" />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Tabs */}
                            <div className="flex gap-4 border-b border-white/10 pb-2 mb-6">
                                <button
                                    onClick={() => setActiveTab('DETAILS')}
                                    className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'DETAILS' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/40 hover:text-white/70'}`}
                                >
                                    Group Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('CHAT')}
                                    className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'CHAT' ? 'border-purple-500 text-purple-400' : 'border-transparent text-white/40 hover:text-white/70'}`}
                                >
                                    Discussion
                                </button>
                            </div>

                            {activeTab === 'DETAILS' ? (
                                <>
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black text-white mb-2">{selectedGroup.group_name}</h2>
                                        <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Team Members ({members.length})</p>
                                    </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {members.map(m => (
                                    <div key={m.student_id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex flex-col">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold text-white">{m.email.split('@')[0]}</span>
                                            {m.is_leader && <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">Leader</span>}
                                        </div>
                                        <span className="text-xs text-white/40">{m.prn_no} • {m.roll_no}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} />
                                    Project Proposals ({proposals.length})
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {proposals.length === 0 && (
                                    <div className="p-6 text-center text-white/30 text-sm font-semibold rounded-xl border border-white/[0.05] border-dashed">
                                        No proposals submitted yet.
                                    </div>
                                )}
                                {proposals.map(p => (
                                    <div key={p.proposal_id} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                                        <div className="flex items-start justify-between mb-4">
                                            <h4 className="text-lg font-bold text-white max-w-[70%]">{p.title}</h4>
                                            
                                            {p.is_approved === true && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
                                                    <CheckCircle2 size={14} /> Approved
                                                </span>
                                            )}
                                            {p.is_approved === false && (
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold">
                                                    <XCircle size={14} /> Rejected
                                                </span>
                                            )}
                                            {p.is_approved === null && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-white/40 italic">Review in Topic Approvals tab</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {p.domain_tags.map(tag => (
                                                <span key={tag} className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                                            {p.plagiarism_score !== undefined && p.plagiarism_score !== null ? (
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded border ${
                                                        p.plagiarism_score > 30 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                        p.plagiarism_score > 15 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    }`}>
                                                        {p.plagiarism_score}% Plagiarized
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-white/30 italic">Not checked yet</span>
                                            )}
                                            
                                            <button
                                                onClick={() => handleCheckPlagiarism(p.proposal_id)}
                                                disabled={isActioning}
                                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                <ShieldAlert size={14} /> Run Plagiarism Check
                                            </button>
                                        </div>
                                        </div>
                                    ))}
                                </div>
                                </>
                            ) : (
                                <div className="flex flex-col h-full min-h-[400px]">
                                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-white/30 text-xs mt-10">No messages yet. Start the discussion!</div>
                                        ) : (
                                            chatMessages.map(msg => (
                                                <div key={msg.message_id} className={`flex flex-col ${msg.is_announcement ? 'items-center' : (msg.sender_email === useAuthStore.getState().user?.email ? 'items-end' : 'items-start')}`}>
                                                    {msg.is_announcement ? (
                                                        <div className="bg-orange-500/10 border border-orange-500/20 text-orange-300 px-4 py-2 rounded-xl text-xs max-w-[80%] text-center">
                                                            <strong className="block mb-1 text-[10px] uppercase tracking-wider text-orange-400">Global Announcement</strong>
                                                            {msg.content}
                                                        </div>
                                                    ) : (
                                                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender_email === useAuthStore.getState().user?.email ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/10 text-white/90 rounded-tl-none'}`}>
                                                            <div className="flex justify-between items-baseline gap-4 mb-1">
                                                                <span className="text-[10px] font-bold opacity-50">{msg.sender_email.split('@')[0]} ({msg.sender_role})</span>
                                                                <span className="text-[9px] opacity-40">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                            </div>
                                                            <p className="text-sm">{msg.content}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                                        />
                                        <button type="submit" disabled={!newMessage.trim()} className="px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl disabled:opacity-50 hover:shadow-lg transition-all">
                                            Send
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
            
            <style>{`
                @keyframes slide-up { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
                .animate-slide-up{animation:slide-up 0.3s ease-out}
            `}</style>
        </AppShell>
    );
};
