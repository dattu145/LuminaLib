import React, { useState, useRef } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    BookOpen, Search, User, Phone, Hash, Calendar,
    CheckCircle, AlertCircle, ArrowRight, RotateCcw, Clock,
    BookMarked, AlertTriangle, RefreshCw, History, X,
    Building2, Tag, Copy, Layers, Star
} from 'lucide-react';

// ────────────────────────────────────── Types
interface StudentProfile {
    id: string; name: string; email: string; register_number: string;
    phone: string | null; department: string | null; photo_url: string | null;
    is_active: boolean;
}
interface Book {
    id: string; title: string; book_code: string; author: string;
    category: string; isbn?: string; available_copies: number;
    total_copies?: number; fine_per_day?: number; publisher?: string;
    year?: number;
}
interface Issue {
    id: string; issued_date: string; due_date: string;
    returned_date: string | null; fine_amount: number;
    overdue_days?: number; estimated_fine?: number;
    book: Book;
}
interface ProfileData {
    student: StudentProfile;
    active_issues: Issue[];
    history: Issue[];
    total_outstanding_fine: number;
    can_borrow: boolean;
}
type ActiveTab = 'active' | 'issue' | 'history';

// ────────────────────────────────────── Helpers
const isOverdue = (due: string) => new Date(due) < new Date();
const daysLeft = (due: string) => Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ────────────────────────────────────── Sub-components
const Avatar = ({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) => {
    const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    return (
        <div className={`rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-md
            ${size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-9 h-9 text-sm'}`}>
            {initials}
        </div>
    );
};

const Toast = ({ toast, onClose }: { toast: { text: string; type: 'success' | 'error' }; onClose: () => void }) => (
    <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold max-w-xs
        ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
        {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span className="flex-1">{toast.text}</span>
        <button onClick={onClose}><X size={16} /></button>
    </div>
);

const BookPreviewCard = ({ book, onDismiss }: { book: Book; onDismiss: () => void }) => (
    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl relative">
        <button onClick={onDismiss} className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600"><X size={16} /></button>
        <div className="flex gap-3">
            <div className="w-12 h-16 bg-indigo-200 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen size={22} className="text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{book.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-black bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                        <Tag size={9} /> {book.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-black bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                        <Copy size={9} /> {book.book_code}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border
                        ${book.available_copies > 0
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'}`}>
                        <Layers size={9} /> {book.available_copies} copies available
                    </span>
                    {book.fine_per_day != null && (
                        <span className="flex items-center gap-1 text-[10px] font-black bg-white border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">
                            <Star size={9} /> ₹{book.fine_per_day}/day fine
                        </span>
                    )}
                </div>
            </div>
        </div>
    </div>
);

// ────────────────────────────────────── Main Component
const BookCirculation: React.FC = () => {
    const [regInput, setRegInput] = useState('');
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('active');
    const [bookCode, setBookCode] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [previewBook, setPreviewBook] = useState<Book | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const bookCodeRef = useRef<HTMLInputElement>(null);

    const showToast = (text: string, type: 'success' | 'error') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleLookup = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!regInput.trim()) return;
        setLookupLoading(true);
        setLookupError(null);
        setProfileData(null);
        setActiveTab('active');
        setPreviewBook(null);
        try {
            const res = await api.get(`/circulation/student/${regInput.trim()}`);
            setProfileData(res.data);
        } catch (err: any) {
            setLookupError(err.response?.data?.message || 'Student not found. Check the register number.');
        } finally {
            setLookupLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (!profileData) return;
        try {
            const res = await api.get(`/circulation/student/${profileData.student.register_number}`);
            setProfileData(res.data);
        } catch { }
    };

    const handleBookCodeBlur = async () => {
        const code = bookCode.trim().toUpperCase();
        if (!code) { setPreviewBook(null); setPreviewError(null); return; }
        setPreviewLoading(true);
        setPreviewBook(null);
        setPreviewError(null);
        try {
            const res = await api.get(`/books/lookup/${code}`);
            setPreviewBook(res.data);
        } catch {
            setPreviewError('Book not found with that code. Please check the accession number.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleReturnBook = async (issueId: string, bookTitle: string) => {
        if (!window.confirm(`Confirm return of "${bookTitle}"?`)) return;
        setActionLoading(issueId);
        try {
            const res = await api.post('/books/return-by-id', { issue_id: issueId });
            const fine = res.data.fine_amount;
            showToast(
                fine > 0
                    ? `Returned! Late fine: ₹${fine} for ${res.data.overdue_days} overdue day(s).`
                    : `"${bookTitle}" returned — no fine!`,
                fine > 0 ? 'error' : 'success'
            );
            await refreshProfile();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Return failed.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleIssueBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profileData || !previewBook) return;
        if (previewBook.available_copies <= 0) {
            showToast('No copies of this book are available.', 'error');
            return;
        }
        setActionLoading('issue');
        try {
            const payload: any = {
                register_number: profileData.student.register_number,
                book_code: bookCode.trim().toUpperCase(),
            };
            if (dueDate) payload.due_date = new Date(dueDate).toISOString();
            await api.post('/books/issue', payload);
            showToast(`"${previewBook.title}" issued successfully!`, 'success');
            setBookCode('');
            setDueDate('');
            setPreviewBook(null);
            setActiveTab('active');
            await refreshProfile();
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Failed to issue book.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const defaultDueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    return (
        <MainLayout>
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900">Book Circulation</h1>
                <p className="text-slate-500 font-medium mt-1">Enter a register number to view and manage a student's library account.</p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleLookup} className="flex gap-3 mb-6">
                <div className="relative flex-1 max-w-lg">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={regInput}
                        onChange={e => setRegInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLookup()}
                        placeholder="Student register number (e.g. 621522243031)"
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800 font-medium placeholder:text-slate-400 transition-all"
                    />
                </div>
                <button
                    type="submit"
                    disabled={lookupLoading || !regInput.trim()}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                    {lookupLoading ? <RefreshCw size={17} className="animate-spin" /> : <Search size={17} />}
                    {lookupLoading ? 'Searching…' : 'Look Up'}
                </button>
            </form>

            {/* Lookup Error */}
            {lookupError && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-medium text-sm">
                    <AlertCircle size={18} />
                    {lookupError}
                </div>
            )}

            {/* Empty State */}
            {!profileData && !lookupError && !lookupLoading && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-14 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-blue-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Search for a Student</h3>
                    <p className="text-slate-400 font-medium text-sm">Their profile, active books, fines, and full history will appear here.</p>
                </div>
            )}

            {/* Profile + Actions */}
            {profileData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ══ LEFT ══ Student Profile */}
                    <div className="space-y-4">

                        {/* Card */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center gap-4 mb-5">
                                <Avatar name={profileData.student.name} />
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-black text-slate-900 truncate">{profileData.student.name}</h2>
                                    <p className="text-sm text-slate-500 font-mono">{profileData.student.register_number}</p>
                                    <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                        ${profileData.student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {profileData.student.is_active ? '● Active' : '● Suspended'}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2.5 text-sm">
                                {profileData.student.department && (
                                    <div className="flex items-center gap-2.5 text-slate-600">
                                        <Building2 size={14} className="text-slate-400 shrink-0" />
                                        <span className="font-medium">{profileData.student.department}</span>
                                    </div>
                                )}
                                {profileData.student.phone && (
                                    <div className="flex items-center gap-2.5 text-slate-600">
                                        <Phone size={14} className="text-slate-400 shrink-0" />
                                        <span className="font-medium">{profileData.student.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-start gap-2.5 text-slate-500 break-all">
                                    <User size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span className="font-medium text-xs">{profileData.student.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                                <p className="text-2xl font-black text-blue-600">{profileData.active_issues.length}<span className="text-base text-slate-400">/3</span></p>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Books Held</p>
                            </div>
                            <div className={`rounded-2xl border shadow-sm p-4 text-center ${profileData.total_outstanding_fine > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                                <p className={`text-2xl font-black ${profileData.total_outstanding_fine > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                    ₹{profileData.total_outstanding_fine.toFixed(0)}
                                </p>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Outstanding Fine</p>
                            </div>
                        </div>

                        {/* Eligibility Badge */}
                        <div className={`rounded-2xl border px-4 py-3 flex items-center gap-3 text-sm font-semibold
                            ${profileData.can_borrow
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                            {profileData.can_borrow
                                ? <><CheckCircle size={18} /> Eligible to borrow</>
                                : <><AlertTriangle size={18} />
                                    {profileData.active_issues.length >= 3 ? 'Borrowing limit (3) reached' : `Clear ₹${profileData.total_outstanding_fine.toFixed(2)} fine first`}
                                </>}
                        </div>

                        {/* Quick actions row */}
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => { setActiveTab('issue'); setTimeout(() => bookCodeRef.current?.focus(), 100); }}
                                className="py-2.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all">
                                + Issue Book
                            </button>
                            <button onClick={() => setActiveTab('history')}
                                className="py-2.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
                                View History
                            </button>
                        </div>
                    </div>

                    {/* ══ RIGHT ══ Tabbed Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">

                            {/* Tab Nav */}
                            <div className="flex border-b border-slate-100 bg-slate-50/50">
                                {([
                                    { key: 'active' as ActiveTab, label: 'Active Books', icon: BookMarked, badge: profileData.active_issues.length },
                                    { key: 'issue' as ActiveTab, label: 'Issue Book', icon: ArrowRight, badge: null },
                                    { key: 'history' as ActiveTab, label: 'History', icon: History, badge: profileData.history.length },
                                ]).map(tab => (
                                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-all
                                            ${activeTab === tab.key ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                                        <tab.icon size={15} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        {tab.badge !== null && tab.badge > 0 && (
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                                <div className="flex-1" />
                                <button onClick={refreshProfile} title="Refresh" className="px-4 text-slate-400 hover:text-slate-700 transition-colors">
                                    <RefreshCw size={15} />
                                </button>
                            </div>

                            {/* ─── Tab: Active Books ─── */}
                            {activeTab === 'active' && (
                                <div>
                                    {profileData.active_issues.length === 0 ? (
                                        <div className="py-16 text-center">
                                            <BookOpen size={36} className="text-slate-200 mx-auto mb-3" />
                                            <p className="text-slate-400 font-medium text-sm">No books currently checked out.</p>
                                            <button onClick={() => setActiveTab('issue')}
                                                className="mt-4 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
                                                Issue a Book →
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {profileData.active_issues.map(issue => {
                                                const overdue = isOverdue(issue.due_date);
                                                const left = daysLeft(issue.due_date);
                                                return (
                                                    <div key={issue.id} className="px-6 py-5 flex items-start gap-4 hover:bg-slate-50/40 transition-colors group">
                                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                                                            ${overdue ? 'bg-red-100' : 'bg-blue-50'}`}>
                                                            <BookOpen size={19} className={overdue ? 'text-red-500' : 'text-blue-600'} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">{issue.book.title}</p>
                                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{issue.book.author} <span className="text-slate-300">·</span> <span className="font-mono">{issue.book.book_code}</span></p>
                                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                                                    <Calendar size={11} />
                                                                    Issued: {issue.issued_date ? formatDate(issue.issued_date) : '—'}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                                                    <Calendar size={11} />
                                                                    Due: {formatDate(issue.due_date)}
                                                                </div>
                                                                {overdue ? (
                                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black">
                                                                        <AlertCircle size={9} /> {Math.abs(left)}d overdue · Est. ₹{issue.estimated_fine}
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">
                                                                        <Clock size={9} /> {left}d remaining
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleReturnBook(issue.id, issue.book.title)}
                                                            disabled={actionLoading === issue.id}
                                                            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-all active:scale-95 disabled:opacity-50 mt-1">
                                                            {actionLoading === issue.id ? <RefreshCw size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                                                            Return
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── Tab: Issue Book ─── */}
                            {activeTab === 'issue' && (
                                <div className="p-7">
                                    {!profileData.can_borrow && (
                                        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-sm">
                                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold">Cannot Issue Book</p>
                                                <p className="mt-0.5 text-amber-700">
                                                    {profileData.active_issues.length >= 3
                                                        ? 'Student already holds 3 books (maximum limit).'
                                                        : `Outstanding fine of ₹${profileData.total_outstanding_fine.toFixed(2)} must be cleared first.`}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleIssueBook} className="space-y-5">
                                        {/* Issuing to */}
                                        <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                                            <Avatar name={profileData.student.name} size="sm" />
                                            <div>
                                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-wider">Issuing To</p>
                                                <p className="font-bold text-slate-800 text-sm">{profileData.student.name} · <span className="font-mono">{profileData.student.register_number}</span></p>
                                            </div>
                                        </div>

                                        {/* Book Code + Preview */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Book Code (Accession No.)</label>
                                            <div className="relative">
                                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                {previewLoading && <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={16} />}
                                                <input
                                                    ref={bookCodeRef}
                                                    type="text"
                                                    required
                                                    value={bookCode}
                                                    onChange={e => { setBookCode(e.target.value); setPreviewBook(null); setPreviewError(null); }}
                                                    onBlur={handleBookCodeBlur}
                                                    placeholder="e.g. BK-001"
                                                    className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium uppercase tracking-wide"
                                                />
                                            </div>
                                            <p className="text-[11px] text-slate-400 ml-1">Tab out of the field to preview book details.</p>

                                            {/* Preview error */}
                                            {previewError && (
                                                <div className="flex items-center gap-2 text-xs text-red-600 font-medium mt-1">
                                                    <AlertCircle size={14} /> {previewError}
                                                </div>
                                            )}

                                            {/* Book Preview Card */}
                                            {previewBook && <BookPreviewCard book={previewBook} onDismiss={() => { setPreviewBook(null); setBookCode(''); }} />}
                                        </div>

                                        {/* Due Date */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
                                                Due Date <span className="text-slate-300 font-normal normal-case">(leave blank = {formatDate(defaultDueDate)})</span>
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="date"
                                                    value={dueDate}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    onChange={e => setDueDate(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!profileData.can_borrow || actionLoading === 'issue' || !previewBook || previewBook.available_copies <= 0}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:shadow-none transition-all active:scale-95">
                                            {actionLoading === 'issue'
                                                ? <><RefreshCw size={18} className="animate-spin" /> Processing…</>
                                                : (!previewBook ? '← Preview book first' : previewBook.available_copies <= 0 ? 'No copies available' : <><BookOpen size={18} /> Issue Book to {profileData.student.name.split(' ')[0]} →</>)}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ─── Tab: History ─── */}
                            {activeTab === 'history' && (
                                <div>
                                    {profileData.history.length === 0 ? (
                                        <div className="py-16 text-center">
                                            <History size={36} className="text-slate-200 mx-auto mb-3" />
                                            <p className="text-slate-400 font-medium text-sm">No transaction history yet.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            <div className="px-6 py-3 bg-slate-50/70 flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                                                <History size={12} /> Full Transaction Log (last {profileData.history.length})
                                            </div>
                                            {profileData.history.map(issue => {
                                                const endDate = issue.returned_date ? new Date(issue.returned_date) : new Date();
                                                const startDate = new Date(issue.issued_date);
                                                const daysKept = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000));
                                                const isReturned = !!issue.returned_date;

                                                return (
                                                    <div key={issue.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                                                            ${isReturned ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                                                            {isReturned ? <CheckCircle size={18} /> : <BookOpen size={18} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-800 truncate">{issue.book.title}</p>
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase
                                                                    ${isReturned ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                                                                    {isReturned ? 'Returned' : 'Currently Active'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5">{issue.book.author} · <span className="font-mono">{issue.book.book_code}</span></p>
                                                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                                                                <span className="text-slate-500">Issued: <b>{formatDate(issue.issued_date)}</b></span>
                                                                {isReturned && (
                                                                    <span className="text-slate-500">Returned: <b>{formatDate(issue.returned_date!)}</b></span>
                                                                )}
                                                                <span className="text-slate-400">({daysKept} days {isReturned ? 'kept' : 'so far'})</span>
                                                                {!isReturned && (
                                                                    <span className="text-slate-400">· Due: {formatDate(issue.due_date)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 space-y-1">
                                                            {isReturned ? (
                                                                issue.fine_amount > 0 ? (
                                                                    <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                                        Fine: ₹{issue.fine_amount}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-600">
                                                                        No fine
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200 text-blue-500">
                                                                    Ongoing...
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default BookCirculation;
