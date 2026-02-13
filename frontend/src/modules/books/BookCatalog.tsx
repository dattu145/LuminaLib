import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    Search,
    Book,
    Filter,
    ArrowRight,
    Layers,
    MapPin,
    Bookmark,
    Plus,
    X,
    XCircle,
    Loader2,
    BookOpen,
    Hash,
    Building2,
    Grid2X2
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const BookCatalog: React.FC = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [pagination, setPagination] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        isbn: '',
        book_code: '',
        category: '',
        publisher: '',
        total_copies: 1,
        rack_number: ''
    });

    const isStaff = user?.role === 'admin' || user?.role === 'librarian';

    const fetchBooks = async (page = 1) => {
        setLoading(true);
        try {
            const response = await api.get('/books', {
                params: {
                    page,
                    search: searchTerm,
                    category: selectedCategory
                }
            });
            setBooks(response.data.data);
            setPagination(response.data);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const statsRes = await api.get('/books/stats');
            setCategories(statsRes.data.category_summary.map((c: any) => c.category));
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/books', newBook);
            setIsModalOpen(false);
            setNewBook({
                title: '', author: '', isbn: '', book_code: '',
                category: '', publisher: '', total_copies: 1, rack_number: ''
            });
            fetchBooks(1);
            fetchCategories(); // Refresh categories after adding a new book
            alert('Book added successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to add book');
        } finally {
            setIsSaving(false);
        }
    };

    // Fetch categories once on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchBooks(1);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm, selectedCategory]);

    return (
        <MainLayout>
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Library Catalog</h1>
                    <p className="text-slate-500 font-medium mt-2">Discover and browse our extensive collection of books.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    {isStaff && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-black rounded-[1.25rem] shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            Add New Book
                        </button>
                    )}
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Title, author, or ISBN..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm focus:ring-4 ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-12 pr-8 py-4 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm focus:ring-4 ring-blue-500/10 outline-none transition-all appearance-none font-bold text-slate-700 min-w-[160px]"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Add Book Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">Add New Book</h3>
                                <p className="text-slate-500 font-medium mt-1">Fill in the details to expand the catalog.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleAddBook} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Book Title</label>
                                    <div className="relative">
                                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text" required
                                            value={newBook.title}
                                            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                            placeholder="The Great Gatsby"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Author Name</label>
                                    <input
                                        type="text" required
                                        value={newBook.author}
                                        onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                        placeholder="F. Scott Fitzgerald"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ISBN Number</label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={newBook.isbn}
                                            onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                            placeholder="978-3-16-148410-0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Book Internal Code</label>
                                    <input
                                        type="text" required
                                        value={newBook.book_code}
                                        onChange={(e) => setNewBook({ ...newBook, book_code: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                        placeholder="BK-2024-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                                    <div className="relative">
                                        <Grid2X2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text" required
                                            value={newBook.category}
                                            onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                            placeholder="Fiction, Science, etc."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Publisher</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={newBook.publisher}
                                            onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                            placeholder="Penguin Books"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Total Copies</label>
                                    <input
                                        type="number" required min="1"
                                        value={newBook.total_copies}
                                        onChange={(e) => setNewBook({ ...newBook, total_copies: parseInt(e.target.value) })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rack Number</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={newBook.rack_number}
                                            onChange={(e) => setNewBook({ ...newBook, rack_number: e.target.value })}
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                            placeholder="A-12"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Registering Book...' : 'Add to Collection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                        <Loader2 size={48} className="text-blue-600 animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse"></div>
                    </div>
                    <p className="text-slate-400 font-bold mt-6 tracking-widest uppercase text-xs">Accessing Database...</p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto overflow-y-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Book Info</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">ISBN / Code</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Location</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Copies</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {books.map((book) => (
                                        <tr key={book.id} className="hover:bg-slate-50/80 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-tight tracking-tight uppercase group-hover:text-blue-600 transition-colors">{book.title}</p>
                                                        <p className="text-xs text-slate-500 font-bold">{book.author}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-tight">
                                                    {book.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-slate-700">{book.isbn || 'N/A'}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{book.book_code}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <MapPin size={14} className="text-slate-300" />
                                                    <span className="text-xs font-black uppercase">Rack {book.rack_number || '--'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className={`text-sm font-black ${book.available_copies > 0 ? 'text-slate-900' : 'text-red-500'}`}>
                                                        {book.available_copies}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase"> / {book.total_copies} total</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${book.available_copies > 0
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-red-50 text-red-600 border border-red-100'
                                                    }`}>
                                                    {book.available_copies > 0 ? 'In Stock' : 'Issued'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {books.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Search size={40} className="text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Searching for "{searchTerm}"</h3>
                            <p className="text-slate-400 font-medium mt-2">No matching books found in our database.</p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}
                                className="mt-8 px-6 py-2 border-2 border-blue-600 text-blue-600 font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}

                    {pagination && pagination.total > pagination.per_page && (
                        <div className="mt-12 flex justify-center items-center gap-6">
                            <button
                                disabled={pagination.current_page === 1}
                                onClick={() => fetchBooks(pagination.current_page - 1)}
                                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ArrowRight className="rotate-180" size={20} />
                            </button>

                            <div className="flex items-center gap-2">
                                {[...Array(pagination.last_page)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => fetchBooks(i + 1)}
                                        className={`w-10 h-10 rounded-2xl font-black text-xs transition-all ${pagination.current_page === i + 1
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                                            : 'bg-white text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => fetchBooks(pagination.current_page + 1)}
                                className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </MainLayout>
    );
};

export default BookCatalog;
