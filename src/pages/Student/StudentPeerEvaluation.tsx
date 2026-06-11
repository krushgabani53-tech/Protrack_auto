import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Star, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface Member {
    student_id: string;
    prn_no: string;
}

export const StudentPeerEvaluation: React.FC = () => {
    const { token, user } = useAuthStore();
    const [groupId, setGroupId] = useState<string | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [submittedIds, setSubmittedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [evaluations, setEvaluations] = useState<Record<string, { score: number; comments: string }>>({});

    useEffect(() => {
        const fetchGroupAndMembers = async () => {
            if (!token) return;
            try {
                setIsLoading(true);
                const groups = await api.getGroups(token);
                const active = groups.find((g: any) => g.status === 'ACTIVE' || g.status === 'WAITING_ALLOCATION');
                if (active) {
                    setGroupId(active.group_id);
                    const membersData = await api.getMembers(token, active.group_id);
                    // Filter out current user
                    const peers = membersData.filter((m: any) => m.student_id !== user?.user_id);
                    setMembers(peers);
                    
                    // Initialize evaluation state
                    const initialEval: any = {};
                    peers.forEach((p: any) => {
                        initialEval[p.student_id] = { score: 5, comments: '' };
                    });
                    setEvaluations(initialEval);
                } else {
                    setError('You do not have an active group to evaluate.');
                }
            } catch (err) {
                setError('Failed to load group members');
            } finally {
                setIsLoading(false);
            }
        };
        fetchGroupAndMembers();
    }, [token, user]);

    const handleSubmit = async (evaluateeId: string) => {
        if (!token || !groupId) return;
        const data = evaluations[evaluateeId];
        try {
            await api.submitPeerEvaluation(token, groupId, evaluateeId, data.score, data.comments);
            setSubmittedIds([...submittedIds, evaluateeId]);
        } catch (err) {
            console.error('Failed to submit evaluation:', err);
            alert('Failed to submit evaluation');
        }
    };

    const updateEval = (id: string, field: 'score' | 'comments', value: any) => {
        setEvaluations(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    return (
        <AppShell currentPage="/student/peer-evaluation">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                            <Star size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Peer Evaluation</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Anonymously grade your group members' contributions</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-300">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {!isLoading && !error && members.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {members.map(member => {
                        const isSubmitted = submittedIds.includes(member.student_id);
                        const currentEval = evaluations[member.student_id];
                        
                        return (
                            <div key={member.student_id} className="p-6 bg-white/[0.04] border border-white/[0.08] rounded-2xl relative overflow-hidden">
                                {isSubmitted && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                        <CheckCircle size={40} className="text-emerald-400 mb-3" />
                                        <p className="text-lg font-bold text-white">Evaluation Submitted</p>
                                        <p className="text-sm text-white/50 mt-1">Thank you for your feedback.</p>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                        <Users size={18} className="text-white/60" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg">PRN: {member.prn_no}</p>
                                        <p className="text-white/40 text-sm">Group Member</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-white mb-2">Contribution Score (1-5)</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(score => (
                                                <button
                                                    key={score}
                                                    onClick={() => updateEval(member.student_id, 'score', score)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                                                        currentEval.score === score 
                                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                                                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                                                    }`}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-white mb-2">Private Comments for Committee</label>
                                        <textarea
                                            value={currentEval.comments}
                                            onChange={(e) => updateEval(member.student_id, 'comments', e.target.value)}
                                            placeholder="Briefly describe their contribution to the project..."
                                            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 resize-none"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={() => handleSubmit(member.student_id)}
                                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                                    >
                                        Submit Evaluation
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {!isLoading && !error && members.length === 0 && groupId && (
                <div className="text-center py-12">
                    <p className="text-white/40">No other members in your group to evaluate.</p>
                </div>
            )}
        </AppShell>
    );
};
