import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertCircle, CheckCheck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../store/AuthContext';

const NotificationCenter: React.FC = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        // Only fetch when authenticated
        if (!user) return;

        try {
            const notifRes = await api.get('/notifications');
            setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
        } catch (err) {
            console.error('Failed to fetch notifications list:', err);
        }

        try {
            const countRes = await api.get('/notifications/unread-count');
            setUnreadCount(countRes.data.count || countRes.data.unread_count || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    };

    useEffect(() => {
        if (!user) return; // Don't poll when guest
        fetchNotifications();
        // Auto-refresh every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read_status: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark as read', err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(notifications.map(n => ({ ...n, read_status: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Failed to mark all as read', err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full ring-2 ring-white flex items-center justify-center animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                            Alert Center
                            {unreadCount > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest">{unreadCount} New</span>}
                        </h4>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <CheckCheck size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-5 flex gap-4 transition-colors hover:bg-slate-50/80 cursor-pointer relative group ${!notif.read_status ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => !notif.read_status && markAsRead(notif.id)}
                                    >
                                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${notif.type === 'fine' ? 'bg-red-50 text-red-600' :
                                            notif.type === 'reminder' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {notif.type === 'fine' ? <AlertCircle size={20} /> : <Clock size={20} />}
                                        </div>
                                        <div className="flex-1 space-y-1 pr-6">
                                            <p className={`text-sm font-black leading-tight ${!notif.read_status ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{notif.message}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1">{new Date(notif.created_at).toLocaleDateString()} &bull; {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        {!notif.read_status && (
                                            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                                    <Check size={12} className="text-blue-600" />
                                                </div>
                                            </div>
                                        )}
                                        {!notif.read_status && <div className="absolute top-5 right-4 w-2 h-2 bg-blue-600 rounded-full"></div>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center px-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                                    <Bell size={28} className="text-slate-200" />
                                </div>
                                <h5 className="text-slate-900 font-bold">All caught up!</h5>
                                <p className="text-slate-400 font-medium text-xs mt-1">You don't have any new notifications at the moment.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-50 text-center bg-slate-50/50">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-700 underline underline-offset-4"
                        >
                            Dismiss Panel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
