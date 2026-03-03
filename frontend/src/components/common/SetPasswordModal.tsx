import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck, Eye, EyeOff, ChevronRight, RotateCcw, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Props {
    email: string;
    onClose: () => void;
}

type Step = 1 | 2 | 3; // 1=Send OTP, 2=Verify OTP, 3=Set Password

const API = 'http://localhost:8000/api';

const SetPasswordModal: React.FC<Props> = ({ email, onClose }) => {
    const [step, setStep] = useState<Step>(1);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // ─── Step 1: Send OTP ───────────────────────────────────────────────────
    const handleRequestOTP = async () => {
        setLoading(true);
        try {
            await axios.post(`${API}/auth/request-password-update`, { email });
            toast.success('OTP sent! Check your email inbox.');
            setStep(2);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 2: Verify OTP ─────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (otp.length < 6) { toast.error('Enter the full 6-digit OTP.'); return; }
        setLoading(true);
        try {
            await axios.post(`${API}/auth/verify-otp`, { email, otp });
            toast.success('OTP verified! Now set your new password.');
            setStep(3);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Invalid OTP. Check and try again.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 3: Set New Password ────────────────────────────────────────────
    const handleSetPassword = async () => {
        if (newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await axios.post(`${API}/auth/verify-password-update`, { email, otp, newPassword });
            toast.success('Password updated successfully!', { duration: 4000 });
            setTimeout(() => {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }, 1800);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    const stepLabels = ['Send OTP', 'Verify OTP', 'Set Password'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Lock size={20} />
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <h2 className="text-xl font-black">Set New Password</h2>
                    <p className="text-blue-100 text-sm mt-1">
                        {step === 1 && 'We will send a one-time code to your email.'}
                        {step === 2 && 'Enter the 6-digit code from your email.'}
                        {step === 3 && 'OTP verified! Choose your new password.'}
                    </p>
                </div>

                {/* Step Indicators */}
                <div className="flex border-b border-slate-100">
                    {stepLabels.map((label, i) => {
                        const s = (i + 1) as Step;
                        const isDone = step > s;
                        const isActive = step === s;
                        return (
                            <div key={s} className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1 ${isActive ? 'text-blue-600 border-b-2 border-blue-600' : isDone ? 'text-green-600' : 'text-slate-300'}`}>
                                {isDone ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[8px]">{s}</span>}
                                {label}
                            </div>
                        );
                    })}
                </div>

                {/* Body */}
                <div className="px-8 py-7 space-y-5">

                    {/* ── STEP 1: Send OTP ── */}
                    {step === 1 && (
                        <>
                            <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
                                <Mail size={20} className="text-blue-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">OTP will be sent to:</p>
                                    <p className="text-sm text-blue-700 font-mono mt-0.5 break-all">{email}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your account was set up with a default password. Click below to receive a secure one-time code, then set your own password.
                            </p>
                            <button onClick={handleRequestOTP} disabled={loading}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                {loading
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                                    : <><Mail size={18} />Send OTP to My Email</>}
                            </button>
                        </>
                    )}

                    {/* ── STEP 2: Verify OTP ── */}
                    {step === 2 && (
                        <>
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 text-center font-medium">
                                Check your email at <strong>{email}</strong>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    6-Digit OTP <span className="text-slate-400 font-normal">(from your email)</span>
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="· · · · · ·"
                                    className="w-full px-4 py-4 text-3xl tracking-[1.2rem] font-mono text-center bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => { setStep(1); setOtp(''); }} disabled={loading}
                                    className="px-4 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-60">
                                    <RotateCcw size={15} /> Resend
                                </button>
                                <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {loading
                                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>
                                        : <><ShieldCheck size={18} />Verify OTP<ChevronRight size={16} /></>}
                                </button>
                            </div>
                        </>
                    )}

                    {/* ── STEP 3: Set Password (only shown after OTP verified) ── */}
                    {step === 3 && (
                        <>
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-xs text-green-800 text-center font-semibold flex items-center justify-center gap-2">
                                <CheckCircle size={14} className="text-green-600" /> OTP verified — now set your new password
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        autoFocus
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {newPassword.length > 0 && newPassword.length < 8 && (
                                    <p className="text-xs text-red-500 mt-1">Must be at least 8 characters</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your new password"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                            </div>
                            <button onClick={handleSetPassword}
                                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2">
                                {loading
                                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</>
                                    : <><Lock size={18} />Set Password</>}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetPasswordModal;
