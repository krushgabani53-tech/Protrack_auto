import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import {
    Users, Plus, UserPlus, FileText,
    CheckCircle2, Clock, X, ChevronRight, Loader2
} from 'lucide-react';

interface Group {
    group_id: string;
    group_name: string;
    status: string;
    member_count: number;
}

interface Member {
    student_id: string;
    email: string;
    prn_no: string;
    roll_no: string;
}

interface Proposal {
    proposal_id: string;
    title: string;
    domain_tags: string[];
    is_approved: boolean | null;
}

export const StudentGroups: React.FC = () => {
    const { token } = useAuthStore();
    const location = useLocation();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'DETAILS' | 'CHAT'>('DETAILS');
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [newPrn, setNewPrn] = useState('');
    const [proposalTitle, setProposalTitle] = useState('');
    const [proposalTags, setProposalTags] = useState('');

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchGroups = async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const data = await api.getGroups(token);
            const list = Array.isArray(data) ? data : [];
            if (list.length > 0) {
                setGroups(list);
                setSelectedGroup(list[0]);
                setMembers([]);
                setProposals([]);
            } else {
                setGroups([]);
                setSelectedGroup(null);
            }
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to fetch groups');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { 
        fetchGroups(); 
        if (location.state?.openCreateModal) {
            setShowCreateModal(true);
            // clear state so it doesn't reopen on reload
            window.history.replaceState({}, document.title);
        }
    }, [location.state]); // eslint-disable-line

    const loadGroupDetail = async (group: Group) => {
        setSelectedGroup(group);
        try {
            if (token) {
                const [membersData, proposalsData] = await Promise.all([
                    api.getMembers(token, group.group_id),
                    api.getProposals(token, group.group_id),
                    api.getGroupChat(token, group.group_id),
                ]);
                const mList = Array.isArray(membersData) ? membersData : [];
                const pList = Array.isArray(proposalsData) ? proposalsData : [];
                setMembers(mList);
                setProposals(pList);
                setChatMessages(Array.isArray(chatMessages) ? chatMessages : []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            setIsLoading(true);
            if (token) {
                await api.createGroup(token, newGroupName.trim());
            }
            fetchGroups(); // Re-fetch from DB so we get the real IDs
            showToast('success', `Group "${newGroupName.trim()}" created!`);
            setShowCreateModal(false);
            setNewGroupName('');
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : 'Failed to create group');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !newPrn.trim()) return;
        try {
            setIsLoading(true);
            if (token) {
                await api.addMember(token, selectedGroup.group_id, newPrn.trim());
                // Re-fetch members to get exact DB rows
                const mData = await api.getMembers(token, selectedGroup.group_id);
                setMembers(Array.isArray(mData) ? mData : []);
            }
            showToast('success', 'Member added successfully!');
            setShowAddMemberModal(false);
            setNewPrn('');
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : 'Failed to add member');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !proposalTitle.trim()) return;
        try {
            setIsLoading(true);
            const tags = proposalTags.split(',').map(t => t.trim()).filter(Boolean);
            if (token) {
                await api.submitProposal(token, selectedGroup.group_id, proposalTitle.trim(), tags);
                const pData = await api.getProposals(token, selectedGroup.group_id);
                setProposals(Array.isArray(pData) ? pData : []);
            }
            showToast('success', 'Proposal submitted!');
            setShowProposalModal(false);
            setProposalTitle('');
            setProposalTags('');
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : 'Failed to submit proposal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLockGroup = async () => {
        if (!selectedGroup || !token) return;
        if (!window.confirm('Are you sure? This will finalize your group members and request a Guide Allocation.')) return;
        try {
            setIsLoading(true);
            await api.updateGroupStatus(token, selectedGroup.group_id, 'WAITING_ALLOCATION');
            showToast('success', 'Group finalized and submitted for allocation!');
            fetchGroups(); // Re-fetch everything to update UI
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : 'Failed to finalize group');
        } finally {
            setIsLoading(false);
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

    const statusColor = (status: string) => {
        if (status === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (status === 'WAITING_ALLOCATION') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        return 'bg-white/5 text-white/40 border-white/10';
    };

    return (
        <AppShell currentPage="/student/groups">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-slide-up ${
                    toast.type === 'success'
                        ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-900/90 border-red-500/30 text-red-300'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
                </div>
            )}

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                            <Users size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">My Groups</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Manage your project groups and team members</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={16} /> Create Group
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Group List */}
                <div className="lg:col-span-1">
                    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
                        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                            <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Groups ({groups.length})</p>
                            {isLoading && <Loader2 size={13} className="animate-spin text-white/30" />}
                        </div>
                        {groups.length === 0 && !isLoading && (
                            <div className="p-8 text-center text-white/30 text-xs font-semibold">
                                You are not part of any group yet.<br/>Create one to get started!
                            </div>
                        )}
                        {groups.map(group => (
                            <button
                                key={group.group_id}
                                onClick={() => loadGroupDetail(group)}
                                className={`w-full text-left p-4 border-b border-white/[0.04] hover:bg-white/[0.04] transition-all flex items-center justify-between group ${
                                    selectedGroup?.group_id === group.group_id
                                        ? 'bg-white/[0.07] border-l-2 border-l-blue-500'
                                        : ''
                                }`}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">{group.group_name}</p>
                                    <p className="text-xs text-white/35 mt-0.5">{group.member_count}/4 members</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${statusColor(group.status)}`}>
                                        {group.status === 'WAITING_ALLOCATION' ? 'Pending' : group.status}
                                    </span>
                                    <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Group Detail */}
                <div className="lg:col-span-2">
                    {!selectedGroup ? (
                        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-16 text-center h-full flex flex-col items-center justify-center">
                            <Users size={36} className="text-white/10 mb-3" />
                            <p className="text-sm text-white/30">Select a group to view details</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Tabs */}
                            <div className="flex gap-4 border-b border-white/10 pb-2 mb-4">
                                <button
                                    onClick={() => setActiveTab('DETAILS')}
                                    className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'DETAILS' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white/70'}`}
                                >
                                    Group Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('CHAT')}
                                    className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'CHAT' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/40 hover:text-white/70'}`}
                                >
                                    Discussion
                                </button>
                            </div>

                            {activeTab === 'DETAILS' ? (
                                <>
                                    {/* Group header */}
                                    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
                                <div className="flex items-start justify-between mb-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{selectedGroup.group_name}</h2>
                                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border mt-1.5 ${statusColor(selectedGroup.status)}`}>
                                            {selectedGroup.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedGroup.status === 'FORMING' && (
                                            <button
                                                onClick={handleLockGroup}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
                                            >
                                                Lock & Submit
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
                                        >
                                            <UserPlus size={13} /> Add Member
                                        </button>
                                        {!proposals.length && (
                                            <button
                                                onClick={() => setShowProposalModal(true)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
                                            >
                                                <FileText size={13} /> Submit Proposal
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Members */}
                                <div>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Team Members</p>
                                    {members.length === 0 ? (
                                        <p className="text-xs text-white/30">No members. Add members by their PRN.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {members.map(m => (
                                                <div key={m.student_id} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {m.email?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-white truncate">{m.email?.split('@')[0]}</p>
                                                        <p className="text-[10px] text-white/35">{m.prn_no}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Proposals */}
                            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Project Proposals</p>
                                {proposals.length === 0 ? (
                                    <div className="text-center py-6">
                                        <FileText size={24} className="text-white/10 mx-auto mb-2" />
                                        <p className="text-xs text-white/30">No proposals yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {proposals.map(p => (
                                            <div key={p.proposal_id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-white">{p.title}</p>
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {p.domain_tags?.map(tag => (
                                                                <span key={tag} className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                                        p.is_approved === true
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : p.is_approved === false
                                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                        {p.is_approved === true
                                                            ? <><CheckCircle2 size={10} /> Approved</>
                                                            : p.is_approved === false
                                                            ? '✕ Rejected'
                                                            : <><Clock size={10} /> Pending</>}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </>
                            ) : (
                                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 flex flex-col h-[500px]">
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
                                                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender_email === useAuthStore.getState().user?.email ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/90 rounded-tl-none'}`}>
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
                                        <button type="submit" disabled={!newMessage.trim()} className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50 hover:shadow-lg transition-all">
                                            Send
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create Group Modal ── */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-7 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-6">Create New Group</h3>
                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="e.g. Cloud Computing Team"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2.5 text-sm text-white/50 border border-white/10 rounded-xl hover:bg-white/5 font-semibold transition-all">Cancel</button>
                                <button type="submit" disabled={isLoading}
                                    className="flex-1 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-40">
                                    {isLoading ? 'Creating…' : 'Create Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Add Member Modal ── */}
            {showAddMemberModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddMemberModal(false)} />
                    <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-7 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-6">Add Team Member</h3>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Student PRN Number</label>
                                <input
                                    type="text"
                                    value={newPrn}
                                    onChange={e => setNewPrn(e.target.value)}
                                    placeholder="e.g. 2021CS005"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowAddMemberModal(false)}
                                    className="flex-1 py-2.5 text-sm text-white/50 border border-white/10 rounded-xl hover:bg-white/5 font-semibold transition-all">Cancel</button>
                                <button type="submit" disabled={isLoading}
                                    className="flex-1 py-2.5 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-40">
                                    {isLoading ? 'Adding…' : 'Add Member'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Submit Proposal Modal ── */}
            {showProposalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProposalModal(false)} />
                    <div className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-7 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-6">Submit Project Proposal</h3>
                        <form onSubmit={handleSubmitProposal} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Project Title</label>
                                <input
                                    type="text"
                                    value={proposalTitle}
                                    onChange={e => setProposalTitle(e.target.value)}
                                    placeholder="e.g. Smart Irrigation using IoT"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                    Domain Tags <span className="normal-case font-normal text-white/25">(comma separated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={proposalTags}
                                    onChange={e => setProposalTags(e.target.value)}
                                    placeholder="e.g. IoT, Embedded, Cloud"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowProposalModal(false)}
                                    className="flex-1 py-2.5 text-sm text-white/50 border border-white/10 rounded-xl hover:bg-white/5 font-semibold transition-all">Cancel</button>
                                <button type="submit" disabled={isLoading}
                                    className="flex-1 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-40">
                                    {isLoading ? 'Submitting…' : 'Submit Proposal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-up { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
                .animate-slide-up{animation:slide-up 0.3s ease-out}
            `}</style>
        </AppShell>
    );
};
