'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ServiceType {
    id: string;
    name: string;
    icon_url: string | null;
    base_price: number;
    price_per_km: number;
    admin_fee_percentage: number;
    admin_fee_fixed: number;
    is_active: boolean;
    service_fee: number;
    max_distance_km: number;
    operating_area: string;
    min_driver_balance: number;
}

export default function ServicesPage() {
    const [services, setServices] = useState<ServiceType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        base_price: 0,
        price_per_km: 0,
        admin_fee_percentage: 0,
        is_active: true,
        service_fee: 0,
        max_distance_km: 50,
        operating_area: '',
        min_driver_balance: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setServices(data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            alert('Gagal mengambil data layanan.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (service?: ServiceType) => {
        if (service) {
            setEditingId(service.id);
            setFormData({
                name: service.name,
                base_price: service.base_price,
                price_per_km: service.price_per_km,
                admin_fee_percentage: service.admin_fee_percentage,
                is_active: service.is_active,
                service_fee: service.service_fee || 0,
                max_distance_km: service.max_distance_km || 50,
                operating_area: service.operating_area || '',
                min_driver_balance: service.min_driver_balance || 0
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                base_price: 0,
                price_per_km: 0,
                admin_fee_percentage: 0,
                is_active: true,
                service_fee: 0,
                max_distance_km: 50,
                operating_area: '',
                min_driver_balance: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const action = editingId ? 'UPDATE' : 'CREATE';
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    id: editingId,
                    serviceData: formData
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            handleCloseModal();
            fetchServices();
        } catch (error: any) {
            console.error('Error saving service:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah yanda yakin ingin menghapus layanan ini? Data yang terhapus tidak dapat dikembalikan.')) return;

        try {
            const res = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            fetchServices();
        } catch (error: any) {
            console.error('Error deleting service:', error);
            alert(`Gagal menghapus data: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Master Data Layanan</h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola jenis layanan kendaraan dan pengiriman</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Layanan
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600">Nama Layanan</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Tarif Dasar</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Tarif / KM</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Min. Saldo Driver</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Potongan Admin (%)</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                    Belum ada data layanan. Silakan tambah baru.
                                </td>
                            </tr>
                        ) : (
                            services.map((svc) => (
                                <tr key={svc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{svc.name}</td>
                                    <td className="px-6 py-4 text-slate-600">Rp {svc.base_price.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 text-slate-600">Rp {svc.price_per_km.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 text-slate-600 font-medium text-orange-600">Rp {svc.min_driver_balance?.toLocaleString('id-ID') || 0}</td>
                                    <td className="px-6 py-4 text-slate-600 font-medium text-blue-600">{svc.admin_fee_percentage}%</td>
                                    <td className="px-6 py-4 text-center">
                                        {svc.is_active ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                                Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(svc)}
                                            className="text-slate-400 hover:text-blue-600 p-2 transition-colors inline-block"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(svc.id)}
                                            className="text-slate-400 hover:text-red-600 p-2 transition-colors inline-block ml-1"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Layanan</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Contoh: Ojek Motor"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tarif Dasar (Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.base_price}
                                        onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-xs text-slate-500 mt-1 block">Tarif buka pintu</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tarif / KM (Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price_per_km}
                                        onChange={(e) => setFormData({ ...formData, price_per_km: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Potongan Admin (%)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={formData.admin_fee_percentage}
                                    onChange={(e) => setFormData({ ...formData, admin_fee_percentage: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Contoh: 15"
                                />
                                <span className="text-xs text-slate-500 mt-1 block">Keuntungan owner aplikasi per order.</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Biaya Layanan (Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.service_fee}
                                        onChange={(e) => setFormData({ ...formData, service_fee: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-xs text-slate-500 mt-1 block">Biaya tambahan fix</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Maks Jarak (KM)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.max_distance_km}
                                        onChange={(e) => setFormData({ ...formData, max_distance_km: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Minimal Driver (Rp)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.min_driver_balance}
                                    onChange={(e) => setFormData({ ...formData, min_driver_balance: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Contoh: 10000"
                                />
                                <span className="text-xs text-slate-500 mt-1 block">Driver tidak akan menerima order jika saldonya kurang dari ini.</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Area Operasi (Opsional)</label>
                                <input
                                    type="text"
                                    value={formData.operating_area}
                                    onChange={(e) => setFormData({ ...formData, operating_area: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Contoh: merangin"
                                />
                                <span className="text-xs text-slate-500 mt-1 block">Kosongkan jika aktif di semua area</span>
                            </div>

                            <div className="flex items-center pt-2 gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                                    Layanan ini Aktif (bisa dipesan pelanggan)
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan</>
                                    ) : (
                                        'Simpan Data'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
