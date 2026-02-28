import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import api from '../../services/api';
import {
    BarChart3,
    TrendingUp,
    Users,
    Receipt,
    RefreshCw,
    Download
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await api.get('/analytics');
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const mostBorrowedChart = {
        labels: data?.most_borrowed?.map((b: any) => b.title) || [],
        datasets: [{
            label: 'Borrow Count',
            data: data?.most_borrowed?.map((b: any) => b.borrow_count) || [],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
            borderRadius: 8,
        }]
    };

    const monthlyFinesChart = {
        labels: data?.monthly_fines?.map((f: any) => f.month) || [],
        datasets: [{
            label: 'Monthly Fines (₹)',
            data: data?.monthly_fines?.map((f: any) => f.total_fines) || [],
            borderColor: 'rgb(244, 63, 94)',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'rgb(244, 63, 94)',
        }]
    };

    const peakHoursChart = {
        labels: data?.peak_hours?.map((h: any) => `${h.hour}:00`) || [],
        datasets: [{
            label: 'Traffic',
            data: data?.peak_hours?.map((h: any) => h.count) || [],
            backgroundColor: 'rgba(139, 92, 246, 0.6)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 1,
            borderRadius: 4,
        }]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: false,
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        }
    };

    if (loading && !data) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <RefreshCw className="animate-spin text-blue-600" size={40} />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Intelligence & Analytics</h1>
                    <p className="text-slate-500 font-medium">Data-driven insights for library management.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchAnalytics} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200">
                        <Download size={18} />
                        Export Data
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Most Borrowed Books */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Most Borrowed Books</h3>
                    </div>
                    <div className="h-64">
                        <Bar data={mostBorrowedChart} options={chartOptions} />
                    </div>
                </div>

                {/* Monthly Fine Collection */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                            <Receipt size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Monthly Fine Collection</h3>
                    </div>
                    <div className="h-64">
                        <Line data={monthlyFinesChart} options={chartOptions} />
                    </div>
                </div>

                {/* Peak Hours Traffic */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                            <Users size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Peak Library Hours</h3>
                    </div>
                    <div className="h-64">
                        <Bar data={peakHoursChart} options={chartOptions} />
                    </div>
                </div>

                {/* Insight Summary */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <BarChart3 size={24} />
                        </div>
                        <h3 className="text-xl font-black">Quick Insights</h3>
                    </div>
                    <ul className="space-y-6">
                        <li className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-blue-300 rounded-full mt-2 shrink-0"></div>
                            <p className="font-medium">Traffic peaks usually occur between <span className="font-black">10:00 AM - 1:00 PM</span>. Consider increasing staff during these hours.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-rose-300 rounded-full mt-2 shrink-0"></div>
                            <p className="font-medium">Monthly fine collection has <span className="font-black">increased by 12%</span> compared to last month. Notification system is working.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-2 h-2 bg-emerald-300 rounded-full mt-2 shrink-0"></div>
                            <p className="font-medium">Top 5 books contribute to <span className="font-black">40% of total circulation</span>. Plan for more copies.</p>
                        </li>
                    </ul>
                </div>
            </div>
        </MainLayout>
    );
};

export default AnalyticsPage;
