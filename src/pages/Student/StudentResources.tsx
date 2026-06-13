import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Folder, Link as LinkIcon, Plus, ExternalLink, User, FileText, Loader2 } from 'lucide-react';

interface Resource {
    resource_id: string;
    title: string;
    url: string;
    uploaded_by_email: string;
    created_at: string;
}

export default function StudentResources() {
    const { user, token } = useAuthStore();
    const [resources, setResources] = useState<Resource[]>([]);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if ((user as any)?.group_id && token) {
            loadResources();
        }
    }, [user, token]);

    const loadResources = async () => {
        try {
            if (!(user as any)?.group_id || !token) return;
            const data = await api.getGroupResources(token, (user as any).group_id);
            setResources(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load resources');
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!(user as any)?.group_id || !token) return;
            setIsSubmitting(true);
            setError('');

            let finalUrl = url.trim();

            if (file) {
                const uploadRes = await api.uploadEvidence(token, file);
                finalUrl = uploadRes.url;
            }

            if (!finalUrl) {
                setError('Please provide a URL or upload a file');
                setIsSubmitting(false);
                return;
            }

            await api.createResource(token, (user as any).group_id, title, finalUrl);
            setTitle('');
            setUrl('');
            setFile(null);
            const fileInput = document.getElementById('resource-file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            loadResources();
        } catch (err: any) {
            setError(err.message || 'Failed to add resource');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!(user as any)?.group_id) {
        return (
            <AppShell currentPage="/student/resources">
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Folder className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Group Assigned</h3>
                    <p className="text-gray-400">You need to be in a group to access the Resource Hub.</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell currentPage="/student/resources">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Group Resource Hub
                    </h1>
                <p className="text-gray-400 mt-1">Share important links, references, and documents with your group.</p>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {resources.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-white">No resources yet</h3>
                            <p className="text-gray-400 mt-1">Be the first to share something useful!</p>
                        </div>
                    ) : (
                        resources.map(res => (
                            <div key={res.resource_id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors flex items-start justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                        {res.url.includes('/uploads/') ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors truncate pr-4">
                                            {res.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {res.uploaded_by_email || 'Unknown'}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(res.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <a 
                                    href={res.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all shrink-0"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-400" />
                            Add Resource
                        </h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="e.g. React Documentation"
                                />
                            </div>
                            
                            <div className="p-4 rounded-xl bg-black/20 border border-white/[0.05] space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Upload File</label>
                                    <input 
                                        id="resource-file-upload"
                                        type="file" 
                                        accept=".pdf,.docx,.png,.jpg,.jpeg"
                                        onChange={e => {
                                            setFile(e.target.files?.[0] || null);
                                            if (e.target.files?.[0]) setUrl('');
                                        }}
                                        className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30 transition-all cursor-pointer" 
                                    />
                                </div>
                                
                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[10px]">
                                        <span className="bg-slate-900 px-2 text-gray-500 uppercase font-bold tracking-widest">OR</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">External Link</label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={e => {
                                            setUrl(e.target.value);
                                            if (e.target.value) setFile(null);
                                            const fileInput = document.getElementById('resource-file-upload') as HTMLInputElement;
                                            if (fileInput) fileInput.value = '';
                                        }}
                                        placeholder="https://..."
                                        disabled={file !== null}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !title || (!url && !file)}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sharing...</> : 'Share with Group'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </AppShell>
    );
}
