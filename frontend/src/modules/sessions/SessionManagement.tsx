import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    Users,
    Clock,
    Search,
    Download,
    UserCheck,
    UserMinus,
    Filter,
    RefreshCw
} from 'lucide-react';

const SessionManagement: React.FC = () => {
    const [liveSessions, setLiveSessions] = useState<any[]>([]);
    const [todaySessions, setTodaySessions] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'live' | 'today'>('live');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [liveRes, todayRes, statsRes] = await Promise.all([
                api.get('/sessions/live'),
                api.get('/sessions/today'),
                api.get('/sessions/stats')
            ]);
            // Handle paginated responses
            setLiveSessions(liveRes.data.data || liveRes.data);
            setTodaySessions(todayRes.data.data || todayRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto refresh every 10 seconds for enterprise live monitoring
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <MainLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Library Presence</h1>
                    <p className="text-slate-500 font-medium">Monitoring real-time check-ins and session history.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200">
                        <Download size={20} />
                        <span>Export Logs</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Inside</p>
                        <p className="text-3xl font-black text-slate-900">{stats?.currently_inside || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Today's Total</p>
                        <p className="text-3xl font-black text-slate-900">{stats?.total_today || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Clock size={28} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Avg. Duration</p>
                        <p className="text-3xl font-black text-slate-900">{stats?.avg_duration || 0}m</p>
                    </div>
                </div>
            </div>

            {/* Tabs & Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-100 px-8">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-6 py-5 font-bold text-sm transition-all border-b-4 ${activeTab === 'live' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Live Monitoring
                    </button>
                    <button
                        onClick={() => setActiveTab('today')}
                        className={`px-6 py-5 font-bold text-sm transition-all border-b-4 ${activeTab === 'today' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Today's Log
                    </button>
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name or register number..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
                            <Filter size={18} />
                            <span>Filters</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="text-slate-400 uppercase text-[11px] font-black tracking-widest border-b border-slate-50">
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Register No.</th>
                                    <th className="px-4 py-3">Check In</th>
                                    {activeTab === 'today' && <th className="px-4 py-3">Check Out</th>}
                                    <th className="px-4 py-3">Duration</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(activeTab === 'live' ? liveSessions : todaySessions).map((session) => (
                                    <tr key={session.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    {session.user.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-800">{session.user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 font-medium text-slate-500">{session.user.register_number}</td>
                                        <td className="px-4 py-4 text-slate-600 font-medium">
                                            {new Date(session.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        {activeTab === 'today' && (
                                            <td className="px-4 py-4 text-slate-600 font-medium">
                                                {session.check_out_time
                                                    ? new Date(session.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : '-'
                                                }
                                            </td>
                                        )}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                                <Clock size={14} />
                                                {session.total_duration ? `${session.total_duration}m` : 'Active'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {session.check_out_time ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                                    <UserMinus size={12} />
                                                    Checked Out
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                    <UserCheck size={12} />
                                                    Inside
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {((activeTab === 'live' ? liveSessions : todaySessions).length === 0) && !loading && (
                            <div className="text-center py-20 text-slate-400">
                                <p className="text-lg font-medium">No sessions found for this period.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default SessionManagement;
