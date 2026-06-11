import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Folder, Link as LinkIcon, Plus, ExternalLink, User } from 'lucide-react';

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
    const [error, setError] = useState('');

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
            await api.createResource(token, (user as any).group_id, title, url);
            setTitle('');
            setUrl('');
            loadResources();
        } catch (err: any) {
            setError(err.message || 'Failed to add resource');
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
                                        <LinkIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white mb-1 group-hover:text-blue-400 transition-colors">
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
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
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
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="e.g. React Documentation"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">URL / Link</label>
                                <input
                                    type="url"
                                    required
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    placeholder="https://..."
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors"
                            >
                                Share with Group
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </AppShell>
    );
}
