import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/apiClient';
import { BookOpen, Users, Clipboard, Star, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';

type Role = 'STUDENT' | 'GUIDE' | 'COORDINATOR' | 'COMMITTEE';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { setAuth, setLoading, isLoading } = useAuthStore();

    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [prn, setPrn] = useState('');

    const roles: { value: Role; label: string; description: string; icon: React.ReactNode; color: string; gradient: string }[] = [
        {
            value: 'STUDENT',
            label: 'Student',
            description: 'Create groups, submit proposals and logbooks',
            icon: <BookOpen className="w-6 h-6" />,
            color: 'from-blue-500 to-cyan-500',
            gradient: 'bg-gradient-to-br from-blue-50 to-cyan-50'
        },
        {
            value: 'GUIDE',
            label: 'Faculty Guide',
            description: 'Review logbooks and guide student projects',
            icon: <Users className="w-6 h-6" />,
            color: 'from-purple-500 to-pink-500',
            gradient: 'bg-gradient-to-br from-purple-50 to-pink-50'
        },
        {
            value: 'COORDINATOR',
            label: 'Coordinator',
            description: 'Manage groups and allocate guides',
            icon: <Clipboard className="w-6 h-6" />,
            color: 'from-orange-500 to-red-500',
            gradient: 'bg-gradient-to-br from-orange-50 to-red-50'
        },
        {
            value: 'COMMITTEE',
            label: 'Committee Member',
            description: 'Review evaluations and mark projects',
            icon: <Star className="w-6 h-6" />,
            color: 'from-amber-500 to-yellow-500',
            gradient: 'bg-gradient-to-br from-amber-50 to-yellow-50'
        }
    ];

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isClaiming && !prn) {
            setError('PRN is required to claim your account');
            return;
        }

        if (!email || !password) {
            setError('Email and password are required');
            return;
        }

        try {
            setLoading(true);
            let response;
            if (isClaiming) {
                response = await api.claimAccount({ prn_no: prn, email, password, role: selectedRole as string });
            } else {
                response = await api.login(email, password);
            }
            const user = {
                user_id: response.user_id,
                email: response.email,
                role: response.role,
                prn_no: response.prn_no ?? null,
                roll_no: response.roll_no ?? null,
                batch_year: response.batch_year ?? null,
            };
            setAuth(response.token, user);
            navigate(`/${response.role.toLowerCase()}/dashboard`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated background blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
            </div>

            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg className="w-full h-full">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-7xl">
                    {!selectedRole ? (
                        <>
                            {/* Header */}
                            <div className="text-center mb-16 animate-fade-in">
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl">
                                        <Sparkles className="w-8 h-8 text-white" />
                                    </div>
                                    <h1 className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                        ProTrack-Auto
                                    </h1>
                                </div>
                                <p className="text-xl text-gray-300 font-light tracking-wide">
                                    Academic Project Lifecycle Management System
                                </p>
                                <p className="text-gray-400 mt-2 text-sm">Select your role to continue</p>
                            </div>

                            {/* Role Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {roles.map((role, index) => (
                                    <div
                                        key={role.value}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                        className="animate-slide-up"
                                    >
                                        <button
                                            onClick={() => setSelectedRole(role.value)}
                                            className="group relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 hover:border-white/40 transition-all duration-300 hover:shadow-2xl cursor-pointer"
                                        >
                                            {/* Hover gradient background */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                                            {/* Content */}
                                            <div className="relative z-10 flex flex-col items-start h-full">
                                                {/* Icon */}
                                                <div className={`p-4 rounded-xl bg-gradient-to-br ${role.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                                    {role.icon}
                                                </div>

                                                {/* Text */}
                                                <h3 className="text-2xl font-bold text-white mb-2 text-left">
                                                    {role.label}
                                                </h3>
                                                <p className="text-gray-300 text-sm text-left flex-1">
                                                    {role.description}
                                                </p>

                                                {/* Arrow indicator */}
                                                <div className="mt-6 pt-4 border-t border-white/10 w-full flex items-center text-white/60 group-hover:text-white transition-colors">
                                                    <span className="text-xs font-semibold">SELECT ROLE</span>
                                                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </div>

                                            {/* Gradient border on hover */}
                                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        /* Login Form */
                        <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
                            <div className="w-full max-w-md">
                                {/* Back Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedRole(null);
                                            setEmail('');
                                            setPassword('');
                                            setPrn('');
                                            setIsClaiming(false);
                                            setError('');
                                        }}
                                        className="mb-8 flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
                                    >
                                    <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-2 transition-transform" />
                                    <span>Back to roles</span>
                                </button>

                                {/* Form Container */}
                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-10 shadow-2xl">
                                    {/* Header */}
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className={`p-4 rounded-xl bg-gradient-to-br ${roles.find(r => r.value === selectedRole)?.color || 'from-blue-500 to-cyan-500'} text-white`}>
                                            {roles.find(r => r.value === selectedRole)?.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-white">
                                                {isClaiming ? 'Claim Account' : roles.find(r => r.value === selectedRole)?.label}
                                            </h2>
                                            <p className="text-gray-300 text-sm">{isClaiming ? 'Setup your student account' : 'Enter your credentials'}</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-5">
                                        {/* PRN Field (Only for claiming account) */}
                                        {isClaiming && (
                                            <div className="group">
                                                <label className="block text-white text-sm font-semibold mb-3">
                                                    PRN Number
                                                </label>
                                                <div className="relative">
                                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={prn}
                                                        onChange={(e) => setPrn(e.target.value)}
                                                        placeholder="e.g. 12345678"
                                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Email Field */}
                                        <div className="group">
                                            <label className="block text-white text-sm font-semibold mb-3">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    autoComplete="off"
                                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 text-white rounded-xl focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                                                />
                                            </div>
                                        </div>

                                        {/* Password Field */}
                                        <div className="group">
                                            <label className="block text-white text-sm font-semibold mb-3">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-white transition-colors" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    autoComplete="new-password"
                                                    className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/20 text-white rounded-xl focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="w-5 h-5" />
                                                    ) : (
                                                        <Eye className="w-5 h-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Error Message */}
                                        {error && (
                                            <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-sm animate-shake">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`w-full py-3 px-6 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                                                isLoading
                                                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 opacity-50 cursor-not-allowed'
                                                    : `bg-gradient-to-r ${roles.find(r => r.value === selectedRole)?.color || 'from-blue-500 to-cyan-500'} hover:shadow-2xl hover:scale-105 active:scale-95`
                                            }`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    {isClaiming ? 'Claiming...' : 'Signing in...'}
                                                </>
                                            ) : (
                                                <>
                                                    {isClaiming ? 'Claim Account' : 'Sign In'}
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </form>

                                    {/* Toggle Claim / Login for Students */}
                                    {selectedRole === 'STUDENT' && (
                                        <div className="mt-6 text-center">
                                            <button
                                                onClick={() => setIsClaiming(!isClaiming)}
                                                className="text-blue-300 hover:text-white text-sm font-medium transition-colors"
                                            >
                                                {isClaiming ? 'Already have an account? Sign in' : 'New student? Claim your account'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Demo Credentials — changes per selected role */}
                                    {(() => {
                                        const creds: Record<string, { email: string; password: string }> = {
                                            STUDENT:     { email: 'student1@example.com',     password: 'Student@123' },
                                            GUIDE:       { email: 'guide1@example.com',       password: 'Guide@123' },
                                            COORDINATOR: { email: 'coordinator@example.com',  password: 'Coordinator@123' },
                                            COMMITTEE:   { email: 'committee@example.com',    password: 'Committee@123' },
                                        };
                                        const c = creds[selectedRole] ?? creds['STUDENT'];
                                        return (
                                            <div className="mt-8 pt-8 border-t border-white/10">
                                                <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-widest">Demo Credentials</p>
                                                <div className="bg-white/5 rounded-xl p-4 font-mono text-xs space-y-2 border border-white/[0.08]">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-white/40">Email</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEmail(c.email); setPassword(c.password); }}
                                                            className="text-blue-300 hover:text-blue-200 text-right truncate transition-colors"
                                                        >
                                                            {c.email}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-white/40">Password</span>
                                                        <span className="text-white/70">{c.password}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEmail(c.email); setPassword(c.password); }}
                                                        className="w-full mt-1 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white border border-white/10 hover:border-white/25 rounded-lg transition-all"
                                                    >
                                                        ↑ Auto-fill
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    25% {
                        transform: translateX(-5px);
                    }
                    75% {
                        transform: translateX(5px);
                    }
                }

                .animate-blob {
                    animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                    animation-delay: 2s;
                }

                .animation-delay-4000 {
                    animation-delay: 4s;
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-slide-up {
                    animation: slide-up 0.5s ease-out forwards;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default Login;
