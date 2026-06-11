import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { CheckSquare, Clock, CheckCircle2, X, AlertOctagon, RefreshCw, Link2, MessageSquare } from 'lucide-react';

interface Group {
    group_id: string;
    group_name: string;
}

interface Logbook {
    log_id: string;
    group_id: string;
    week_number: number;
    work_summary: string;
    evidence_url?: string;
    guide_status: string;
    guide_remarks?: string;
    created_at: string;
    group_name?: string;
}

export const GuideReviews: React.FC = () => {
    const { token } = useAuthStore();
    const [logbooks, setLogbooks] = useState<Logbook[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchAllLogbooks = async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const groups: Group[] = await api.getGroups(token, 'ACTIVE');
            let allLogs: Logbook[] = [];

            for (const group of groups) {
                try {
                    const logs = await api.getLogbooks(token, group.group_id);
                    const logArray = Array.isArray(logs) ? logs : (logs as any).logbooks || [];
                    const mappedLogs = logArray.map((l: any) => ({
                        ...l,
                        group_name: group.group_name
                    }));
                    allLogs = [...allLogs, ...mappedLogs];
                } catch (e) {
                    console.error("Failed to fetch logs for group", group.group_id);
                }
            }

            // Sort by created_at desc
            allLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setLogbooks(allLogs);
        } catch (error) {
            console.error("Failed to fetch logbooks", error);
            showToast('error', 'Failed to fetch logbooks.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllLogbooks();
    }, [token]);

    const handleReview = async (logId: string, status: string) => {
        if (!token) return;
        try {
            setIsSubmitting(true);
            await api.approveLogbook(token, logId, status, remarks);
            showToast('success', `Logbook marked as ${status.replace('_', ' ')}`);
            setRemarks('');
            setExpandedId(null);
            fetchAllLogbooks();
        } catch (error) {
            showToast('error', 'Failed to submit review.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkApprove = async () => {
        if (!token || selectedLogs.length === 0) return;
        try {
            setIsSubmitting(true);
            await api.bulkApproveLogbooks(token, selectedLogs);
            showToast('success', `Bulk approved ${selectedLogs.length} logbooks`);
            setSelectedLogs([]);
            fetchAllLogbooks();
        } catch (error) {
            showToast('error', 'Failed to bulk approve.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const pendingLogs = logbooks.filter(l => l.guide_status === 'PENDING');
    const reviewedLogs = logbooks.filter(l => l.guide_status !== 'PENDING');

    return (
        <AppShell currentPage="/guide/reviews">
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-slide-up ${
                    toast.type === 'success'
                        ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-900/90 border-red-500/30 text-red-300'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertOctagon size={16} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
                </div>
            )}

            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                            <CheckSquare size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Logbook Reviews</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Review weekly submissions from your assigned groups</p>
                </div>
                <button
                    onClick={fetchAllLogbooks}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white/70 text-sm font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all"
                >
                    {isLoading ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Queue */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <Clock size={16} className="text-amber-400" />
                            Pending Reviews
                        </h2>
                        <div className="flex items-center gap-3">
                            {selectedLogs.length > 0 && (
                                <button
                                    onClick={handleBulkApprove}
                                    disabled={isSubmitting}
                                    className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/30 transition-colors"
                                >
                                    Approve Selected ({selectedLogs.length})
                                </button>
                            )}
                            <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                                {pendingLogs.length}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[600px]">
                        {pendingLogs.length === 0 ? (
                            <div className="text-center py-10">
                                <CheckCircle2 size={32} className="text-white/10 mx-auto mb-3" />
                                <p className="text-sm text-white/30">All caught up! No pending logbooks.</p>
                            </div>
                        ) : (
                            pendingLogs.map((log) => {
                                const isExpanded = expandedId === log.log_id;
                                const isSelected = selectedLogs.includes(log.log_id);
                                return (
                                    <div key={log.log_id} className="rounded-xl border border-white/[0.08] overflow-hidden transition-all bg-white/[0.02] hover:bg-white/[0.04]">
                                        <div className="flex items-center w-full">
                                            <div className="pl-4 py-4 flex items-center">
                                                <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedLogs(prev => [...prev, log.log_id]);
                                                        } else {
                                                            setSelectedLogs(prev => prev.filter(id => id !== log.log_id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setExpandedId(isExpanded ? null : log.log_id);
                                                    if (!isExpanded) setRemarks('');
                                                }}
                                                className="flex-1 flex items-center justify-between p-4 text-left"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-white mb-1">{log.group_name}</p>
                                                    <p className="text-xs text-amber-400 font-medium">Week {log.week_number} <span className="text-white/20 mx-2">•</span> <span className="text-white/40">{new Date(log.created_at).toLocaleDateString()}</span></p>
                                                </div>
                                                <span className="text-xs font-bold text-white/50 px-3 py-1.5 rounded-lg bg-white/5">Review →</span>
                                            </button>
                                        </div>
                                        
                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-white/[0.05] pt-4 mt-2">
                                                <div className="p-4 rounded-xl bg-black/20 border border-white/5 mb-4">
                                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Work Summary</p>
                                                    <p className="text-sm text-white/70 leading-relaxed">{log.work_summary}</p>
                                                </div>
                                                
                                                {log.evidence_url && (
                                                    <div className="p-3 mb-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                                                        <Link2 size={14} className="text-blue-400 flex-shrink-0" />
                                                        <a href={log.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline break-all">
                                                            View Evidence Attachment
                                                        </a>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-widest">
                                                        <MessageSquare size={14} /> Guide Feedback
                                                    </label>
                                                    <textarea
                                                        value={remarks}
                                                        onChange={e => setRemarks(e.target.value)}
                                                        placeholder="Add remarks or feedback..."
                                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg text-sm focus:outline-none focus:border-purple-500/50 transition-all resize-none h-20"
                                                    />
                                                    
                                                    <div className="flex gap-2 pt-2">
                                                        <button 
                                                            onClick={() => handleReview(log.log_id, 'NEEDS_REVISION')}
                                                            disabled={isSubmitting}
                                                            className="flex-1 py-2 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 font-bold transition-all disabled:opacity-50"
                                                        >
                                                            Needs Revision
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReview(log.log_id, 'APPROVED')}
                                                            disabled={isSubmitting}
                                                            className="flex-1 py-2 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 font-bold transition-all disabled:opacity-50"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* History / Reviewed Logs */}
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden flex flex-col opacity-80">
                    <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <CheckSquare size={16} className="text-emerald-400" />
                            Review History
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[600px]">
                        {reviewedLogs.length === 0 ? (
                            <p className="text-center text-sm text-white/30 py-8">No reviewed logbooks yet.</p>
                        ) : (
                            reviewedLogs.map(log => (
                                <div key={log.log_id} className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-white/80">{log.group_name} <span className="text-xs text-white/30 font-normal ml-2">Week {log.week_number}</span></p>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                                            log.guide_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                        }`}>
                                            {log.guide_status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-white/50 truncate mb-2">{log.work_summary}</p>
                                    {log.guide_remarks && (
                                        <p className="text-xs text-white/40 italic bg-white/5 p-2 rounded">"{log.guide_remarks}"</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes slide-up { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
                .animate-slide-up{animation:slide-up 0.3s ease-out}
            `}</style>
        </AppShell>
    );
};
