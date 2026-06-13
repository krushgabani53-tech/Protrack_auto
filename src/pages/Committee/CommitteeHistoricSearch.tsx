import React, { useState } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { Search, History, BookOpen, Clock } from 'lucide-react';
import { api } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';

export const CommitteeHistoricSearch: React.FC = () => {
    const { token } = useAuthStore();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !query.trim()) return;
        setIsSearching(true);
        setHasSearched(true);
        try {
            const data = await api.searchHistoricProjects(token, query);
            setResults(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <AppShell currentPage="/committee/history">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                            <History size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Historic Projects</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Search and review past year projects</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                <form onSubmit={handleSearch} className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-white/30" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="block w-full pl-11 pr-32 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-lg"
                        placeholder="Search past projects by title, domain, or technology..."
                    />
                    <button
                        type="submit"
                        disabled={isSearching || !query.trim()}
                        className="absolute inset-y-2 right-2 px-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-sm rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {hasSearched && (
                    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6">
                        <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">
                            Search Results ({results.length})
                        </h3>
                        
                        <div className="space-y-4">
                            {results.length === 0 ? (
                                <div className="text-center py-10">
                                    <BookOpen size={40} className="mx-auto text-white/10 mb-4" />
                                    <p className="text-white/40 text-sm">No historical projects found matching your query.</p>
                                </div>
                            ) : (
                                results.map((project, idx) => (
                                    <div key={idx} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-lg font-bold text-white mb-1">{project.title}</h4>
                                                <div className="flex items-center gap-4 text-xs text-white/40">
                                                    <span className="flex items-center gap-1.5"><Clock size={12} /> Class of {new Date(project.created_at).getFullYear()}</span>
                                                    <span>•</span>
                                                    <span>{project.group_name}</span>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-500/30">
                                                Archive
                                            </span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-sm text-white/60 line-clamp-2">
                                                This project explored various architectures to solve the problem statement. 
                                                It implemented a full-stack solution with real-time capabilities and advanced analytics.
                                                (Placeholder abstract for historic data)
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
};
