'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Car,
    Store,
    TrendingUp,
    ShoppingBag,
    Activity,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    users: {
        total: number;
        customers: number;
        drivers: number;
        merchants: number;
        admin: number;
    };
    orders: {
        active: number;
        completed: number;
    };
    financials: {
        totalRevenue: number;
    };
    recentActivity: any[];
}

export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            const result = await res.json();
            if (res.ok && result.success) {
                setStats(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 flex items-center gap-3">
                <AlertCircle className="w-6 h-6" />
                <div>
                    <h3 className="font-bold">Gagal Memuat Data</h3>
                    <p className="text-sm">Terjadi kesalahan saat mengambil statistik server.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Ringkasan Operasional</h1>
                <p className="text-slate-500 mt-1">Pantau seluruh aktivitas aplikasi Ojek Online Anda secara real-time.</p>
            </div>

            {/* Top Cards (Revenue & Primary Orders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 font-medium mb-1">Total Pendapatan (Admin Fee)</p>
                            <h3 className="text-3xl font-bold">Rp {stats.financials.totalRevenue.toLocaleString('id-ID')}</h3>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-6 flex items-center text-sm text-blue-100">
                        <Activity className="w-4 h-4 mr-1.5" />
                        <span>Diupdate secara real-time dari sistem deposit</span>
                    </div>
                </div>

                {/* Active Orders */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 bg-orange-50 text-orange-500 rounded-full p-8 transition-transform group-hover:scale-110">
                        <ShoppingBag className="w-12 h-12 opacity-50" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                            <span className="font-medium">Pesanan Aktif (Berjalan)</span>
                        </div>
                        <h3 className="text-4xl font-bold text-slate-800">{stats.orders.active}</h3>
                        <Link href="/dashboard/orders" className="mt-4 flex items-center text-sm font-medium text-orange-600 hover:text-orange-700 w-fit">
                            Pantau Map <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                </div>

                {/* Completed Orders */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 bg-emerald-50 text-emerald-500 rounded-full p-8 transition-transform group-hover:scale-110">
                        <CheckCircle className="w-12 h-12 opacity-50" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="font-medium">Order Selesai (Sukses)</span>
                        </div>
                        <h3 className="text-4xl font-bold text-slate-800">{stats.orders.completed}</h3>
                        <Link href="/dashboard/orders" className="mt-4 flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 w-fit">
                            Lihat Riwayat <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Second Row: User Demographics & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Users Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm col-span-1 p-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-slate-400" />
                        Sebaran Pengguna ({stats.users.total})
                    </h3>

                    <div className="space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Pelanggan</p>
                                    <p className="text-xs text-slate-500">Aplikasi Konsumen</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-800">{stats.users.customers}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Car className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Mitra Driver</p>
                                    <p className="text-xs text-slate-500">Ojek & Kurir Aktif</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-800">{stats.users.drivers}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Store className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Merchant Food</p>
                                    <p className="text-xs text-slate-500">Toko / Resto Makanan</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-800">{stats.users.merchants}</span>
                        </div>
                    </div>

                    <Link href="/dashboard/users" className="block w-full text-center py-3 mt-8 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-xl transition-colors">
                        Kelola Pengguna
                    </Link>
                </div>

                {/* Recent Activity List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center">
                            <Clock className="w-5 h-5 mr-2 text-slate-400" />
                            Aktivitas Order Terbaru
                        </h3>
                        <Link href="/dashboard/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                            Lihat Semua
                        </Link>
                    </div>

                    {stats.recentActivity.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                            <ShoppingBag className="w-12 h-12 mb-3 text-slate-200" />
                            <p className="text-sm">Belum ada transaksi terekam di sistem.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${activity.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                activity.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                                                    'bg-orange-50 text-orange-500'
                                            }`}>
                                            <ShoppingBag className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{activity.service?.name || 'Layanan'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Pemesan: {activity.customer?.full_name || 'Tidak diketahui'}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-slate-800 text-sm">Rp {Number(activity.total_price).toLocaleString('id-ID')}</p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${activity.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                                activity.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                            }`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
