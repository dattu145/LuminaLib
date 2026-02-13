import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { QrCode, Keyboard, ArrowRight, CheckCircle, LogOut as LogOutIcon, AlertCircle } from 'lucide-react';

const LibraryKiosk: React.FC = () => {
    const [registerNumber, setRegisterNumber] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastActivity, setLastActivity] = useState<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!registerNumber) return;

        setLoading(true);
        setMessage(null);

        try {
            const response = await api.post('/sessions/log', { register_number: registerNumber });
            setMessage({
                text: response.data.message,
                type: response.data.type === 'checkin' ? 'success' : 'info'
            });
            setLastActivity(response.data);
            setRegisterNumber('');

            // Clear message after 5 seconds
            setTimeout(() => setMessage(null), 5000);
        } catch (err: any) {
            setMessage({
                text: err.response?.data?.message || 'Invalid register number or system error.',
                type: 'error'
            });
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Left Side: Info */}
                <div className="text-white space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 font-bold text-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        GATEWAY TERMINAL ACTIVE
                    </div>
                    <h1 className="text-5xl font-black leading-tight">Lumina Library <br /><span className="text-blue-500">Automated Entry</span></h1>
                    <p className="text-slate-400 text-lg">
                        Please scan your ID or enter your register number to check-in/out. Your time in the library is tracked automatically.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <QrCode className="text-blue-500 mb-2" size={32} />
                            <p className="font-bold">QR Scanner</p>
                            <p className="text-xs text-slate-500">Always active</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                            <Keyboard className="text-purple-500 mb-2" size={32} />
                            <p className="font-bold">Manual Entry</p>
                            <p className="text-xs text-slate-500">Use keyboard below</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Input Panel */}
                <div className="bg-white rounded-[2rem] shadow-2xl p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16"></div>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">Access Control</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">Register Number</label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={registerNumber}
                                    onChange={(e) => setRegisterNumber(e.target.value)}
                                    className="w-full text-3xl font-black bg-slate-100 border-none rounded-2xl px-6 py-5 focus:ring-4 ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="REG-000-000"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !registerNumber}
                                className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 active:scale-95"
                            >
                                {loading ? 'Processing...' : 'Proceed'}
                                <ArrowRight />
                            </button>
                        </form>

                        {message && (
                            <div className={`mt-8 p-6 rounded-2xl border-2 flex items-start gap-4 animate-in fade-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                                    message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                        'bg-blue-50 border-blue-200 text-blue-800'
                                }`}>
                                {message.type === 'success' ? <CheckCircle className="shrink-0" /> :
                                    message.type === 'info' ? <LogOutIcon className="shrink-0" /> :
                                        <AlertCircle className="shrink-0" />}
                                <div>
                                    <p className="font-black text-xl leading-none mb-1">{message.text}</p>
                                    {lastActivity && (
                                        <p className="text-sm font-medium opacity-80">
                                            User: {lastActivity.user}
                                            {lastActivity.duration && ` • Spent: ${lastActivity.duration} mins`}
                                            {lastActivity.time && ` • Time: ${lastActivity.time}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {!message && (
                            <div className="mt-12 text-center text-slate-400">
                                <p className="text-sm font-medium">Ready for next session</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryKiosk;
