'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Eye, Filter } from 'lucide-react';

type Transaction = {
    id: string;
    ref_id: string;
    product_code: string;
    customer_no: string;
    amount: number;
    status: string;
    serial_number: string | null;
    notes: string | null;
    created_at: string;
    user: {
        full_name: string;
        phone_number: string;
    };
};

export default function PPOBTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('ppob_transactions')
                .select(`
                    *,
                    user:profiles!user_id(full_name, phone_number)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data as any || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            alert('Gagal mengambil data transaksi PPOB');
        } finally {
            setLoading(false);
        }
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(new Date(dateString));
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            'SUCCESS': 'bg-green-100 text-green-700',
            'PENDING': 'bg-yellow-100 text-yellow-700',
            'FAILED': 'bg-red-100 text-red-700'
        };
        const color = colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
        return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${color}`}>{status}</span>;
    };

    const filteredTransactions = transactions.filter(t => {
        const matchSearch = t.customer_no.includes(searchTerm) ||
            t.ref_id.includes(searchTerm) ||
            t.product_code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Transaksi PPOB</h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari No Pelanggan, Ref ID, Kode Produk..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="py-2 pl-3 pr-8 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="SUCCESS">Sukses</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Gagal</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Tanggal & Ref</th>
                                <th className="px-6 py-4 font-semibold">User / Pelanggan</th>
                                <th className="px-6 py-4 font-semibold">Produk / Tujuan</th>
                                <th className="px-6 py-4 font-semibold text-right">Nominal</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold">SN / Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Tidak ada transaksi ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{formatDate(t.created_at)}</div>
                                            <div className="text-xs text-slate-500 mt-1">Ref: {t.ref_id}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{t.user?.full_name || 'User Dihapus'}</div>
                                            <div className="text-xs text-slate-500 mt-1">{t.user?.phone_number || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{t.product_code}</div>
                                            <div className="text-sm text-slate-700 font-mono mt-1">{t.customer_no}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            {formatRupiah(t.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge status={t.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-slate-800 break-words max-w-[200px]">
                                                {t.serial_number || '-'}
                                            </div>
                                            {t.notes && <div className="text-xs text-red-500 mt-1 max-w-[200px]">{t.notes}</div>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
