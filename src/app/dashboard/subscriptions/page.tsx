'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Archive, ArchiveRestore, X, Trash2 } from 'lucide-react';

interface SubscriptionPlan {
    id: string;
    name: string;
    duration_days: number;
    price: number;
    is_active: boolean;
    vehicle_type: string | null;
    created_at: string;
}

interface DriverSubscription {
    id: string;
    driver_id: string;
    plan_id: string;
    price_paid: number;
    start_date: string;
    end_date: string;
    profiles: {
        full_name: string;
        phone_number: string;
    };
    subscription_plans: {
        name: string;
    };
}

export default function SubscriptionsPage() {
    const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [history, setHistory] = useState<DriverSubscription[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [formData, setFormData] = useState({ name: '', duration_days: 1, price: 0, vehicleType: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'plans') {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('duration_days', { ascending: true });
            if (!error && data) setPlans(data);
        } else {
            const { data, error } = await supabase
                .from('driver_subscriptions')
                .select(`
          *,
          profiles(full_name, phone_number),
          subscription_plans(name)
        `)
                .order('created_at', { ascending: false });
            if (!error && data) setHistory(data as any);
        }
        setLoading(false);
    };

    const handleSavePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: formData.name,
            duration_days: formData.duration_days,
            price: formData.price,
            vehicle_type: formData.vehicleType || null
        };

        if (editingPlan) {
            const { error } = await supabase
                .from('subscription_plans')
                .update(payload)
                .eq('id', editingPlan.id);
            if (error) alert(error.message);
        } else {
            const { error } = await supabase
                .from('subscription_plans')
                .insert([{ ...payload, is_active: true }]);
            if (error) alert(error.message);
        }

        setIsModalOpen(false);
        fetchData();
    };

    const togglePlanActive = async (plan: SubscriptionPlan) => {
        setLoading(true);
        await supabase
            .from('subscription_plans')
            .update({ is_active: !plan.is_active })
            .eq('id', plan.id);
        fetchData();
    };

    const handleDeletePlan = async (id: string, name: string) => {
        if (!window.confirm(`Yakin ingin menghapus paket "${name}" secara permanen? Catatan: Jika paket ini sudah dibeli driver, menghapusnya mungkin merusak history history mereka. Disarankan untuk menggunakan fitur Nonaktifkan saja.`)) return;

        setLoading(true);
        const { error } = await supabase
            .from('subscription_plans')
            .delete()
            .eq('id', id);

        if (error) alert(error.message);
        fetchData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Manajemen Langganan Driver</h1>
                {activeTab === 'plans' && (
                    <button
                        onClick={() => {
                            setEditingPlan(null);
                            setFormData({ name: '', duration_days: 1, price: 0, vehicleType: '' });
                            setIsModalOpen(true);
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Tambah Paket
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'plans' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('plans')}
                >
                    Paket Langganan
                </button>
                <button
                    className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('history')}
                >
                    Menu Riwayat Berlangganan
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {activeTab === 'plans' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Nama Paket</th>
                                        <th className="px-6 py-4">Tipe Kendaraan</th>
                                        <th className="px-6 py-4">Durasi (Hari)</th>
                                        <th className="px-6 py-4">Harga</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {plans.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">{plan.name}</td>
                                            <td className="px-6 py-4">
                                                {plan.vehicle_type === 'MOTOR' ? '🏍️ Motor' :
                                                    plan.vehicle_type === 'CAR' ? '🚗 Mobil' : '🌟 Semua'}
                                            </td>
                                            <td className="px-6 py-4">{plan.duration_days} Hari</td>
                                            <td className="px-6 py-4 text-green-600 font-bold">{formatCurrency(plan.price)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {plan.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingPlan(plan);
                                                        setFormData({
                                                            name: plan.name,
                                                            duration_days: plan.duration_days,
                                                            price: plan.price,
                                                            vehicleType: plan.vehicle_type || ''
                                                        });
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 px-2"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => togglePlanActive(plan)}
                                                    className={`${plan.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'} px-2`}
                                                    title={plan.is_active ? 'Nonaktifkan Sementara' : 'Aktifkan'}
                                                >
                                                    {plan.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                                                    className="text-red-600 hover:text-red-800 px-2"
                                                    title="Hapus Permanen"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {plans.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                                Belum ada paket langganan. Tambahkan sekarang!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-slate-700 font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Driver (Phone)</th>
                                        <th className="px-6 py-4">Paket Dipilih</th>
                                        <th className="px-6 py-4">Harga Beli</th>
                                        <th className="px-6 py-4">Tgl Pembelian</th>
                                        <th className="px-6 py-4">Masa Aktif s/d</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {history.map((record) => {
                                        const isExpired = new Date(record.end_date) < new Date();
                                        return (
                                            <tr key={record.id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-900">{record.profiles?.full_name ?? 'Unknown'}</div>
                                                    <div className="text-xs text-slate-500">{record.profiles?.phone_number ?? '-'}</div>
                                                </td>
                                                <td className="px-6 py-4">{record.subscription_plans?.name ?? 'Paket Terhapus'}</td>
                                                <td className="px-6 py-4 font-medium">{formatCurrency(record.price_paid)}</td>
                                                <td className="px-6 py-4">{formatDate(record.start_date)}</td>
                                                <td className="px-6 py-4">{formatDate(record.end_date)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${!isExpired ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {!isExpired ? 'Aktif' : 'Expired'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                                Belum ada riwayat langganan driver.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal CRUD Plan */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold">{editingPlan ? 'Edit Paket' : 'Tambah Paket Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSavePlan} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Paket</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Misal: Paket Harian"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Hari Aktif)</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.duration_days}
                                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Untuk Kendaraan</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                >
                                    <option value="">Semua Kendaraan</option>
                                    <option value="MOTOR">Khusus Motor (Ojek)</option>
                                    <option value="CAR">Khusus Mobil (Car)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                                <input
                                    type="number"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
                                >
                                    {editingPlan ? 'Simpan Perubahan' : 'Buat Paket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
