import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { BarChart2, Shield, Calendar, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export const CommitteeDashboard: React.FC = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const [evals, setEvals] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!token) return;
            try {
                const [evalsData, schedulesData] = await Promise.all([
                    api.getEvaluations(token).catch(() => []),
                    api.getSchedules(token).catch(() => []),
                ]);
                setEvals(Array.isArray(evalsData) ? evalsData : []);
                setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [token]);

    const totalReviews = evals.length;
    const completedReviews = evals.filter(e => e.is_locked || e.total_marks > 0).length;
    const pendingReviews = totalReviews - completedReviews;
    const upcomingSchedules = schedules
        .filter(s => new Date(s.presentation_time) > new Date())
        .sort((a, b) => new Date(a.presentation_time).getTime() - new Date(b.presentation_time).getTime())
        .slice(0, 3);

    const phases = ['REVIEW_1', 'REVIEW_2', 'REVIEW_3', 'FINAL'];
    const phaseLabels: Record<string, string> = { REVIEW_1: 'Review I', REVIEW_2: 'Review II', REVIEW_3: 'Review III', FINAL: 'Final Viva' };

    return (
        <AppShell currentPage="/committee/dashboard">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
                            <BarChart2 size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Committee Dashboard</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Overview of your evaluation assignments and schedule</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-white/20" />
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
                            <p className="text-4xl font-black text-amber-400">{totalReviews}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Total Evaluations</p>
                        </div>
                        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
                            <p className="text-4xl font-black text-orange-400">{pendingReviews}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Pending</p>
                        </div>
                        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
                            <p className="text-4xl font-black text-emerald-400">{completedReviews}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">Completed</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Review Phases Card */}
                        <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Shield size={18} className="text-amber-400" />
                                <h2 className="text-lg font-bold text-white">Review Phases</h2>
                            </div>
                            <div>
                                {phases.map(phase => {
                                    const count = evals.filter(e => e.phase === phase).length;
                                    return (
                                        <div key={phase} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-white">{phaseLabels[phase]}</span>
                                                <span className="px-2 py-0.5 rounded-md border text-[10px] font-bold bg-white/[0.08] text-white/60 border-white/[0.1]">
                                                    {count} assigned
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => navigate('/committee/evaluations')}
                                                className="text-xs px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/25 rounded-lg hover:bg-amber-500/25 transition-all"
                                            >
                                                Start Evaluation
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Upcoming Schedule Card */}
                        {upcomingSchedules.length > 0 && (
                            <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <Calendar size={18} className="text-amber-400" />
                                    <h2 className="text-lg font-bold text-white">Upcoming Presentations</h2>
                                </div>
                                <div>
                                    {upcomingSchedules.map(schedule => {
                                        const dateObj = new Date(schedule.presentation_time);
                                        const day = dateObj.getDate();
                                        const month = dateObj.toLocaleString('default', { month: 'short' });
                                        const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                        return (
                                            <div key={schedule.schedule_id || schedule.group_id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-2">
                                                <div className="text-center w-12 shrink-0">
                                                    <p className="text-lg font-black text-amber-400">{day}</p>
                                                    <p className="text-[10px] text-white/40 uppercase">{month}</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{schedule.group_name || 'Group Presentation'}</p>
                                                    <p className="text-xs text-white/40 truncate">{schedule.venue} • {time}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                        <button
                            onClick={() => navigate('/committee/evaluations')}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                        >
                            Start Evaluation
                        </button>
                        <button
                            onClick={() => navigate('/committee/results')}
                            className="flex-1 py-3 bg-white/[0.08] border border-white/[0.12] text-white/80 font-bold rounded-xl hover:bg-white/[0.12] transition-all"
                        >
                            View Results
                        </button>
                    </div>
                </>
            )}
        </AppShell>
    );
};
