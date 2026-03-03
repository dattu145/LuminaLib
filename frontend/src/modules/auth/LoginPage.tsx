import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
    Book, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight,
    Hash, X, CheckCircle, AlertTriangle, KeyRound
} from 'lucide-react';

// ─────────────────────────────────────────────
// Request Access Modal
// ─────────────────────────────────────────────
type RequestStatus = 'idle' | 'loading' | 'success' | 'not_found';

const RequestAccessModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [regNumber, setRegNumber] = useState('');
    const [status, setStatus] = useState<RequestStatus>('idle');
    const [sentTo, setSentTo] = useState('');

    const handleRequest = async () => {
        if (!regNumber.trim()) return;
        setStatus('loading');
        try {
            const res = await api.post('/request-account-details', {
                register_number: regNumber.trim()
            });
            // Extract partially masked email from the message or just confirm success
            setSentTo(res.data?.email || '');
            setStatus('success');
        } catch (err: any) {
            if (err.response?.status === 404) {
                setStatus('not_found');
            } else {
                setStatus('not_found'); // fallback — show not found
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/60 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">

                {/* Top accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-500/15 rounded-2xl flex items-center justify-center shrink-0">
                            <KeyRound size={22} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Request Access</h3>
                            <p className="text-slate-400 text-sm mt-0.5 font-medium">
                                Enter your register number to receive your login credentials via email.
                            </p>
                        </div>
                    </div>

                    {/* IDLE / LOADING state — show input */}
                    {(status === 'idle' || status === 'loading') && (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                                    Register Number
                                </label>
                                <div className="relative group/input">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within/input:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={regNumber}
                                        onChange={(e) => setRegNumber(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRequest()}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border-2 border-slate-800 rounded-2xl outline-none focus:border-blue-500 focus:bg-slate-900/80 transition-all text-white placeholder:text-slate-600 font-mono font-bold text-sm"
                                        placeholder="e.g. 621522243031"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleRequest}
                                disabled={status === 'loading' || !regNumber.trim()}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl transition-all uppercase tracking-wider text-sm disabled:opacity-50 shadow-lg shadow-blue-500/20"
                            >
                                {status === 'loading' ? (
                                    <><Loader2 size={16} className="animate-spin" /> Checking & Sending...</>
                                ) : (
                                    <>Send My Credentials ✉️</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* SUCCESS state */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center text-center gap-4 py-4">
                            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center">
                                <CheckCircle size={32} className="text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-black text-lg">Email Sent!</h4>
                                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                    Your temporary password has been sent to the email address registered with{' '}
                                    <span className="text-blue-400 font-bold font-mono">
                                        Reg: {regNumber}
                                    </span>.
                                </p>
                                <p className="text-slate-500 text-xs mt-3 font-medium">
                                    Check your inbox (and spam folder). Log in with that password and then change it from your profile settings.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}

                    {/* NOT FOUND state */}
                    {status === 'not_found' && (
                        <div className="flex flex-col items-center text-center gap-4 py-4">
                            <div className="w-16 h-16 bg-amber-500/15 rounded-full flex items-center justify-center">
                                <AlertTriangle size={32} className="text-amber-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-black text-lg">Not Yet Registered</h4>
                                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                    No account found for register number{' '}
                                    <span className="text-white font-bold font-mono">{regNumber}</span>.
                                </p>
                                <p className="text-slate-500 text-xs mt-3 font-medium">
                                    It looks like your data hasn't been added to the system yet. Please contact your librarian to get your account created.
                                </p>
                            </div>
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={() => { setStatus('idle'); setRegNumber(''); }}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition-colors text-sm"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-2xl transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────────
const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showRequestAccess, setShowRequestAccess] = useState(false);

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

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-slate-800" />
                        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">or</span>
                        <div className="flex-1 h-px bg-slate-800" />
                    </div>

                    {/* Request Access Button */}
                    <button
                        onClick={() => setShowRequestAccess(true)}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-300 hover:text-white font-bold py-3.5 rounded-2xl transition-all text-sm"
                    >
                        <KeyRound size={16} className="text-blue-400" />
                        First Time? Request Access
                    </button>

                    <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                        Accounts are managed by your librarian
                    </p>
                </div>
            </div>

            {/* Request Access Modal */}
            {showRequestAccess && (
                <RequestAccessModal onClose={() => setShowRequestAccess(false)} />
            )}
        </div>
    );
};

export default LoginPage;
