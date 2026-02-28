import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    Receipt,
    Search,
    Calendar,
    User,
    Book as BookIcon,
    Edit3,
    CheckCircle,
    XCircle,
    AlertCircle,
    Save
} from 'lucide-react';

const FineManagement: React.FC = () => {
    const [unpaidFines, setUnpaidFines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [adjustmentData, setAdjustmentData] = useState({
        fine_amount: '',
        fine_paid: false,
        reason: ''
    });
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const fetchFines = async () => {
        setLoading(true);
        try {
            const response = await api.get('/books/fines-unpaid');
            // Handle paginated response
            const data = response.data.data || response.data;
            setUnpaidFines(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch fines:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFines();
    }, []);

    const handleSelectIssue = (issue: any) => {
        setSelectedIssue(issue);
        setAdjustmentData({
            fine_amount: issue.fine_amount.toString(),
            fine_paid: issue.fine_paid,
            reason: ''
        });
        setMessage(null);
    };

    const handleUpdateFine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIssue) return;

        try {
            await api.post('/books/fine-adjust', {
                issue_id: selectedIssue.id,
                fine_amount: parseFloat(adjustmentData.fine_amount),
                fine_paid: adjustmentData.fine_paid,
                reason: adjustmentData.reason
            });

            setMessage({ text: 'Fine adjusted successfully!', type: 'success' });
            setSelectedIssue(null);
            fetchFines();
        } catch (err: any) {
            setMessage({ text: 'Failed to adjust fine.', type: 'error' });
        }
    };

    return (
        <MainLayout>
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Fine Management</h1>
                    <p className="text-slate-500 font-medium">Manage student penalties and payments.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <Receipt className="text-blue-600" size={24} />
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400">Total Outstanding</p>
                            <p className="text-xl font-black text-slate-900">₹{unpaidFines.reduce((acc, curr) => acc + parseFloat(curr.fine_amount), 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* List of unpaid fines */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Unpaid Fines History</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by student..."
                                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/10"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50/30">
                                    <tr className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-6 py-4">Student & Book</th>
                                        <th className="px-6 py-4">Due Date</th>
                                        <th className="px-6 py-4">Overdue Amount</th>
                                        <th className="px-6 py-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {unpaidFines.map((issue) => (
                                        <tr key={issue.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIssue?.id === issue.id ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{issue.user.name}</span>
                                                    <span className="text-xs text-slate-500 mt-0.5 italic">{issue.book.title}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(issue.due_date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-black">
                                                    ₹{issue.fine_amount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleSelectIssue(issue)}
                                                    className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-600 transition-all"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {unpaidFines.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">
                                                No outstanding fines found. Great job!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Adjustment Panel */}
                <div className="lg:col-span-1">
                    {selectedIssue ? (
                        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-blue-100 animate-in slide-in-from-right duration-300">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Receipt className="text-blue-600" />
                                Fine Adjustment
                            </h3>

                            <div className="mb-6 p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200">
                                        <User size={18} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 leading-none">{selectedIssue.user.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{selectedIssue.user.register_number}</p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-200 mt-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                        <BookIcon size={14} />
                                        <span className="truncate">{selectedIssue.book.title}</span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateFine} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Adjust Amount (₹)</label>
                                    <div className="relative">
                                        <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={adjustmentData.fine_amount}
                                            onChange={(e) => setAdjustmentData({ ...adjustmentData, fine_amount: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl font-black text-2xl focus:ring-4 ring-blue-500/10 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-blue-50/50 transition-colors shadow-sm">
                                        <input
                                            type="checkbox"
                                            checked={adjustmentData.fine_paid}
                                            onChange={(e) => setAdjustmentData({ ...adjustmentData, fine_paid: e.target.checked })}
                                            className="w-6 h-6 rounded-lg text-blue-600 border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="font-bold text-slate-800">Mark as Paid</span>
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentData({ ...adjustmentData, fine_amount: '0', reason: 'Waived by authorized librarian' })}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100 hover:bg-red-100 transition-colors"
                                    >
                                        <XCircle size={16} />
                                        Waive Entire Fine
                                    </button>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Reason for Adjustment</label>
                                    <textarea
                                        value={adjustmentData.reason}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                        className="w-full p-4 bg-slate-100 border-none rounded-2xl text-sm font-medium focus:ring-4 ring-blue-500/10 outline-none"
                                        placeholder="Add a reason (optional)..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedIssue(null)}
                                        className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                        <Save size={20} />
                                        Apply Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Receipt className="text-slate-300" size={32} />
                            </div>
                            <h4 className="font-bold text-slate-800 mb-2">Editor Inactive</h4>
                            <p className="text-slate-400 text-sm">Select an overdue book record from history to adjust or clear its fine.</p>
                        </div>
                    )}

                    {message && (
                        <div className={`mt-6 p-4 rounded-2xl border flex items-start gap-4 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            {message.type === 'success' ? <CheckCircle className="shrink-0" /> : <AlertCircle className="shrink-0" />}
                            <p className="font-bold text-sm tracking-tight">{message.text}</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default FineManagement;
