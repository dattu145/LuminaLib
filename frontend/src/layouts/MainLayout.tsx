import React from 'react';
import { useAuth } from '../store/AuthContext';
import {
    LogOut,
    Book,
    LayoutDashboard,
    History,
    BookMarked,
    Settings,
    Receipt,
    Search,
    BarChart3,
    Menu,
    X
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationCenter from '../modules/notifications/NotificationCenter';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
        { label: 'Books Catalog', path: '/books', icon: <BookMarked size={20} /> },
        { label: 'Library Presence', path: '/sessions', icon: <History size={20} />, role: ['librarian', 'admin'] },
        { label: 'Circulation', path: '/issues', icon: <Book size={20} />, role: ['librarian', 'admin'] },
        { label: 'Fine Management', path: '/fines', icon: <Receipt size={20} />, role: ['librarian', 'admin'] },
        { label: 'Intelligence', path: '/analytics', icon: <BarChart3 size={20} />, role: ['librarian', 'admin'] },
        { label: 'My Loans', path: '/my-loans', icon: <BookMarked size={20} />, role: ['student'] },
        { label: 'My Sessions', path: '/student-sessions', icon: <History size={20} />, role: ['student'] },
        { label: 'Management', path: '/admin', icon: <Settings size={20} />, role: ['admin'] },
    ];

    const filteredNavItems = navItems.filter(item => !item.role || (user && item.role.includes(user.role)));

    return (
        <div className="min-h-screen flex bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 bg-slate-900 text-white flex-col h-screen fixed left-0 top-0 z-20 shadow-2xl">
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Book className="text-white" size={24} />
                    </div>
                    <span className="text-xl font-black tracking-tight">LuminaLib</span>
                </div>

                <nav className="flex-1 px-6 py-4 space-y-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <div className={`${location.pathname === item.path ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`}>
                                {item.icon}
                            </div>
                            <span className="font-semibold">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-6 px-2">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-xl">
                            {user?.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate leading-tight">{user?.name}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mt-1">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all font-bold group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Layout Area */}
            <div className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden">
                {/* Top Bar */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-slate-600 bg-slate-100 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 focus-within:ring-2 ring-blue-500/20 ring-offset-0 transition-all">
                            <Search className="text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search catalog, isbn, or author..."
                                className="bg-transparent border-none outline-none text-sm w-80 text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                        <div className="flex items-center gap-4 pl-2 cursor-pointer group">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 leading-none">{user?.name.split(' ')[0]}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">ID: {user?.register_number}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold group-hover:scale-110 transition-transform">
                                {user?.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                    <div className="max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <div
                    className={`absolute right-0 top-0 w-72 bg-slate-900 h-full p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="absolute top-8 left-[-3.5rem] w-10 h-10 bg-white rounded-full text-slate-900 shadow-2xl flex items-center justify-center active:scale-90 transition-transform"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Book className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-black text-white tracking-tight">LuminaLib</span>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                        {filteredNavItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800 font-semibold'
                                    }`}
                            >
                                <div className={`${location.pathname === item.path ? 'text-white' : 'group-hover:text-blue-400'} transition-colors`}>
                                    {item.icon}
                                </div>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="pt-6 border-t border-slate-800 mt-6 pb-2">
                        <div className="flex items-center gap-4 mb-6 px-2">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-xl">
                                {user?.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate leading-tight">{user?.name}</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mt-1">ID: {user?.register_number}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all font-bold group"
                        >
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
