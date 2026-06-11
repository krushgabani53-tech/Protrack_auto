import React, { useState, useEffect } from 'react';
import { AppShell } from '../../layouts/AppShell';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../lib/apiClient';
import { Kanban, Plus, AlertCircle, X, ChevronRight, Check } from 'lucide-react';

interface Task {
    task_id: string;
    group_id: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    assigned_to?: string | null;
    assignee_name?: string | null;
}

export const StudentTasks: React.FC = () => {
    const { token } = useAuthStore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [groupId, setGroupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const fetchGroupAndTasks = async () => {
            if (!token) return;
            try {
                setIsLoading(true);
                const groups = await api.getGroups(token);
                const active = groups.find((g: any) => g.status === 'ACTIVE' || g.status === 'WAITING_ALLOCATION');
                if (active) {
                    setGroupId(active.group_id);
                    const groupTasks = await api.getTasks(token, active.group_id);
                    setTasks(groupTasks);
                } else {
                    setError('You do not have an active group to manage tasks.');
                }
            } catch (err) {
                setError('Failed to load tasks');
            } finally {
                setIsLoading(false);
            }
        };
        fetchGroupAndTasks();
    }, [token]);

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !groupId || !newTaskTitle.trim()) return;
        
        try {
            const newTask = await api.createTask(token, groupId, newTaskTitle.trim());
            setTasks([newTask, ...tasks]);
            setNewTaskTitle('');
            setIsCreating(false);
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    const updateStatus = async (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
        if (!token) return;
        try {
            // Optimistic update
            setTasks(tasks.map(t => t.task_id === taskId ? { ...t, status: newStatus } : t));
            await api.updateTaskStatus(token, taskId, newStatus);
        } catch (err) {
            console.error('Failed to update status:', err);
            // Revert on error (could implement full refetch here)
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!token || !confirm('Delete this task?')) return;
        try {
            setTasks(tasks.filter(t => t.task_id !== taskId));
            await api.deleteTask(token, taskId);
        } catch (err) {
            console.error('Failed to delete task:', err);
        }
    };

    const columns = [
        { id: 'TODO', label: 'To Do', color: 'border-blue-500/30 bg-blue-500/5', header: 'bg-blue-500/10 text-blue-300' },
        { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/30 bg-amber-500/5', header: 'bg-amber-500/10 text-amber-300' },
        { id: 'DONE', label: 'Done', color: 'border-emerald-500/30 bg-emerald-500/5', header: 'bg-emerald-500/10 text-emerald-300' }
    ];

    return (
        <AppShell currentPage="/student/tasks">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                            <Kanban size={18} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Group Tasks</h1>
                    </div>
                    <p className="text-white/40 text-sm ml-11">Manage your team's workflow</p>
                </div>
                {groupId && !isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                    >
                        <Plus size={16} /> Add Task
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-300">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {isCreating && (
                <div className="mb-8 p-5 bg-white/[0.04] border border-white/[0.08] rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white">New Task</h3>
                        <button onClick={() => setIsCreating(false)} className="text-white/40 hover:text-white/80 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <form onSubmit={handleCreateTask} className="flex gap-3">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="e.g. Implement login screen..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
                            autoFocus
                        />
                        <button 
                            type="submit"
                            disabled={!newTaskTitle.trim()}
                            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all"
                        >
                            Save
                        </button>
                    </form>
                </div>
            )}

            {!isLoading && !error && groupId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {columns.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div key={col.id} className={`flex flex-col rounded-2xl border ${col.color} overflow-hidden h-[calc(100vh-250px)]`}>
                                <div className={`px-4 py-3 border-b border-white/5 flex items-center justify-between ${col.header}`}>
                                    <h3 className="text-sm font-bold uppercase tracking-wider">{col.label}</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-xs font-bold">{colTasks.length}</span>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                    {colTasks.map(task => (
                                        <div key={task.task_id} className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-colors relative">
                                            <button 
                                                onClick={() => deleteTask(task.task_id)}
                                                className="absolute top-3 right-3 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                            <p className="text-sm font-semibold text-white mb-4 pr-6">{task.title}</p>
                                            
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-2">
                                                    {col.id !== 'TODO' && (
                                                        <button 
                                                            onClick={() => updateStatus(task.task_id, col.id === 'DONE' ? 'IN_PROGRESS' : 'TODO')}
                                                            className="text-xs text-white/40 hover:text-white/80 flex items-center gap-1"
                                                        >
                                                            <ChevronRight size={14} className="rotate-180" /> Back
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {col.id !== 'DONE' && (
                                                        <button 
                                                            onClick={() => updateStatus(task.task_id, col.id === 'TODO' ? 'IN_PROGRESS' : 'DONE')}
                                                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                                                        >
                                                            Next <ChevronRight size={14} />
                                                        </button>
                                                    )}
                                                    {col.id === 'DONE' && (
                                                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                                                            <Check size={14} /> Complete
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {colTasks.length === 0 && (
                                        <div className="text-center py-10 text-white/20 text-sm">
                                            No tasks here
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </AppShell>
    );
};
