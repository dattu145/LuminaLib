import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    History,
    Clock,
    Calendar,
    UserCheck,
    UserMinus,
    Timer
} from 'lucide-react';

const StudentSessions: React.FC = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/my-sessions');
            // Handle paginated response
            const data = response.data.data || response.data;
            setSessions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return (
        <MainLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">My Session History</h1>
                <p className="text-slate-500 font-medium">Tracking your time spent in the library.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <History size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Visits</p>
                        <p className="text-2xl font-black text-slate-900">{sessions.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Timer size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avg. Time</p>
                        <p className="text-2xl font-black text-slate-900">
                            {sessions.length > 0
                                ? Math.round(sessions.reduce((acc, s) => acc + (s.total_duration || 0), 0) / sessions.length)
                                : 0}m
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Current Status</p>
                        <p className="text-lg font-black text-slate-900">
                            {sessions[0] && !sessions[0].check_out_time ? 'Inside Library' : 'Offline'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-slate-400" size={20} />
                        Recent Activity Log
                    </h3>
                </div>

                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                <th className="px-8 py-4">Date</th>
                                <th className="px-8 py-4">Check In</th>
                                <th className="px-8 py-4">Check Out</th>
                                <th className="px-8 py-4">Total Time</th>
                                <th className="px-8 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 font-bold text-slate-900">
                                            <Calendar size={16} className="text-slate-400" />
                                            {new Date(session.check_in_time).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-medium text-slate-600">
                                        {new Date(session.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-8 py-5 font-medium text-slate-600">
                                        {session.check_out_time
                                            ? new Date(session.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : '-'
                                        }
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="font-bold text-slate-800">
                                            {session.total_duration ? `${session.total_duration} mins` : 'Logging...'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        {session.check_out_time ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                <UserMinus size={12} /> Completed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold animate-pulse">
                                                <UserCheck size={12} /> Active Now
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-slate-400 font-medium italic">
                                        Your session history is currently empty. Visit the library soon!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MainLayout>
    );
};

export default StudentSessions;
