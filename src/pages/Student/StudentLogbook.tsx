import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import {
    BookOpen, Plus, CheckCircle2, Clock,
    X, ChevronDown, ChevronUp, Loader2, RefreshCw, Link2
} from 'lucide-react';

interface Group { group_id: string; group_name: string; status: string; }

interface Logbook {
    log_id: string;
    week_number: number;
    work_summary: string;
    evidence_url?: string;
    guide_status: string;
    guide_remarks?: string;
    created_at: string;
}



export const StudentLogbook: React.FC = () => {
    const { token } = useAuthStore();
    const [logbooks, setLogbooks] = useState<any[]>([]);
    const [isFetchingLogs, setIsFetchingLogs] = useState(false);
    const [myGroup, setMyGroup] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    const [weekNumber, setWeekNumber] = useState('');
    const [workSummary, setWorkSummary] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [_uploading, setUploading] = useState(false);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        if (!token) return;
        setIsFetchingLogs(true);
        try {
            const groups = await api.getGroups(token);
            const groupList = Array.isArray(groups) ? groups : [];
            if (groupList.length > 0) {
                const group = groupList[0];
                setMyGroup(group);
                const logs = await api.getLogbooks(token, group.group_id);
                setLogbooks(Array.isArray(logs) ? logs : []);
            }
        } catch (err) {
            console.error('Failed to fetch logbooks:', err);
        } finally {
            setIsFetchingLogs(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!weekNumber || !workSummary.trim()) {
            showToast('error', 'Week number and work summary are required');
            return;
        }
        try {
            setIsSubmitting(true);
            let finalEvidenceUrl = evidenceUrl.trim();

            if (evidenceFile && token) {
                setUploading(true);
                try {
                    const uploadRes = await api.uploadEvidence(token, evidenceFile);
                    // Append full API url if it's a relative path, but local might be enough depending on how frontend displays it
                    finalEvidenceUrl = uploadRes.url;
                } catch (err) {
                    showToast('error', 'Failed to upload evidence file');
                    setIsSubmitting(false);
                    setUploading(false);
                    return;
                }
                setUploading(false);
            }

            const groupId = myGroup?.group_id;
            if (!groupId) { showToast('error', 'You are not in a group yet'); return; }

            if (token) {
                await api.submitLogbook(token, groupId, parseInt(weekNumber), workSummary.trim(), finalEvidenceUrl || undefined);
            }
            fetchData();
            showToast('success', `Week ${weekNumber} logbook submitted!`);
            setShowSubmitModal(false);
            setWeekNumber('');
            setWorkSummary('');
            setEvidenceUrl('');
            setEvidenceFile(null);
        } catch (err) {
            showToast('error', err instanceof Error ? err.message : 'Failed to submit logbook');
        } finally {
            setIsSubmitting(false);
            setUploading(false);
        }
    };

    const statusConfig = (status: string) => {
        switch (status) {
            case 'APPROVED': return { label: 'Approved', icon: <CheckCircle2 size={11} />, cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
            case 'NEEDS_REVISION': return { label: 'Needs Revision', icon: <RefreshCw size={11} />, cls: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
            default: return { label: 'Pending Review', icon: <Clock size={11} />, cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
        }
    };

    const approvedCount = logbooks.filter(l => l.guide_status === 'APPROVED').length;
    const pendingCount  = logbooks.filter(l => l.guide_status === 'PENDING').length;
    const revisionCount = logbooks.filter(l => l.guide_status === 'NEEDS_REVISION').length;

    return (
        <AppShell currentPage="/student/logbook">
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
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                            <BookOpen size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Logbook</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Weekly project progress journal</p>
                </div>
                <button
                    onClick={() => setShowSubmitModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all"
                >
                    <Plus size={16} /> New Entry
                </button>
            </div>



            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Entries', value: logbooks.length, color: 'from-purple-500 to-pink-500' },
                    { label: 'Approved', value: approvedCount, color: 'from-emerald-500 to-teal-500' },
                    { label: 'Pending', value: pendingCount, color: 'from-amber-500 to-orange-500' },
                    { label: 'Needs Revision', value: revisionCount, color: 'from-orange-500 to-red-500' },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl p-5 bg-white/[0.04] border border-white/[0.08]">
                        <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-2">{s.label}</p>
                        <p className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Logbook Entries */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
                <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">Weekly Entries</h2>
                    <button
                        onClick={fetchData}
                        className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                        {isFetchingLogs ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </button>
                </div>

                {isFetchingLogs && (
                    <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
                    </div>
                )}

                {!isFetchingLogs && logbooks.length === 0 && (
                    <div className="p-12 text-center text-white/25">
                        <BookOpen size={32} className="text-white/10 mx-auto mb-3" />
                        <p className="text-sm">No logbook entries yet. Submit your first weekly update above.</p>
                    </div>
                )}

                {!isFetchingLogs && logbooks.length > 0 && (
                    logbooks.map((log) => {
                        const sc = statusConfig(log.guide_status);
                        const isExpanded = expandedId === log.log_id;
                        return (
                            <div key={log.log_id} className="border-b border-white/[0.05] last:border-0">
                                <button
                                    onClick={() => setExpandedId(isExpanded ? null : log.log_id)}
                                    className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-black text-purple-300">W{log.week_number}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">Week {log.week_number}</p>
                                            <p className="text-xs text-white/35 mt-0.5 max-w-sm truncate">{log.work_summary}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                                        <span className="text-[10px] text-white/25">{log.created_at}</span>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${sc.cls}`}>
                                            {sc.icon} {sc.label}
                                        </span>
                                        {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 pb-5 space-y-3">
                                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Work Summary</p>
                                            <p className="text-sm text-white/70 leading-relaxed">{log.work_summary}</p>
                                        </div>
                                        {log.evidence_url && (
                                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2">
                                                <Link2 size={13} className="text-blue-400 flex-shrink-0" />
                                                <a href={log.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline break-all">
                                                    {log.evidence_url.split('/').pop()}
                                                </a>
                                            </div>
                                        )}
                                        {log.guide_remarks && (
                                            <div className={`p-4 rounded-xl border ${
                                                log.guide_status === 'APPROVED'
                                                    ? 'bg-emerald-500/[0.06] border-emerald-500/[0.15]'
                                                    : 'bg-orange-500/[0.06] border-orange-500/[0.15]'
                                            }`}>
                                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Guide Feedback</p>
                                                <p className="text-sm text-white/70 italic">"{log.guide_remarks}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Submit Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
                    <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-7 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-6">Submit Weekly Entry</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Week Number</label>
                                <input
                                    type="number" min="1" max="52"
                                    value={weekNumber}
                                    onChange={e => setWeekNumber(e.target.value)}
                                    placeholder={`Next: Week ${logbooks.length > 0 ? Math.max(...logbooks.map(l => l.week_number)) + 1 : 1}`}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Work Summary</label>
                                <textarea
                                    value={workSummary}
                                    onChange={e => setWorkSummary(e.target.value)}
                                    placeholder="Describe what you accomplished this week..."
                                    rows={5}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all resize-none"
                                />
                                <p className="text-[10px] text-white/25 mt-1 text-right">{workSummary.length} chars</p>
                            </div>
                            
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Evidence Attachment <span className="normal-case font-normal text-white/25">(Optional)</span></p>
                                
                                <div>
                                    <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Upload File</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.docx,.png,.jpg,.jpeg"
                                        onChange={e => {
                                            setEvidenceFile(e.target.files?.[0] || null);
                                            if (e.target.files?.[0]) setEvidenceUrl(''); // Clear url if file chosen
                                        }}
                                        className="w-full text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-500/20 file:text-purple-300 hover:file:bg-purple-500/30 transition-all" 
                                    />
                                    <p className="text-[10px] text-white/30 mt-1">Accepts PDF, DOCX, JPG, PNG (Max 5MB)</p>
                                </div>
                                
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px]">
                                        <span className="bg-slate-900 px-2 text-white/30 uppercase font-bold tracking-widest">OR</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Paste External Link</label>
                                    <input
                                        type="url"
                                        value={evidenceUrl}
                                        onChange={e => {
                                            setEvidenceUrl(e.target.value);
                                            if (e.target.value) setEvidenceFile(null); // Clear file if url pasted
                                        }}
                                        placeholder="https://github.com/..."
                                        disabled={evidenceFile !== null}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-lg text-xs focus:outline-none focus:border-white/30 transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowSubmitModal(false)}
                                    className="flex-1 py-2.5 text-sm text-white/50 border border-white/10 rounded-xl hover:bg-white/5 font-semibold transition-all">Cancel</button>
                                <button type="submit" disabled={isSubmitting}
                                    className="flex-1 py-2.5 text-sm bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-40">
                                    {isSubmitting ? 'Submitting…' : 'Submit Entry'}
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
