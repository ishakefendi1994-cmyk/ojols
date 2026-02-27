'use client';

import { useState, useEffect } from 'react';
import {
    Map,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Navigation,
    User,
    Car,
    FileText,
    Loader2
} from 'lucide-react';

interface Profile {
    full_name: string;
    phone_number?: string;
    vehicle_plate_number?: string;
}

interface Service {
    name: string;
    base_price: number;
}

interface OrderItem {
    id: string;
    customer_id: string;
    driver_id: string | null;
    service_id: string;
    pickup_address: string;
    dropoff_address: string;
    total_price: number;
    payment_method: string;
    status: string;
    created_at: string;
    customer: Profile;
    driver: Profile | null;
    service: Service;
}

export default function OrdersMonitoringPage() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
        // Option: In a real app we can use Supabase Realtime subscriptions here 
        // to listen for INSERT/UPDATE on 'orders' table to auto-refresh the DB.
        const intervalId = setInterval(fetchOrders, 15000); // 15 sec auto-refresh for MVP

        return () => clearInterval(intervalId);
    }, [filterStatus]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`/api/orders?status=${filterStatus}`);
            const result = await res.json();

            if (res.ok && result.success) {
                setOrders(result.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'SEARCHING_DRIVER':
                return <span className="inline-flex items-center px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-semibold animate-pulse"><Search className="w-3 h-3 mr-1" /> Mencari Driver</span>;
            case 'ACCEPTED':
            case 'ON_THE_WAY_TO_PICKUP':
            case 'ARRIVED_AT_PICKUP':
            case 'ON_THE_WAY_TO_DROP':
                return <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold"><Navigation className="w-3 h-3 mr-1" /> On The Way</span>;
            case 'COMPLETED':
                return <span className="inline-flex items-center px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-semibold"><CheckCircle className="w-3 h-3 mr-1" /> Selesai</span>;
            case 'CANCELLED':
                return <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold"><XCircle className="w-3 h-3 mr-1" /> Dibatalkan</span>;
            default:
                return <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold"><AlertCircle className="w-3 h-3 mr-1" /> Unknown</span>;
        }
    };

    const filteredOrders = orders.filter(o =>
        o.customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.driver && o.driver.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-10rem)] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Map className="w-6 h-6 text-blue-600" />
                        Monitoring Pesanan (Live)
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Pantau seluruh order masuk secara realtime dari seluruh pengguna.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari ID, Nama Pelanggan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filter Status */}
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setLoading(true);
                            setFilterStatus(e.target.value);
                        }}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-slate-50 font-medium"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="SEARCHING_DRIVER">Mencari Driver</option>
                        <option value="COMPLETED">Selesai (Success)</option>
                        <option value="CANCELLED">Dibatalkan</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="p-0 overflow-y-auto flex-1 bg-slate-50">
                {loading && orders.length === 0 ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                        <FileText className="w-12 h-12 mb-3 text-slate-300" />
                        <p>Tidak ada order yang ditemukan.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="p-4 sm:p-6 bg-white hover:bg-blue-50/30 transition-colors flex flex-col xl:flex-row gap-6">

                                {/* Info 1: ID & Status */}
                                <div className="xl:w-1/4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <StatusBadge status={order.status} />
                                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                            #{order.id.split('-')[0]}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <h4 className="font-bold text-slate-800">{order.service?.name}</h4>
                                        <p className="text-xs text-slate-500 flex items-center mt-1">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(order.created_at).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="mt-2">
                                        <span className={`inline-block px-2 py-1 rounded border text-xs font-bold w-fit ${order.payment_method === 'WALLET' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-green-50 text-green-700 border-green-200'
                                            }`}>
                                            🪙 Rp {order.total_price.toLocaleString('id-ID')} ({order.payment_method})
                                        </span>
                                    </div>
                                </div>

                                {/* Info 2: Routing / Lokasi */}
                                <div className="xl:w-2/4 bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center mt-1">
                                            <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white z-10"></div>
                                            <div className="w-0.5 h-full bg-slate-300 -my-1"></div>
                                            <div className="w-3 h-3 rounded-full bg-orange-500 z-10"></div>
                                        </div>
                                        <div className="flex-1 space-y-4 text-sm">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 mb-0.5">Penjemputan (Origin)</p>
                                                <p className="text-slate-800 line-clamp-2 leading-snug">{order.pickup_address}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-500 mb-0.5">Tujuan (Destination)</p>
                                                <p className="text-slate-800 line-clamp-2 leading-snug">{order.dropoff_address}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info 3: Aktor (Pelanggan & Driver) */}
                                <div className="xl:w-1/4 flex flex-col gap-3 justify-center border-l-0 xl:border-l border-slate-100 xl:pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-500 mb-0.5">Pemesan:</p>
                                            <p className="text-sm font-semibold text-slate-800 truncate">{order.customer?.full_name}</p>
                                            <p className="text-xs text-slate-500">{order.customer?.phone_number || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                            <Car className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-slate-500 mb-0.5">Driver:</p>
                                            {order.driver ? (
                                                <>
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{order.driver.full_name}</p>
                                                    <p className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded inline-block mt-0.5">{order.driver.vehicle_plate_number || '-'}</p>
                                                </>
                                            ) : (
                                                <p className="text-sm italic text-slate-400">Belum ada driver</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
