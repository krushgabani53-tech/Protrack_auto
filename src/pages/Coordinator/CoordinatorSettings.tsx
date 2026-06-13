import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Settings, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const CoordinatorSettings: React.FC = () => {
    const { token } = useAuthStore();
    const [settings, setSettings] = useState<Record<string, any>>({});
    const [draft, setDraft] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const data = await api.getSettings(token);
                const map: Record<string, any> = {};
                (Array.isArray(data) ? data : []).forEach((s: any) => {
                    try {
                        map[s.key] = JSON.parse(s.value);
                    } catch {
                        map[s.key] = s.value;
                    }
                });
                setSettings(map);
                setDraft(map);
            } catch (err) {
                console.error('Failed to load settings', err);
                showToast('error', 'Failed to load system settings');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [token]);

    const isDirty = JSON.stringify(draft) !== JSON.stringify(settings);

    const handleSave = async () => {
        if (!token) return;
        setIsSaving(true);
        try {
            await Promise.all(
                Object.entries(draft).map(([key, value]) => {
                    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
                    return api.updateSettings(token, key, strValue);
                })
            );
            setSettings({ ...draft });
            showToast('success', 'Settings saved successfully');
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AppShell currentPage="/coordinator/settings">
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
                        <div className="p-2 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600">
                            <Settings size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">System Settings</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Configure ProTrack-Auto for your department</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-all flex items-center gap-2"
                >
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Loader2 size={32} className="animate-spin text-white/20" />
                </div>
            ) : (
                <div className="max-w-3xl space-y-6">
                    {/* CARD A — General Settings */}
                    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6">General Settings</h2>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                    Institute Name
                                </label>
                                <input 
                                    type="text" 
                                    value={draft.institute_name || ''} 
                                    onChange={e => setDraft({ ...draft, institute_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white placeholder-white/30 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all" 
                                    placeholder="e.g., My Engineering College"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                    Current Batch Year
                                </label>
                                <input 
                                    type="number" 
                                    min="2020" max="2030" 
                                    value={draft.batch_year || 2025} 
                                    onChange={e => setDraft({ ...draft, batch_year: parseInt(e.target.value) })}
                                    className="w-32 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                    Max Groups per Guide <span className="text-white/30 normal-case font-normal">(limits AI allocation)</span>
                                </label>
                                <input 
                                    type="number" 
                                    min="1" max="20" 
                                    value={draft.max_groups_per_guide || 6} 
                                    onChange={e => setDraft({ ...draft, max_groups_per_guide: parseInt(e.target.value) })}
                                    className="w-24 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                                    Logbook Submission Window <span className="text-white/30 normal-case font-normal">(days per week)</span>
                                </label>
                                <input 
                                    type="number" 
                                    min="1" max="7" 
                                    value={draft.logbook_window_days || 7} 
                                    onChange={e => setDraft({ ...draft, logbook_window_days: parseInt(e.target.value) })}
                                    className="w-24 px-4 py-2.5 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* CARD B — Notifications */}
                    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-6">Notifications</h2>
                        
                        <div>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div>
                                    <p className="text-sm font-semibold text-white">Email Notifications</p>
                                    <p className="text-xs text-white/40 mt-0.5">Send automatic emails for logbook reminders and deadlines</p>
                                </div>
                                <div 
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setDraft({ ...draft, smtp_enabled: !draft.smtp_enabled });
                                    }}
                                    className={cn(
                                        'w-12 h-6 rounded-full transition-all cursor-pointer shadow-inner',
                                        draft.smtp_enabled ? 'bg-indigo-500' : 'bg-white/10 group-hover:bg-white/20'
                                    )}
                                >
                                    <div className={cn(
                                        'w-5 h-5 bg-white rounded-full mt-0.5 transition-all shadow-md',
                                        draft.smtp_enabled ? 'ml-6' : 'ml-0.5'
                                    )} />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
};
