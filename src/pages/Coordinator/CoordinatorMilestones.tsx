import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Calendar, Trash2, CheckCircle2, Loader2, AlertCircle, Plus, X, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Milestone {
    milestone_id: string;
    batch_year: string;
    milestone_key: string;
    milestone_name: string;
    due_date: string;
    is_completed: boolean;
}

export const CoordinatorMilestones: React.FC = () => {
    const { token } = useAuthStore();
    const [batchYear, setBatchYear] = useState(new Date().getFullYear().toString());
    const [batchYearsList, setBatchYearsList] = useState<string[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [upcomingMilestone, setUpcomingMilestone] = useState<Milestone | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInserting, setIsInserting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');
    
    const [showAddCustom, setShowAddCustom] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customDate, setCustomDate] = useState('');

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            // Only fetch batch years if list is empty
            if (batchYearsList.length === 0) {
                const years = await api.getBatchYears(token);
                const yearArr = Array.isArray(years) ? years : [];
                if (!yearArr.includes(batchYear)) {
                    yearArr.push(batchYear);
                }
                setBatchYearsList(yearArr.sort().reverse());
            }

            const [ms, up] = await Promise.all([
                api.getMilestones(token, batchYear),
                api.getUpcomingMilestone(token, batchYear).catch(() => null)
            ]);
            setMilestones(Array.isArray(ms) ? ms : []);
            setUpcomingMilestone(up && up.milestone_id ? up : null);
        } catch (err: any) {
            setError('Failed to load milestones');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, batchYear]);

    const handleLoadDefaults = async () => {
        if (!token) return;
        setIsInserting(true);
        try {
            const year = parseInt(batchYear);
            const sept1 = new Date(year, 8, 1); // 0-indexed month, 8 = September
            
            // Find first Monday of September
            const firstMonday = new Date(sept1);
            while (firstMonday.getDay() !== 1) {
                firstMonday.setDate(firstMonday.getDate() + 1);
            }
            
            const addDays = (date: Date, days: number) => {
                const d = new Date(date);
                d.setDate(d.getDate() + days);
                return d;
            };

            const d1 = firstMonday;
            const d2 = addDays(d1, 14);
            const d3 = addDays(d2, 21);
            const d4 = addDays(d3, 30);
            const d5 = addDays(d4, 45);
            const d6 = addDays(d5, 45);
            const d7 = addDays(d6, 21);
            const d8 = addDays(d7, 14);

            const defaults = [
                { milestone_key: 'M1_GROUP_REG', milestone_name: 'Group Formation & Registration', due_date: d1.toISOString().split('T')[0] },
                { milestone_key: 'M2_TOPIC', milestone_name: 'Topic Submission & Approval', due_date: d2.toISOString().split('T')[0] },
                { milestone_key: 'M3_SYNOPSIS', milestone_name: 'Synopsis Submission', due_date: d3.toISOString().split('T')[0] },
                { milestone_key: 'M4_REVIEW1', milestone_name: 'Review I — Problem & Literature', due_date: d4.toISOString().split('T')[0] },
                { milestone_key: 'M5_REVIEW2', milestone_name: 'Review II — Design & Prototype', due_date: d5.toISOString().split('T')[0] },
                { milestone_key: 'M6_REVIEW3', milestone_name: 'Review III — Implementation', due_date: d6.toISOString().split('T')[0] },
                { milestone_key: 'M7_REPORT', milestone_name: 'Final Report Submission', due_date: d7.toISOString().split('T')[0] },
                { milestone_key: 'M8_VIVA', milestone_name: 'Final Viva Voce', due_date: d8.toISOString().split('T')[0] },
            ];

            for (const def of defaults) {
                await api.createOrUpdateMilestone(token, {
                    batch_year: batchYear,
                    ...def
                });
            }
            showToast('success', 'Default SPPU milestones loaded');
            fetchData();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to load defaults');
        } finally {
            setIsInserting(false);
        }
    };

    const handleAddCustom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !customName || !customDate) return;
        try {
            await api.createOrUpdateMilestone(token, {
                batch_year: batchYear,
                milestone_key: `CUSTOM_${Date.now()}`,
                milestone_name: customName,
                due_date: customDate
            });
            showToast('success', 'Custom milestone added');
            setCustomName('');
            setCustomDate('');
            setShowAddCustom(false);
            fetchData();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to add custom milestone');
        }
    };

    const handleUpdateDate = async (m: Milestone) => {
        if (!token || !editDate) {
            setEditingId(null);
            return;
        }
        try {
            await api.createOrUpdateMilestone(token, {
                batch_year: m.batch_year,
                milestone_key: m.milestone_key,
                milestone_name: m.milestone_name,
                due_date: editDate
            });
            showToast('success', 'Due date updated');
            setEditingId(null);
            fetchData();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to update date');
        }
    };

    const handleMarkComplete = async (m: Milestone) => {
        if (!token) return;
        try {
            await api.markMilestoneComplete(token, m.milestone_id, !m.is_completed);
            showToast('success', `Milestone marked as ${!m.is_completed ? 'completed' : 'incomplete'}`);
            fetchData();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to update status');
        }
    };

    const handleDelete = async (m: Milestone) => {
        if (!token || !window.confirm(`Are you sure you want to delete "${m.milestone_name}"?`)) return;
        try {
            await api.deleteMilestone(token, m.milestone_id);
            showToast('success', 'Milestone deleted');
            fetchData();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to delete milestone');
        }
    };

    function formatDate(dateStr?: string): string {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    const getStatus = (m: Milestone) => {
        if (m.is_completed) return { label: 'Completed', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(m.due_date);
        due.setHours(0,0,0,0);
        
        if (due < today) return { label: 'Overdue', color: 'bg-red-500/15 text-red-300 border-red-500/30' };
        
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) return { label: 'Due Soon', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
        
        return { label: 'Upcoming', color: 'bg-white/[0.08] text-white/40 border-white/[0.1]' };
    };

    return (
        <AppShell currentPage="/coordinator/milestones">
            {toast && (
                <div className={cn(
                    'fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold animate-in fade-in slide-in-from-top-4',
                    toast.type === 'success' ? 'bg-emerald-900/95 border-emerald-500/30 text-emerald-300' : 'bg-red-900/95 border-red-500/30 text-red-300'
                )}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X size={13}/></button>
                </div>
            )}

            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                            <Calendar size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Milestone Management</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Configure academic year deadlines for your batch</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Batch Year</span>
                    <select
                        value={batchYear}
                        onChange={e => setBatchYear(e.target.value)}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-semibold focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                        style={{ minWidth: '120px' }}
                    >
                        {batchYearsList.map(y => (
                            <option key={y} value={y} className="bg-slate-900">{y}-{parseInt(y)+1}</option>
                        ))}
                    </select>
                </div>
            </div>

            {upcomingMilestone && (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 flex items-center gap-4 mb-6">
                    <div className="p-2 rounded-xl bg-amber-500/20">
                        <Calendar size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">Next Milestone</p>
                        <p className="text-sm font-bold text-white">{upcomingMilestone.milestone_name}</p>
                        <p className="text-xs text-amber-400/70 mt-0.5">Due: {formatDate(upcomingMilestone.due_date)}</p>
                    </div>
                </div>
            )}

            <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.04] border-b border-white/[0.08]">
                                <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest w-16 text-center">#</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Milestone</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">Due Date</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest text-center">Status</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="flex justify-center py-16">
                                            <Loader2 size={32} className="animate-spin text-white/20" />
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="flex flex-col items-center py-16 text-red-400/60">
                                            <AlertCircle size={32} className="mb-3" />
                                            <p className="text-sm mb-3">{error}</p>
                                            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors">
                                                <RefreshCw size={12} /> Retry
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : milestones.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="text-center py-16 text-white/25">
                                            <Calendar size={40} className="mx-auto mb-4 opacity-30" />
                                            <p className="text-sm">No milestones configured for batch {batchYear}.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                milestones.map((m, i) => {
                                    const status = getStatus(m);
                                    return (
                                        <tr key={m.milestone_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-xs font-bold text-white/30 uppercase">
                                                    {m.milestone_key.startsWith('M') ? m.milestone_key.split('_')[0] : `C${i+1}`}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn('text-sm font-semibold', m.is_completed ? 'text-white/40 line-through' : 'text-white')}>{m.milestone_name}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {editingId === m.milestone_id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="date"
                                                            value={editDate}
                                                            onChange={e => setEditDate(e.target.value)}
                                                            className="px-2 py-1 text-xs bg-white/10 border border-white/20 text-white rounded-md focus:outline-none focus:border-white/40"
                                                        />
                                                        <button onClick={() => handleUpdateDate(m)} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/30"><CheckCircle2 size={12} /></button>
                                                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-white/10 text-white/40 rounded-md hover:bg-white/20"><X size={12} /></button>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => { setEditingId(m.milestone_id); setEditDate(m.due_date.split('T')[0]); }}
                                                        className="text-sm text-white/70 hover:text-white border-b border-transparent hover:border-white/30 border-dashed transition-all cursor-pointer"
                                                    >
                                                        {formatDate(m.due_date)}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-md border', status.color)}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleMarkComplete(m)}
                                                        title={m.is_completed ? "Mark incomplete" : "Mark completed"}
                                                        className={cn(
                                                            'p-1.5 rounded-md transition-all',
                                                            m.is_completed ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60'
                                                        )}
                                                    >
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(m)}
                                                        title="Delete milestone"
                                                        className="p-1.5 rounded-md bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer Action Bar */}
                <div className="p-4 border-t border-white/[0.08] bg-white/[0.02]">
                    {showAddCustom ? (
                        <form onSubmit={handleAddCustom} className="flex flex-wrap items-end gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Custom Milestone Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                    placeholder="e.g., Mid-Term Progress Review"
                                    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg focus:outline-none focus:border-white/30 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">Due Date *</label>
                                <input
                                    required
                                    type="date"
                                    value={customDate}
                                    onChange={e => setCustomDate(e.target.value)}
                                    className="px-3 py-2 text-sm bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-white/30 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowAddCustom(false)} className="px-4 py-2 text-sm font-bold text-white/50 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-all shadow-lg">Save Custom</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                onClick={handleLoadDefaults}
                                disabled={isInserting}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isInserting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                Load Default SPPU Milestones
                            </button>
                            <button
                                onClick={() => setShowAddCustom(true)}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white/80 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.12] rounded-xl transition-all"
                            >
                                <Plus size={16} /> Add Custom Milestone
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
};
