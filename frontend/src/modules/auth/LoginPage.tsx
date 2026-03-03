import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import { Book, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/login', { email, password });
            login(response.data.access_token, response.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#0f172a] relative overflow-hidden text-slate-200">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />

            {/* Left Column - Branding (Hidden on small screens) */}
            <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Book className="text-white w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-white">LuminaLib<span className="text-blue-500">.</span></span>
                </div>

                <div className="max-w-md">
                    <h1 className="text-5xl font-black text-white leading-tight mb-6">
                        Unlock a world of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">knowledge</span>.
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Access millions of resources, track your reading history, and interact seamlessly with your college library.
                    </p>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                    <span>© 2026 Lumina Library</span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full" />
                    <span>Secure Portal</span>
                </div>
            </div>

            {/* Right Column - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10 max-w-2xl mx-auto w-full">
                <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden group hover:border-slate-700 transition-colors duration-500">

                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80" />

                    {/* Mobile Branding Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Book className="text-white w-7 h-7" />
                        </div>
                    </div>

                    <div className="text-center lg:text-left mb-10">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h2>
                        <p className="text-slate-400 font-medium">Log in to your student dashboard</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-2xl animate-in zoom-in-95 flex items-start gap-3 text-red-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            <p className="text-sm font-medium leading-tight">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email or Reg No.</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border-2 border-slate-800 rounded-2xl outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-all text-white placeholder:text-slate-600 font-medium"
                                    placeholder="Enter your email or ID"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within/input:text-blue-500 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 bg-slate-950/50 border-2 border-slate-800 rounded-2xl outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-all text-white placeholder:text-slate-600 font-medium tracking-wide"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="flex justify-end pt-1">
                                <span className="text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors" onClick={() => navigate('/forgot-password')}>
                                    Forgot password?
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Authenticating...</>
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">
                        New around here? Contact your Librarian for account access.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
