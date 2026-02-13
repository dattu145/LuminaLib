import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    Shield,
    UserPlus,
    Settings,
    Download,
    UserX,
    UserCheck,
    Save,
    AlertCircle,
    Key
} from 'lucide-react';

const AdminManagement: React.FC = () => {
    const [staff, setStaff] = useState<any[]>([]);
    const [fineConfig, setFineConfig] = useState({
        fine_per_day: 0,
        max_fine_limit: 0,
        grace_days: 0
    });
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'staff' | 'settings'>('staff');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStaff, setNewStaff] = useState({
        name: '',
        email: '',
        register_number: '',
        password: '',
    });

    const fetchData = async () => {
        try {
            const [staffRes, configRes] = await Promise.all([
                api.get('/admin/staff'),
                api.get('/admin/config/fines')
            ]);
            setStaff(staffRes.data);
            if (configRes.data) setFineConfig(configRes.data);
        } catch (error) {
            console.error('Admin fetch error:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/admin/staff', newStaff);
            setIsModalOpen(false);
            setNewStaff({ name: '', email: '', register_number: '', password: '' });
            fetchData();
            alert('Staff created successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create staff');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (id: string) => {
        try {
            await api.post(`/admin/users/${id}/toggle`);
            fetchData();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const updateConfig = async () => {
        setIsSaving(true);
        try {
            await api.post('/admin/config/fines', fineConfig);
            alert('Configuration updated successfully!');
        } catch (error) {
            alert('Failed to update config');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export/users', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'library_users.csv');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            alert('Export failed');
        }
    };

    return (
        <MainLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">System Administration</h1>
                    <p className="text-slate-500 font-medium">Global controls, security, and institutional settings.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download size={18} />
                        Export Audit Log
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Menu */}
                <div className="lg:col-span-1 space-y-2">
                    <button
                        onClick={() => setActiveSection('staff')}
                        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeSection === 'staff' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Shield size={20} />
                        Staff Management
                    </button>
                    <button
                        onClick={() => setActiveSection('settings')}
                        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeSection === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Settings size={20} />
                        Global Settings
                    </button>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {activeSection === 'staff' ? (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-900">Librarians & Admins</h3>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-all text-sm"
                                >
                                    <UserPlus size={16} />
                                    Add New Staff
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                            <th className="px-8 py-4">Name</th>
                                            <th className="px-8 py-4">Role</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {staff.map((s) => (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                                                            {s.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{s.name}</p>
                                                            <p className="text-xs text-slate-500">{s.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {s.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {s.is_active ? (
                                                        <span className="text-emerald-500 flex items-center gap-1.5 text-xs font-bold">
                                                            <UserCheck size={14} /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500 flex items-center gap-1.5 text-xs font-bold">
                                                            <UserX size={14} /> Disabled
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <button
                                                        onClick={() => toggleStatus(s.id)}
                                                        className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${s.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                                    >
                                                        {s.is_active ? 'Disable' : 'Enable'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Key className="text-amber-500" />
                                Fine & Circulation Rules
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Fine per Day (₹)</label>
                                    <input
                                        type="number"
                                        value={fineConfig.fine_per_day}
                                        onChange={(e) => setFineConfig({ ...fineConfig, fine_per_day: parseFloat(e.target.value) })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">Amount charged for every 24 hours overdue.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Max. Fine Limit (₹)</label>
                                    <input
                                        type="number"
                                        value={fineConfig.max_fine_limit}
                                        onChange={(e) => setFineConfig({ ...fineConfig, max_fine_limit: parseFloat(e.target.value) })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">Ceiling limit to prevent infinite fine debt.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Grace Period (Days)</label>
                                    <input
                                        type="number"
                                        value={fineConfig.grace_days}
                                        onChange={(e) => setFineConfig({ ...fineConfig, grace_days: parseInt(e.target.value) })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium">Days allowed after due date before fines apply.</p>
                                </div>
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
                                    <AlertCircle className="text-blue-600 shrink-0" size={24} />
                                    <div className="text-xs text-blue-900 font-medium leading-relaxed">
                                        Fines are automatically calculated by the daily scheduler. Changing these rules will only affect future calculations.
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={updateConfig}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
                            >
                                <Save size={20} />
                                {isSaving ? 'Saving Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Staff Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Add Staff Member</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8">Creating a new Librarian account.</p>

                        <form onSubmit={handleAddStaff} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newStaff.name}
                                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                    placeholder="email@library.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Staff ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={newStaff.register_number}
                                        onChange={(e) => setNewStaff({ ...newStaff, register_number: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                        placeholder="LIB-000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newStaff.password}
                                        onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
};

export default AdminManagement;
