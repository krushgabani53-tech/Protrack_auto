import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Link } from 'react-router-dom';
import { Users, BookOpen, AlertOctagon, TrendingUp, Sparkles, Activity, Zap, Download, Filter, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';



interface ComplianceRecord {
    group_id: string;
    group_name: string;
    guide_email: string;
    weeks_active: number;
    logbooks_submitted: number;
    compliance_rate: number;
    consecutive_missed: number;
    status: 'on_track' | 'warning' | 'at_risk';
}

interface ComplianceSummary {
    total_groups: number;
    average_compliance: number;
    at_risk_count: number;
    warning_count: number;
    on_track_count: number;
}

export const CoordinatorDashboardNew: React.FC = () => {
    const { token } = useAuthStore();
    const [stats, setStats] = useState({ totalGroups: 0, unassigned: 0, active: 0, totalStudents: 0 });
    const [workloadData, setWorkloadData] = useState<{ name: string; groups: number; max: number }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [complianceData, setComplianceData] = useState<ComplianceRecord[]>([]);
    const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setIsLoading(true);
                const [groupsData, complianceResponse] = await Promise.all([
                    api.getGroups(token),
                    api.getLogbookCompliance(token).catch(() => null)
                ]);
                
                const groupList = Array.isArray(groupsData) ? groupsData : [];
                if (groupList.length > 0) {
                    const totalStudents = groupList.reduce((acc, g) => acc + parseInt(g.member_count || '0', 10), 0);
                    setStats({
                        totalGroups: groupList.length,
                        unassigned: groupList.filter(g => g.status === 'WAITING_ALLOCATION').length,
                        active: groupList.filter(g => g.status === 'ACTIVE').length,
                        totalStudents: totalStudents
                    });
                }

                if (complianceResponse) {
                    setComplianceData(complianceResponse.compliance || []);
                    setComplianceSummary(complianceResponse.summary || null);
                }

                try {
                    const guidesRes = await api.getAvailableGuides(token);
                    const guides = guidesRes?.guides || [];
                    setWorkloadData(
                        guides.map((g: any) => ({
                            name: g.full_name?.split(' ')[0] || g.email?.split('@')[0] || 'Guide',
                            groups: Number(g.current_workload) || 0,
                            max: Number(g.max_workload) || 6,
                        }))
                    );
                } catch {
                    // silently fail — chart just stays empty
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const handleDownloadCompliance = async () => {
        if (!token) return;
        try {
            const blob = await api.exportLogbookCompliance(token);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `logbook_compliance_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Failed to download compliance report', err);
            alert('Failed to download compliance report');
        }
    };

    const filteredCompliance = filterStatus === 'all'
        ? complianceData
        : complianceData.filter(g => g.status === filterStatus);

    const getStatusBadge = (status: string) => {
        const badges = {
            on_track: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'On Track', icon: CheckCircle },
            warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Warning', icon: Clock },
            at_risk: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'At Risk', icon: AlertTriangle },
        };
        return badges[status as keyof typeof badges] || badges.on_track;
    };

    return (
        <AppShell currentPage="/coordinator/dashboard">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-white">Coordinator Analytics</h2>
                        <p className="text-white/60 mt-1 text-lg">Department-level insights, PSO tracking, and workload distribution.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={async () => {
                                try {
                                    if (token) {
                                        await api.triggerReminders(token);
                                        alert('Overdue reminders check triggered successfully! System alerts have been sent to applicable groups.');
                                    }
                                } catch (err: any) {
                                    alert(err.message || 'Failed to trigger reminders');
                                }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-red-500/20 transition-all flex items-center gap-2"
                        >
                            <AlertOctagon className="w-4 h-4" /> Trigger Overdue Reminders
                        </button>
                        <button className="px-4 py-2 bg-slate-800 border border-white/10 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Export Analytics
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Total Students", val: isLoading ? "..." : String(stats.totalStudents), trend: "Active in system", icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', glow: 'shadow-indigo-500/5' },
                        { label: "Total Projects", val: isLoading ? "..." : String(stats.totalGroups), trend: "Formed groups", icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/5' },
                        { label: "Unassigned", val: isLoading ? "..." : String(stats.unassigned), trend: "Requires guide", icon: AlertOctagon, color: 'text-rose-400', bg: 'bg-rose-500/10', glow: 'shadow-rose-500/5' },
                        { label: "Avg Compliance", val: isLoading || !complianceSummary ? "..." : `${complianceSummary.average_compliance}%`, trend: "Logbook submissions", icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/5' },
                    ].map((k, i) => (
                        <motion.div 
                            key={i} 
                            whileHover={{ y: -4 }}
                            className={`p-6 rounded-2xl border border-white/10 bg-white/5 shadow-sm hover:shadow-xl hover:${k.glow} transition-all relative overflow-hidden backdrop-blur-sm`}
                        >
                            <div className="flex justify-between items-start z-10 relative">
                                <div>
                                    <p className="text-sm font-medium text-white/50 mb-1">{k.label}</p>
                                    <h3 className="text-4xl font-bold tracking-tight text-white">{k.val}</h3>
                                </div>
                                <div className={`p-3 rounded-xl ${k.bg}`}>
                                    <k.icon className={`w-6 h-6 ${k.color}`} />
                                </div>
                            </div>
                            <div className="mt-4 text-sm font-medium text-emerald-400 relative z-10">{k.trend}</div>
                            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl z-0 ${k.bg}`} />
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 p-6 rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-400" /> Guide Workload Distribution</h3>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={workloadData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                        contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Bar dataKey="max" fill="rgba(255,255,255,0.06)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                                    <Bar dataKey="groups" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        {workloadData.map((e, i) => (
                                            <Cell key={i} fill={e.groups > 6 ? '#ef4444' : e.groups < 3 ? '#10b981' : '#6366f1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Target size={16} className="text-indigo-400" />
                            <h3 className="text-sm font-bold text-white">PO/PSO Attainment</h3>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Target size={28} className="text-indigo-400/60" />
                            </div>
                            <div>
                                <p className="text-sm text-white/50 mb-1">View detailed PO/PSO coverage analysis</p>
                                <p className="text-xs text-white/25">Configure mappings first, then attainment auto-calculates</p>
                            </div>
                            <Link
                                to="/coordinator/po-pso"
                                className="px-4 py-2 text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded-xl hover:bg-indigo-500/25 transition-all"
                            >
                                Open PO/PSO Mapping →
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 shadow-sm flex flex-col lg:flex-row gap-6 items-center backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 text-white">AI Coordinator Insights</h3>
                        <p className="text-white/70">
                            The system has detected that you have <strong className="text-white">{stats.unassigned}</strong> groups waiting for a guide. 
                            Head over to the <strong className="text-white">Allocations</strong> tab to assign them to available faculty members based on their workload capacity.
                        </p>
                    </div>
                </div>

                {/* Logbook Compliance Panel */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 shadow-sm backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-400" />
                                Logbook Compliance Tracking
                            </h3>
                            {complianceSummary && (
                                <div className="flex items-center gap-6 mt-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span className="text-white/60">On Track: <strong className="text-white">{complianceSummary.on_track_count}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-400" />
                                        <span className="text-white/60">Warning: <strong className="text-white">{complianceSummary.warning_count}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <span className="text-white/60">At Risk: <strong className="text-white">{complianceSummary.at_risk_count}</strong></span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                            >
                                <option value="all" className="bg-slate-800">All Groups</option>
                                <option value="at_risk" className="bg-slate-800">At Risk Only</option>
                                <option value="warning" className="bg-slate-800">Warning Only</option>
                                <option value="on_track" className="bg-slate-800">On Track Only</option>
                            </select>
                            <button
                                onClick={handleDownloadCompliance}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Download CSV
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
                        </div>
                    ) : complianceData.length === 0 ? (
                        <div className="text-center py-16 text-white/40">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No active groups found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                                        <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest">Group</th>
                                        <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest">Guide</th>
                                        <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-center">Weeks Active</th>
                                        <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-center">Submitted</th>
                                        <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-center">Compliance %</th>
                                        <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest text-center">Consecutive Missed</th>
                                        <th className="p-4 text-xs font-bold text-white/40 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCompliance.map((group) => {
                                        const statusInfo = getStatusBadge(group.status);
                                        const StatusIcon = statusInfo.icon;
                                        return (
                                            <tr key={group.group_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4">
                                                    <span className="text-sm font-semibold text-white">{group.group_name}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-sm text-white/60">{group.guide_email}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-sm font-medium text-white">{group.weeks_active}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-sm font-medium text-white">{group.logbooks_submitted}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="relative w-20">
                                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all ${
                                                                        group.status === 'at_risk' ? 'bg-red-500' :
                                                                        group.status === 'warning' ? 'bg-amber-500' :
                                                                        'bg-emerald-500'
                                                                    }`}
                                                                    style={{ width: `${group.compliance_rate}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-white/80 absolute -right-8 top-0">{group.compliance_rate}%</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`text-sm font-medium ${
                                                        group.consecutive_missed >= 2 ? 'text-red-400' :
                                                        group.consecutive_missed === 1 ? 'text-amber-400' :
                                                        'text-emerald-400'
                                                    }`}>
                                                        {group.consecutive_missed}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                                                        <StatusIcon size={12} />
                                                        {statusInfo.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
};
