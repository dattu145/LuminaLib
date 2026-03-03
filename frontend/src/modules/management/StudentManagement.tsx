import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import MainLayout from '../../layouts/MainLayout';
import { UploadCloud, UserPlus, Info, CheckCircle, AlertTriangle, Users, Search, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import StudentProfileModal from './StudentProfileModal';

const StudentManagement = () => {
    const [activeTab, setActiveTab] = useState<'view' | 'single' | 'bulk'>('view');
    const [isLoading, setIsLoading] = useState(false);

    // View Tab State
    const [students, setStudents] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudentReg, setSelectedStudentReg] = useState<string | null>(null);

    // Single Add Form State
    const [formData, setFormData] = useState({
        name: '', email: '', register_number: '', phone: '', department: ''
    });

    // Bulk Result State
    const [bulkResult, setBulkResult] = useState<{ success: number; failed: number; errors: any[] } | null>(null);

    const fetchStudents = async (p = page) => {
        setIsFetching(true);
        try {
            const res = await axios.get(`http://localhost:8000/api/admin/students/list?page=${p}&limit=10&search=${searchQuery}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setStudents(res.data.data);
            setTotalPages(res.data.last_page || 1);
            setPage(p);
        } catch (error) {
            toast.error('Failed to fetch students');
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'view') {
            const delayDebounceFn = setTimeout(() => {
                fetchStudents(1);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery, activeTab]);

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post('http://localhost:8000/api/admin/students', formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            toast.success('Student added successfully!');
            setFormData({ name: '', email: '', register_number: '', phone: '', department: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add student');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setBulkResult(null);

        const fileExt = file.name.split('.').pop()?.toLowerCase();

        const processData = async (data: any[]) => {
            try {
                const response = await axios.post('http://localhost:8000/api/admin/students/bulk', {
                    students: data
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                });

                toast.success('Bulk upload processed!');
                setBulkResult(response.data);
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to process file');
            } finally {
                setIsLoading(false);
                e.target.value = ''; // Reset input
            }
        };

        if (fileExt === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => processData(results.data),
                error: (error) => {
                    toast.error(`Error parsing file: ${error.message}`);
                    setIsLoading(false);
                }
            });
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const workbook = XLSX.read(bstr, { type: 'binary' });
                    const wsname = workbook.SheetNames[0];
                    const ws = workbook.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    processData(data);
                } catch (err: any) {
                    toast.error(`Error parsing Excel file: ${err.message}`);
                    setIsLoading(false);
                }
            };
            reader.readAsBinaryString(file);
        } else {
            toast.error('Unsupported file format. Please upload CSV, XLS, or XLSX.');
            setIsLoading(false);
            e.target.value = '';
        }
    };

    return (
        <MainLayout>
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Management</h1>
                    <p className="text-slate-500 mt-1">Manage all students, view profiles, or add new batches.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-max overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('view')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'view' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><Users size={16} /> View Students</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'single' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><UserPlus size={16} /> Add Single Student</div>
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'bulk' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2"><UploadCloud size={16} /> Bulk Upload (CSV/Excel)</div>
                    </button>
                </div>

                {/* Tab Content: View Students */}
                {activeTab === 'view' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative max-w-md w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by name, register number or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                            {isFetching ? (
                                <div className="flex flex-col items-center justify-center p-20 text-blue-600">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <p className="font-medium text-slate-500">Loading students...</p>
                                </div>
                            ) : students.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[11px] font-black">
                                                <tr>
                                                    <th className="px-6 py-4">Register No.</th>
                                                    <th className="px-6 py-4">Student Info</th>
                                                    <th className="px-6 py-4">Department</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                    <th className="px-6 py-4 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-blue-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                                            {student.register_number}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-900">{student.name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{student.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                                            {student.department || '--'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${student.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                                {student.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => setSelectedStudentReg(student.register_number)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                                                            >
                                                                <Eye size={14} /> Profile
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                                            <p className="text-sm text-slate-500 font-medium">Page {page} of {totalPages}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={page === 1}
                                                    onClick={() => fetchStudents(page - 1)}
                                                    className="p-1.5 hover:bg-white border border-slate-200 rounded-lg disabled:opacity-50 transition-colors"
                                                >
                                                    <ChevronLeft size={18} />
                                                </button>
                                                <button
                                                    disabled={page === totalPages}
                                                    onClick={() => fetchStudents(page + 1)}
                                                    className="p-1.5 hover:bg-white border border-slate-200 rounded-lg disabled:opacity-50 transition-colors"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <Users size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-lg font-bold text-slate-800">No students found</p>
                                    <p className="text-slate-500 mt-1 max-w-sm">Try tweaking your search query or add a new student using the tabs above.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Content: Single Add */}
                {activeTab === 'single' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm animate-in fade-in">
                        <div className="flex items-start gap-3 justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Add New Student</h3>
                                <p className="text-sm text-slate-500 mt-1">Their account will be secured with a random hidden password. They must reset it via email later to login.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSingleSubmit} className="mt-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                                    <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Register Number *</label>
                                    <input required type="text" value={formData.register_number} onChange={e => setFormData({ ...formData, register_number: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. 621522243..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Optional" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                                    <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="e.g. Computer Science" />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={isLoading}
                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {isLoading && <Loader2 size={16} className="animate-spin" />} {isLoading ? 'Creating...' : 'Create Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab Content: Bulk Upload */}
                {activeTab === 'bulk' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
                            <Info size={24} className="text-blue-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-blue-900">CSV / Excel Format Instructions</h4>
                                <p className="text-sm text-blue-700 mt-1 mb-3">Your file must include a header row with the exact column names below. Extra columns will be ignored. You can upload <span className="font-bold">.csv</span>, <span className="font-bold">.xls</span>, or <span className="font-bold">.xlsx</span> files.</p>
                                <div className="flex flex-wrap gap-2 text-xs font-mono">
                                    <span className="bg-white/60 px-2 py-1 rounded text-blue-800 border border-blue-200">name*</span>
                                    <span className="bg-white/60 px-2 py-1 rounded text-blue-800 border border-blue-200">email*</span>
                                    <span className="bg-white/60 px-2 py-1 rounded text-blue-800 border border-blue-200">register_number*</span>
                                    <span className="bg-white/60 px-2 py-1 rounded text-slate-600 border border-slate-200 border-dashed">phone</span>
                                    <span className="bg-white/60 px-2 py-1 rounded text-slate-600 border border-slate-200 border-dashed">department</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                onChange={handleFileUpload}
                                disabled={isLoading}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                            />
                            <UploadCloud size={48} className="mx-auto text-slate-400 mb-4" />
                            <h3 className="text-lg font-bold text-slate-800">Click or drag file to upload</h3>
                            <p className="text-sm text-slate-500 mt-2">Maximum file size: 5MB</p>

                            {isLoading && (
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-full">
                                    <Loader2 size={16} className="animate-spin" /> Processing Upload...
                                </div>
                            )}
                        </div>

                        {/* Results Panel */}
                        {bulkResult && (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                                <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                    <h3 className="font-bold text-slate-800 text-lg">Upload Results</h3>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-bold border border-green-100">
                                            <CheckCircle size={16} /> {bulkResult.success} Created
                                        </div>
                                        {bulkResult.failed > 0 && (
                                            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold border border-red-100">
                                                <AlertTriangle size={16} /> {bulkResult.failed} Failed
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {bulkResult.errors && bulkResult.errors.length > 0 && (
                                    <div className="p-0 overflow-x-auto">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3">Row Data</th>
                                                    <th className="px-6 py-3">Error Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                                {bulkResult.errors.map((err, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                        <td className="px-6 py-3">
                                                            <div className="font-mono text-xs max-w-sm truncate" title={JSON.stringify(err.email || err.row)}>
                                                                {err.email || JSON.stringify(err.row)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-red-600 font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <AlertTriangle size={14} /> {err.error}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Modal */}
                {selectedStudentReg && (
                    <StudentProfileModal
                        registerNumber={selectedStudentReg}
                        onClose={() => setSelectedStudentReg(null)}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default StudentManagement;
