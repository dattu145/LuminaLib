import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';
import {
    Book, Lock, Mail, User as UserIcon, Hash, Phone, Eye, EyeOff,
    CheckCircle2, XCircle, AlertCircle, Shield
} from 'lucide-react';

interface PasswordRule {
    label: string;
    test: (p: string) => boolean;
}

const passwordRules: PasswordRule[] = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
    { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getPasswordStrength = (password: string) => {
    const passed = passwordRules.filter(r => r.test(password)).length;
    if (passed <= 1) return { label: 'Very Weak', color: 'bg-red-500', width: 'w-1/5' };
    if (passed === 2) return { label: 'Weak', color: 'bg-orange-500', width: 'w-2/5' };
    if (passed === 3) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-3/5' };
    if (passed === 4) return { label: 'Strong', color: 'bg-blue-500', width: 'w-4/5' };
    return { label: 'Very Strong', color: 'bg-emerald-500', width: 'w-full' };
};

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        register_number: '',
        password: '',
        password_confirmation: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side password validation
        const failedRules = passwordRules.filter(r => !r.test(formData.password));
        if (failedRules.length > 0) {
            setError('Password does not meet all requirements. Please check the rules below.');
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match. Please re-enter.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/register', formData);
            login(response.data.access_token, response.data.user);
            navigate('/');
        } catch (err: any) {
            const msg = err.response?.data?.errors?.email?.[0]
                || err.response?.data?.message
                || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const strength = formData.password ? getPasswordStrength(formData.password) : null;
    const passwordsMatch = formData.password_confirmation.length > 0
        && formData.password === formData.password_confirmation;
    const passwordsMismatch = formData.password_confirmation.length > 0
        && formData.password !== formData.password_confirmation;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 py-12">
            <div className="max-w-lg w-full">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/80 p-8 lg:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
                            <Book className="text-white w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Join the Library</h2>
                        <p className="text-slate-500 mt-2 font-medium">Create your student account to get started</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-start gap-3">
                            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name + Register No */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                                        placeholder="D. Kumar"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Register No.</label>
                                <div className="relative">
                                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input
                                        name="register_number"
                                        type="text"
                                        required
                                        value={formData.register_number}
                                        onChange={handleChange}
                                        className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                                        placeholder="621522243..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder="yourname@gmail.com"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    className="block w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400"
                                    placeholder="Min. 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password strength bar */}
                            {formData.password && strength && (
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ml-3 ${strength.color.replace('bg-', 'text-')}`}>
                                            {strength.label}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Password rules checklist */}
                            {(passwordFocused || formData.password.length > 0) && (
                                <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 mb-3">
                                        <Shield size={11} /> Password Requirements
                                    </p>
                                    {passwordRules.map((rule) => {
                                        const passed = rule.test(formData.password);
                                        return (
                                            <div key={rule.label} className="flex items-center gap-2">
                                                {passed
                                                    ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                    : <XCircle size={14} className="text-slate-300 shrink-0" />
                                                }
                                                <span className={`text-xs font-medium ${passed ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {rule.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    name="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password_confirmation}
                                    onChange={handleChange}
                                    className={`block w-full pl-10 pr-12 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 ${passwordsMismatch
                                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                                        : passwordsMatch
                                            ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-400'
                                            : 'border-slate-200 focus:ring-blue-500/30 focus:border-blue-400'
                                        }`}
                                    placeholder="Re-enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                {/* Match status icon */}
                                {formData.password_confirmation && (
                                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                        {passwordsMatch
                                            ? <CheckCircle2 size={16} className="text-emerald-500" />
                                            : <XCircle size={16} className="text-red-400" />
                                        }
                                    </div>
                                )}
                            </div>
                            {passwordsMismatch && (
                                <p className="text-xs text-red-500 font-medium ml-1 mt-1">Passwords do not match</p>
                            )}
                            {passwordsMatch && (
                                <p className="text-xs text-emerald-600 font-medium ml-1 mt-1">Passwords match ✓</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed mt-2 active:scale-95 text-sm tracking-wide uppercase"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : 'Create My Account'}
                        </button>
                    </form>

                    {/* Footer links */}
                    <div className="mt-6 text-center space-y-3">
                        <p className="text-sm text-slate-500 font-medium">
                            Already have an account?{' '}
                            <span
                                className="text-blue-600 font-bold cursor-pointer hover:underline"
                                onClick={() => navigate('/login')}
                            >
                                Sign in instead
                            </span>
                        </p>
                        <p className="text-xs text-slate-400">
                            Forgot your password?{' '}
                            <span
                                className="text-slate-500 font-semibold cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                onClick={() => navigate('/forgot-password')}
                            >
                                Reset it here
                            </span>
                            <span className="ml-1 text-slate-300 text-[10px]">(coming soon)</span>
                        </p>
                    </div>
                </div>

                {/* Bottom note */}
                <p className="text-center text-xs text-slate-400 mt-6 font-medium">
                    By creating an account, you agree to the library's terms &amp; conditions.
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
