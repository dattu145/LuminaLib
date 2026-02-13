import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../store/AuthContext';
import api from '../services/api';
import {
    BookOpen,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowUpRight,
    Search,
    BookMarked,
    Receipt,
    History as HistoryIcon,
    Users
} from 'lucide-react';
import TimeRemaining from '../components/common/TimeRemaining';

const StatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string, trend?: string }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="flex justify-between items-start">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                {icon}
            </div>
            {trend && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                    <ArrowUpRight size={12} />
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);

const StudentDashboard = () => {
    const [stats, setStats] = React.useState<any>(null);
    const [loans, setLoans] = React.useState<any[]>([]);
    const [sessions, setSessions] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [loansRes, sessionsRes] = await Promise.all([
                    api.get('/my-issues'),
                    api.get('/my-sessions')
                ]);

                // Handle paginated responses
                const loansData = loansRes.data.data || loansRes.data;
                const sessionsData = sessionsRes.data.data || sessionsRes.data;

                setLoans(loansData);
                setSessions(sessionsData);

                // Calculate stats locally from fetched data
                const activeLoans = Array.isArray(loansData) ? loansData.filter((l: any) => l.status !== 'returned') : [];
                const overdue = activeLoans.filter((l: any) => new Date(l.due_date) < new Date());
                const totalFine = Array.isArray(loansData) ? loansData.reduce((acc: number, curr: any) => acc + (curr.fine_paid ? 0 : parseFloat(curr.fine_amount)), 0) : 0;
                const avgSession = Array.isArray(sessionsData) && sessionsData.length > 0
                    ? Math.round(sessionsData.reduce((acc: number, s: any) => acc + (s.total_duration || 0), 0) / sessionsData.length)
                    : 0;

                setStats({ activeLoans: activeLoans.length, overdue: overdue.length, totalFine, avgSession });
            } catch (error) {
                console.error('Dashboard fetch error:', error);
            }
        };
        fetchData();
    }, []);

    const activeSession = sessions[0] && !sessions[0].check_out_time ? sessions[0] : null;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Loans"
                    value={stats?.activeLoans || 0}
                    icon={<BookOpen className="text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard
                    title="Overdue"
                    value={stats?.overdue || 0}
                    icon={<AlertCircle className="text-orange-600" />}
                    color="bg-orange-50"
                />
                <StatCard
                    title="Unpaid Fines"
                    value={`₹${stats?.totalFine?.toFixed(2) || '0.00'}`}
                    icon={<Receipt className="text-red-600" />}
                    color="bg-red-50"
                />
                <StatCard
                    title="Avg. Session"
                    value={`${stats?.avgSession || 0}m`}
                    icon={<Clock className="text-emerald-600" />}
                    color="bg-emerald-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">My Issued Books</h3>
                        <Link to="/my-loans" className="text-sm text-blue-600 font-semibold hover:underline">View All</Link>
                    </div>
                    <div className="space-y-4">
                        {(Array.isArray(loans) ? loans : []).filter(l => l.status !== 'returned').slice(0, 3).map((loan, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                                        <BookMarked size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{loan.book.title}</p>
                                        <TimeRemaining dueDate={loan.due_date} />
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${new Date(loan.due_date) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}>
                                    {new Date(loan.due_date) < new Date() ? 'Overdue' : 'On Track'}
                                </span>
                            </div>
                        ))}
                        {(Array.isArray(loans) ? loans : []).filter(l => l.status !== 'returned').length === 0 && (
                            <div className="text-center py-10 text-slate-400 italic">No active loans.</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 font-black uppercase tracking-widest text-[11px] text-slate-400">Library Presence</h3>
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                            <div className="absolute inset-0 border-8 border-slate-50 rounded-full"></div>
                            <div className={`absolute inset-0 border-8 ${activeSession ? 'border-blue-500 animate-spin-slow' : 'border-slate-200'} rounded-full border-t-transparent`}></div>
                            <div className="text-center">
                                <p className={`text-xl font-black ${activeSession ? 'text-blue-600' : 'text-slate-300'}`}>
                                    {activeSession ? 'INSIDE' : 'OFFLINE'}
                                </p>
                                {activeSession && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tracking Time</p>}
                            </div>
                        </div>
                        {activeSession ? (
                            <>
                                <p className="text-sm text-slate-800 font-bold text-center">Started at {new Date(activeSession.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-xs text-slate-400 mt-1 uppercase font-black">Reading Room Area</p>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 text-center font-medium">Scan your ID at the terminal to check-in.</p>
                        )}
                        <Link to="/student-sessions" className="mt-8 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all text-center shadow-lg shadow-slate-200">
                            View Full History
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LibrarianDashboard = () => {
    const [sessionStats, setSessionStats] = React.useState<any>(null);
    const [bookStats, setBookStats] = React.useState<any>(null);

    const fetchLibData = async () => {
        try {
            const [sessionRes, bookRes] = await Promise.all([
                api.get('/sessions/stats'),
                api.get('/books/stats')
            ]);
            setSessionStats(sessionRes.data);
            setBookStats(bookRes.data);
        } catch (error) {
            console.error('Librarian dashboard fetch error:', error);
        }
    };

    React.useEffect(() => {
        fetchLibData();
        // Polling every 15 seconds for real-time vibe
        const interval = setInterval(fetchLibData, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Books"
                    value={bookStats?.total_titles || '...'}
                    icon={<BookMarked className="text-blue-600" />}
                    color="bg-blue-50"
                    trend="Catalog"
                />
                <StatCard
                    title="Live Inside"
                    value={sessionStats?.currently_inside || 0}
                    icon={<Users className="text-purple-600" />}
                    color="bg-purple-50"
                    trend="Now"
                />
                <StatCard
                    title="Borrowed"
                    value={bookStats?.borrowed_copies || 0}
                    icon={<BookOpen className="text-orange-600" />}
                    color="bg-orange-50"
                />
                <StatCard
                    title="Today's Walkins"
                    value={sessionStats?.total_today || 0}
                    icon={<CheckCircle2 className="text-emerald-600" />}
                    color="bg-emerald-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                        <HistoryIcon size={20} className="text-blue-500" />
                        Quick Access
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/issues" className="p-6 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group">
                            <BookOpen className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-bold text-blue-900">Issue Book</p>
                            <p className="text-xs text-blue-600 font-medium">Register new loan</p>
                        </Link>
                        <Link to="/sessions" className="p-6 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-100 transition-all group">
                            <Users className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                            <p className="font-bold text-purple-900">Entrance</p>
                            <p className="text-xs text-purple-600 font-medium">Monitor live students</p>
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-lg font-black text-slate-900 mb-6">Library Health</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                                <span>Catalog Saturation</span>
                                <span className="text-slate-900">82%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-[82%] shadow-lg shadow-blue-500/20"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg. Stay Today</p>
                                <p className="text-xl font-black text-slate-800">{sessionStats?.avg_duration || 0}m</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Capacity</p>
                                <p className="text-xl font-black text-slate-800">High</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <MainLayout>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome back, {user?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search books..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                        />
                    </div>
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 relative">
                        <AlertCircle size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </div>
                </div>
            </header>

            {user?.role === 'admin' || user?.role === 'librarian' ? (
                <LibrarianDashboard />
            ) : (
                <StudentDashboard />
            )}
        </MainLayout>
    );
};

export default Dashboard;
