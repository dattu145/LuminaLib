import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    BookOpen,
    UserPlus,
    Calendar,
    CheckCircle,
    AlertCircle,
    Hash,
    ArrowRight,
    ClipboardList,
    History as HistoryIcon
} from 'lucide-react';

const BookCirculation: React.FC = () => {
    const [formData, setFormData] = useState({
        register_number: '',
        book_code: ''
    });
    const [activeIssues, setActiveIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const fetchActiveIssues = async () => {
        try {
            const response = await api.get('/books/issued-active');
            // Handle paginated response
            const data = response.data.data || response.data;
            setActiveIssues(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch issues:', error);
        }
    };

    useEffect(() => {
        fetchActiveIssues();
    }, []);

    const handleIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await api.post('/books/issue', formData);
            setMessage({ text: response.data.message, type: 'success' });
            setFormData({ register_number: '', book_code: '' });
            fetchActiveIssues();
        } catch (err: any) {
            setMessage({
                text: err.response?.data?.message || 'Failed to issue book. Check details.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">Book Circulation</h1>
                <p className="text-slate-500 font-medium">Issue or manage book loans.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Issue Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <BookOpen className="text-blue-600" size={20} />
                            Issue New Book
                        </h3>

                        {message && (
                            <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                                }`}>
                                {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleIssue} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Student Register No.</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.register_number}
                                        onChange={(e) => setFormData({ ...formData, register_number: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="REG-000-000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Book Code (Accession No.)</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.book_code}
                                        onChange={(e) => setFormData({ ...formData, book_code: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                                        placeholder="BK-000"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Issue Book'}
                                <ArrowRight size={18} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Active Issues List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <ClipboardList className="text-slate-400" size={24} />
                                <h3 className="text-lg font-bold text-slate-900">Active Book Issues</h3>
                            </div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                                {activeIssues.length} Active
                            </span>
                        </div>

                        <div className="p-0">
                            {activeIssues.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-slate-400 uppercase text-[11px] font-black tracking-widest border-b border-slate-50">
                                                <th className="px-8 py-4">Book</th>
                                                <th className="px-8 py-4">Issued To</th>
                                                <th className="px-8 py-4">Due Date</th>
                                                <th className="px-8 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {activeIssues.map((issue) => (
                                                <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{issue.book.title}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{issue.book.book_code}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="font-bold text-slate-800">{issue.user.name}</p>
                                                        <p className="text-xs text-slate-500">{issue.user.register_number}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            {new Date(issue.due_date).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center justify-between gap-4">
                                                            {new Date(issue.due_date) < new Date() ? (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold ring-4 ring-red-50">
                                                                    <AlertCircle size={10} /> Overdue
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                                    <CheckCircle size={10} /> Active
                                                                </span>
                                                            )}

                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm(`Mark "${issue.book.title}" as returned?`)) {
                                                                        setLoading(true);
                                                                        try {
                                                                            const res = await api.post('/books/return', { issue_id: issue.id });
                                                                            setMessage({
                                                                                text: `Returned successfully. Fine: ₹${res.data.fine_amount}`,
                                                                                type: 'success'
                                                                            });
                                                                            fetchActiveIssues();
                                                                        } catch (err: any) {
                                                                            setMessage({ text: 'Failed to return book.', type: 'error' });
                                                                        } finally {
                                                                            setLoading(false);
                                                                        }
                                                                    }
                                                                }}
                                                                className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-all active:scale-95"
                                                            >
                                                                Return
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <HistoryIcon size={32} className="text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-medium">No active book loans at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </MainLayout>
    );
};

export default BookCirculation;
