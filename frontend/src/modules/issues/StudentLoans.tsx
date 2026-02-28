import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    BookMarked,
    Calendar,
    AlertCircle,
    CheckCircle,
    Download,
    Clock,
    Receipt
} from 'lucide-react';
import TimeRemaining from '../../components/common/TimeRemaining';

const StudentLoans: React.FC = () => {
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const endpoint = activeTab === 'current' ? '/my-issues' : '/my-history';
            const response = await api.get(endpoint);
            // Handle paginated response
            const data = response.data.data || response.data;
            setLoans(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch loans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, [activeTab]);

    const totalUnpaidFine = loans
        .filter(l => !l.fine_paid)
        .reduce((acc, curr) => acc + parseFloat(curr.fine_amount), 0);

    return (
        <MainLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">My Borrowing Activity</h1>
                    <p className="text-slate-500 font-medium">Keep track of your borrowed books and fines.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={18} />
                        Download PDF Log
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <BookMarked size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active Loans</p>
                        <p className="text-2xl font-black text-slate-900">{loans.filter(l => l.status !== 'returned').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Overdue Now</p>
                        <p className="text-2xl font-black text-slate-900">
                            {loans.filter(l => l.status !== 'returned' && new Date(l.due_date) < new Date()).length}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Fines</p>
                        <p className="text-2xl font-black text-slate-900">₹{totalUnpaidFine.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex border-b border-slate-50 px-8">
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`px-6 py-5 font-bold text-sm transition-all border-b-4 ${activeTab === 'current' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Active Loans
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-5 font-bold text-sm transition-all border-b-4 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Borrowing History
                    </button>
                </div>

                <div className="p-0">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-slate-50/30">
                                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                                    <th className="px-8 py-4">Book Details</th>
                                    <th className="px-8 py-4">Issued On</th>
                                    <th className="px-8 py-4">{activeTab === 'current' ? 'Due Date' : 'Returned On'}</th>
                                    <th className="px-8 py-4">Status & Fines</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                                                    <BookMarked size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{loan.book.title}</p>
                                                    <p className="text-xs text-slate-500 font-medium">ISBN: {loan.book.isbn || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-slate-600">
                                            {new Date(loan.issued_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            {activeTab === 'current' ? (
                                                <TimeRemaining dueDate={loan.due_date} />
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {loan.returned_date ? new Date(loan.returned_date).toLocaleDateString() : '-'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                {loan.status === 'returned' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                                                        <CheckCircle size={12} /> Returned
                                                    </span>
                                                ) : new Date(loan.due_date) < new Date() ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-[10px] font-black uppercase animate-pulse">
                                                        <AlertCircle size={12} /> Overdue
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase">
                                                        <Clock size={12} /> Borrowed
                                                    </span>
                                                )}

                                                {parseFloat(loan.fine_amount) > 0 && (
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${loan.fine_paid ? 'bg-slate-100 text-slate-500 line-through' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        ₹{loan.fine_amount}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {loans.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                                            {activeTab === 'current' ? 'No active book loans.' : 'No borrowing history found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default StudentLoans;
