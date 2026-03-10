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
    Loader2,
    X,
    Eye
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
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-white border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700">ID / Waktu</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Pelanggan</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Layanan</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Total Biaya</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-medium text-slate-800">#{order.id.split('-')[0]}</span>
                                            <p className="text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {order.customer?.full_name || 'NN'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {order.service?.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800">Rp {order.total_price.toLocaleString('id-ID')}</span>
                                            <span className="text-xs text-slate-400 block mt-0.5">{order.payment_method}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                                                title="Lihat Detail"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Detail Order */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Detail Pesanan</h3>
                                <p className="text-sm text-slate-500 font-mono mt-1">ID: {selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">

                            {/* Status & Price Row */}
                            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Status Penjemputan</p>
                                    <StatusBadge status={selectedOrder.status} />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 mb-1">Total Biaya ({selectedOrder.payment_method})</p>
                                    <p className="text-xl font-bold text-slate-800">Rp {selectedOrder.total_price.toLocaleString('id-ID')}</p>
                                </div>
                            </div>

                            {/* Routing / Lokasi */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                                    <Map className="w-4 h-4 mr-2 text-blue-500" /> Rute Perjalanan
                                </h4>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex gap-4">
                                    <div className="flex flex-col items-center mt-1">
                                        <div className="w-4 h-4 rounded-full border-4 border-blue-500 bg-white z-10"></div>
                                        <div className="w-0.5 h-full bg-slate-300 -my-1"></div>
                                        <div className="w-4 h-4 rounded-full bg-orange-500 z-10"></div>
                                    </div>
                                    <div className="flex-1 space-y-6 text-sm">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lokasi Penjemputan</p>
                                            <p className="text-slate-800 font-medium">{selectedOrder.pickup_address}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lokasi Tujuan</p>
                                            <p className="text-slate-800 font-medium">{selectedOrder.dropoff_address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actors Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Customer */}
                                <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pelanggan</p>
                                        <p className="font-bold text-slate-800">{selectedOrder.customer?.full_name}</p>
                                        <p className="text-sm text-slate-600 mt-0.5">{selectedOrder.customer?.phone_number || 'Tidak ada nomor Hp'}</p>
                                    </div>
                                </div>

                                {/* Driver */}
                                <div className="p-4 border border-slate-100 rounded-xl flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Car className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Driver</p>
                                        {selectedOrder.driver ? (
                                            <>
                                                <p className="font-bold text-slate-800">{selectedOrder.driver.full_name}</p>
                                                <p className="text-sm text-slate-600 mt-0.5 mb-1">{selectedOrder.driver.phone_number || '-'}</p>
                                                <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-semibold tracking-wider">
                                                    {selectedOrder.driver.vehicle_plate_number || 'TIDAK ADA PLAT'}
                                                </span>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col justify-center">
                                                <p className="text-sm italic text-slate-400">Sedang mencari driver...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setSelectedOrder(null)} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
