import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { api } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { Users, Upload, CheckCircle2, X, AlertCircle, RefreshCw, Shield } from 'lucide-react';

export const CoordinatorUsers: React.FC = () => {
    const { token } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'orphans'>('students');

    // Students state
    const [whitelist, setWhitelist] = useState<any[]>([]);
    const [isLoadingWhitelist, setIsLoadingWhitelist] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    // Faculty state
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerRole, setRegisterRole] = useState('GUIDE');
    const [expertiseTags, setExpertiseTags] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    // Orphans state
    const [orphans, setOrphans] = useState<any[]>([]);
    const [isLoadingOrphans, setIsLoadingOrphans] = useState(false);
    const [isAutoGrouping, setIsAutoGrouping] = useState(false);

    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchWhitelist = async () => {
        if (!token) return;
        setIsLoadingWhitelist(true);
        try {
            const data = await api.getWhitelist(token);
            setWhitelist(data || []);
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to fetch whitelist');
        } finally {
            setIsLoadingWhitelist(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'students') {
            fetchWhitelist();
        } else if (activeTab === 'orphans') {
            fetchOrphans();
        }
    }, [activeTab]);

    const fetchOrphans = async () => {
        if (!token) return;
        setIsLoadingOrphans(true);
        try {
            const data = await api.getOrphanStudents(token);
            setOrphans(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch orphans', err);
        } finally {
            setIsLoadingOrphans(false);
        }
    };

    const handleAutoGroup = async () => {
        if (!token) return;
        setIsAutoGrouping(true);
        try {
            await api.autoGroupOrphans(token);
            showToast('success', 'Successfully auto-grouped orphans');
            fetchOrphans();
        } catch (err) {
            showToast('error', 'Failed to auto-group orphans');
        } finally {
            setIsAutoGrouping(false);
        }
    };

    const handleExportCSV = () => {
        if (whitelist.length === 0) return;
        const csvContent = [
            ['PRN No', 'Full Name', 'Email', 'Is Claimed'],
            ...whitelist.map(s => [s.prn_no, s.full_name, s.email, s.is_claimed ? 'Yes' : 'No'])
        ].map(e => e.join(",")).join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "student_whitelist.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUploadWhitelist = async () => {
        if (!csvFile || !token) return;
        setUploading(true);
        try {
            const res = await api.uploadWhitelist(token, csvFile);
            showToast('success', `Uploaded successfully! Processed ${res.totalProcessed} records. Success: ${res.successCount}, Errors: ${res.errorCount}`);
            setCsvFile(null);
            fetchWhitelist();
        } catch (err) {
            console.error(err);
            showToast('error', 'Failed to upload whitelist');
        } finally {
            setUploading(false);
        }
    };

    const handleRegisterFaculty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsRegistering(true);
        try {
            const tags = expertiseTags.split(',').map(t => t.trim()).filter(Boolean);
            await api.register({
                email: registerEmail,
                password: registerPassword,
                role: registerRole,
                expertise_tags: registerRole === 'GUIDE' ? tags : undefined
            });
            showToast('success', `${registerRole} account created successfully!`);
            setRegisterEmail('');
            setRegisterPassword('');
            setExpertiseTags('');
        } catch (err: any) {
            showToast('error', err.message || 'Failed to create account');
        } finally {
            setIsRegistering(false);
        }
    };

    const claimedCount = whitelist.filter(s => s.is_claimed).length;

    return (
        <AppShell currentPage="/coordinator/users">
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
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                            <Users size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">User Management</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Manage student whitelists and faculty accounts</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] w-fit mb-8">
                {[
                    { id: 'students' as const, label: 'Student Whitelist' },
                    { id: 'faculty' as const, label: 'Faculty & Committee' },
                    { id: 'orphans' as const, label: 'Orphan Students' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Student Whitelist Tab */}
            {activeTab === 'students' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Bulk Upload</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-white/30 uppercase mb-1.5">Select CSV or Excel File</label>
                                    <input 
                                        type="file" 
                                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                        onChange={e => setCsvFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-500/20 file:text-orange-400 hover:file:bg-orange-500/30 transition-all cursor-pointer" 
                                    />
                                    <p className="text-[10px] text-white/30 mt-2">File must contain columns: prn_no, email, full_name</p>
                                </div>
                                <button
                                    onClick={handleUploadWhitelist}
                                    disabled={!csvFile || uploading}
                                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                                    {uploading ? 'Processing...' : 'Upload & Whitelist'}
                                </button>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Registry Status</h3>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs font-bold text-white/40">
                                        <span className="text-emerald-400">{claimedCount}</span> claimed / {whitelist.length} total
                                    </div>
                                    <button 
                                        onClick={handleExportCSV}
                                        className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-widest text-white/30">
                                            <th className="pb-3 font-semibold">PRN No</th>
                                            <th className="pb-3 font-semibold">Name</th>
                                            <th className="pb-3 font-semibold">Email</th>
                                            <th className="pb-3 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm text-white/70">
                                        {isLoadingWhitelist ? (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-center text-white/30 text-xs">
                                                    <RefreshCw size={16} className="animate-spin inline mr-2" /> Loading...
                                                </td>
                                            </tr>
                                        ) : whitelist.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-center text-white/30 text-xs">
                                                    No students whitelisted yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            whitelist.map(student => (
                                                <tr key={student.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                                    <td className="py-3 font-mono text-xs">{student.prn_no}</td>
                                                    <td className="py-3 font-semibold">{student.full_name}</td>
                                                    <td className="py-3 text-xs text-white/50">{student.email}</td>
                                                    <td className="py-3">
                                                        {student.is_claimed ? (
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">CLAIMED</span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">UNCLAIMED</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Faculty & Committee Tab */}
            {activeTab === 'faculty' && (
                <div className="max-w-xl mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.08] p-7">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                            <Shield size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Create Admin Account</h3>
                            <p className="text-xs text-white/40">Manually provision Faculty Guides or Committee members</p>
                        </div>
                    </div>

                    <form onSubmit={handleRegisterFaculty} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Role</label>
                            <select 
                                value={registerRole}
                                onChange={e => setRegisterRole(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all appearance-none"
                            >
                                <option value="GUIDE">Faculty Guide</option>
                                <option value="COMMITTEE">Committee Member</option>
                                <option value="COORDINATOR">Project Coordinator</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={registerEmail}
                                onChange={e => setRegisterEmail(e.target.value)}
                                placeholder="faculty@college.edu"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Temporary Password</label>
                            <input 
                                type="text" 
                                required
                                value={registerPassword}
                                onChange={e => setRegisterPassword(e.target.value)}
                                placeholder="Set a temporary password"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                            />
                        </div>

                        {registerRole === 'GUIDE' && (
                            <div>
                                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Expertise Tags (Comma separated)</label>
                                <input 
                                    type="text" 
                                    value={expertiseTags}
                                    onChange={e => setExpertiseTags(e.target.value)}
                                    placeholder="e.g. Machine Learning, Web Dev, IoT"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/25 rounded-xl text-sm focus:outline-none focus:border-white/30 transition-all"
                                />
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isRegistering}
                            className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isRegistering ? 'Creating...' : `Create ${registerRole.charAt(0) + registerRole.slice(1).toLowerCase()} Account`}
                        </button>

                        <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3">
                            <AlertCircle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-orange-200/70 leading-relaxed">
                                Users created here can log in immediately with the temporary password. Please securely share the credentials with the faculty member.
                            </p>
                        </div>
                    </form>
                </div>
            )}

            {/* Orphans Tab */}
            {activeTab === 'orphans' && (
                <div className="max-w-4xl mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.08] p-7">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                                <Users size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Orphan Students</h3>
                                <p className="text-xs text-white/40">Students registered but not in any group</p>
                            </div>
                        </div>
                        {orphans.length > 0 && (
                            <button 
                                onClick={handleAutoGroup}
                                disabled={isAutoGrouping}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isAutoGrouping ? <RefreshCw size={14} className="animate-spin" /> : <Users size={14} />}
                                Auto-Group Orphans
                            </button>
                        )}
                    </div>
                    
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-widest text-white/40 bg-black/20">
                                    <th className="py-3 px-4 font-semibold">PRN No</th>
                                    <th className="py-3 px-4 font-semibold">Email</th>
                                    <th className="py-3 px-4 font-semibold">Joined At</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-white/80">
                                {isLoadingOrphans ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-white/30 text-xs">
                                            <RefreshCw size={16} className="animate-spin inline mr-2" /> Loading...
                                        </td>
                                    </tr>
                                ) : orphans.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-white/30 text-xs">
                                            No orphan students found. All registered students are in groups.
                                        </td>
                                    </tr>
                                ) : (
                                    orphans.map(student => (
                                        <tr key={student.student_id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                            <td className="py-3 px-4 font-mono text-xs">{student.prn_no}</td>
                                            <td className="py-3 px-4 text-xs text-white/60">{student.email}</td>
                                            <td className="py-3 px-4 text-xs text-white/40">{new Date(student.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
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
