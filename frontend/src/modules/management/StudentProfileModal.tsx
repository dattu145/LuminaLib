import React, { useState, useEffect } from 'react';
import { X, BookOpen, Clock, AlertTriangle, User, Hash, Briefcase, Phone, Mail, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Props {
    registerNumber: string;
    onClose: () => void;
}

const StudentProfileModal: React.FC<Props> = ({ registerNumber, onClose }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isReturning, setIsReturning] = useState<string | null>(null);

    const fetchProfile = async () => {
        try {
            const res = await api.get(`/circulation/student/${registerNumber}`);
            setData(res.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to fetch student profile');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line
    }, [registerNumber]);

    const handleReturn = async (issueId: string) => {
        setIsReturning(issueId);
        try {
            const res = await api.post('/books/return-by-id', { issue_id: issueId });
            toast.success(`Book returned! Fines added: ₹${res.data.fine_amount}`);
            fetchProfile(); // Refresh
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to return book');
        } finally {
            setIsReturning(null);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data) return null;

    const { student, active_issues, history, total_outstanding_fine, can_borrow } = data;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-screen">
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 flex flex-col">

                {/* Header Profile Section */}
                <div className="bg-white px-8 py-6 border-b border-slate-100 shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                <User size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                    {student.name}
                                    {!student.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Inactive</span>}
                                </h2>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mt-2">
                                    <span className="flex items-center gap-1.5"><Hash size={14} className="text-slate-400" /> {student.register_number}</span>
                                    <span className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400" /> {student.email}</span>
                                    <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400" /> {student.department || 'N/A'}</span>
                                    <span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400" /> {student.phone || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Active Issues</p>
                                <p className="text-xl font-bold text-blue-900">{active_issues?.length || 0} <span className="text-xs font-medium text-blue-600">/ 3 limit</span></p>
                            </div>
                            <BookOpen size={24} className="text-blue-300" />
                        </div>
                        <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1">Total Fines</p>
                                <p className="text-xl font-bold text-red-900">₹{total_outstanding_fine}</p>
                            </div>
                            <AlertTriangle size={24} className="text-red-300" />
                        </div>
                        <div className={`border p-4 rounded-xl flex items-center justify-between ${can_borrow ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${can_borrow ? 'text-emerald-500' : 'text-slate-400'}`}>Status</p>
                                <p className={`text-sm font-bold ${can_borrow ? 'text-emerald-700' : 'text-slate-600'}`}>
                                    {can_borrow ? '✅ Can Borrow' : '❌ Cannot Borrow'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Active Issues Section */}
                    <div>
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <BookOpen size={20} className="text-blue-500" /> Currently Issued Books
                        </h3>
                        {active_issues && active_issues.length > 0 ? (
                            <div className="space-y-3">
                                {active_issues.map((issue: any) => {
                                    const DueDate = new Date(issue.due_date);
                                    const isOverdue = DueDate < new Date();
                                    return (
                                        <div key={issue.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800">{issue.book?.title}</h4>
                                                <div className="flex gap-4 mt-1 text-sm font-medium">
                                                    <span className="text-slate-500">Code: <span className="font-mono text-slate-700">{issue.book?.book_code}</span></span>
                                                    <span className={isOverdue ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                                                        Due: {DueDate.toLocaleDateString()}
                                                    </span>
                                                    {isOverdue && <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded text-xs">₹{issue.estimated_fine} pending fine</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleReturn(issue.id)}
                                                disabled={isReturning === issue.id}
                                                className="shrink-0 flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition-colors disabled:opacity-50"
                                            >
                                                {isReturning === issue.id ? 'Returning...' : <><RotateCcw size={16} /> Mark Returned</>}
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
                                <p className="text-slate-400 font-medium">No active issues at the moment.</p>
                            </div>
                        )}
                    </div>

                    {/* History Section */}
                    <div>
                        <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-slate-400" /> Recent Borrowing History
                        </h3>
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Book Title</th>
                                        <th className="px-5 py-3 font-semibold">Issued Date</th>
                                        <th className="px-5 py-3 font-semibold">Returned Date</th>
                                        <th className="px-5 py-3 font-semibold">Fine Amount</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history && history.length > 0 ? history.map((h: any) => (
                                        <tr key={h.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3 font-medium text-slate-800">{h.book?.title}</td>
                                            <td className="px-5 py-3 text-slate-500">{new Date(h.issued_date).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-slate-500">{h.returned_date ? new Date(h.returned_date).toLocaleDateString() : '--'}</td>
                                            <td className="px-5 py-3 text-slate-700 font-mono">₹{h.fine_amount || 0}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${h.status === 'returned' ? 'bg-emerald-100 text-emerald-700' : h.status === 'overdue' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {h.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">No history found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfileModal;
