import React, { useState, useEffect } from 'react';
import { X, Search, User, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface IssueBookModalProps {
    book: any;
    onClose: () => void;
    onSuccess: () => void;
}

const IssueBookModal: React.FC<IssueBookModalProps> = ({ book, onClose, onSuccess }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [isIssuing, setIsIssuing] = useState(false);

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const res = await api.get(`/admin/students/search?q=${searchQuery}`);
                    setStudents(res.data);
                } catch (err) {
                    console.error('Failed to search students:', err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setStudents([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handleIssue = async () => {
        if (!selectedStudent) return;
        setIsIssuing(true);
        try {
            await api.post('/books/issue', {
                book_code: book.book_code,
                register_number: selectedStudent.register_number
            });
            toast.success(`Book issued directly to ${selectedStudent.name}!`);
            onSuccess();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to issue book');
        } finally {
            setIsIssuing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 min-h-screen">
            <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-visible shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white rounded-t-[2rem]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <BookOpen size={20} />
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                    <h2 className="text-xl font-black">Direct Issue</h2>
                    <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                        <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{book.book_code}</span>
                        <span className="truncate">{book.title}</span>
                    </p>
                </div>

                <div className="p-8">
                    {!selectedStudent ? (
                        <>
                            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-widest">
                                Find Student
                            </label>
                            <div className="relative z-50">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search size={18} className="text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by Register Number or Name..."
                                    autoFocus
                                    className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-700 font-medium"
                                />
                                {isSearching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <Loader2 size={18} className="text-blue-500 animate-spin" />
                                    </div>
                                )}

                                {searchQuery.length > 0 && students.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                                        {students.map((student) => (
                                            <div
                                                key={student.id}
                                                onClick={() => setSelectedStudent(student)}
                                                className="px-4 py-3 hover:bg-blue-50 flex items-center justify-between cursor-pointer border-b border-slate-50 last:border-0 group transition-colors"
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800 group-hover:text-blue-700">{student.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{student.register_number}</p>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-100 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchQuery.length >= 2 && !isSearching && students.length === 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl p-4 text-center text-sm text-slate-500 font-medium z-50">
                                        No active students found matching "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 flex items-start gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center shrink-0">
                                    <User size={24} className="text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1 flex items-center gap-1">
                                        <CheckCircle size={12} /> Student Selected
                                    </p>
                                    <p className="font-bold text-slate-900 text-lg leading-tight">{selectedStudent.name}</p>
                                    <p className="text-sm font-mono text-emerald-800 mt-1">{selectedStudent.register_number}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                                >
                                    Change
                                </button>
                            </div>

                            <button
                                onClick={handleIssue}
                                disabled={isIssuing}
                                className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-60 shadow-lg shadow-blue-600/20"
                            >
                                {isIssuing ? (
                                    <><Loader2 size={20} className="animate-spin" /> Issuing Book...</>
                                ) : (
                                    <><BookOpen size={20} /> Confirm Issue To {selectedStudent.name.split(' ')[0]}</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IssueBookModal;
