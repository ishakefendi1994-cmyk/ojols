'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface VehicleType {
    id: string;
    service_id: string;
    type_code: string;
    display_name: string;
    description: string;
    base_price_override: number | null;
    price_per_km_override: number | null;
    capacity: number;
    service_name?: string; // Joined from services table
}

interface ServiceInfo {
    id: string;
    name: string;
}

export default function VehicleTypesPage() {
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [services, setServices] = useState<ServiceInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        service_id: '',
        type_code: '',
        display_name: '',
        description: '',
        capacity: 4,
        base_price_override: 0,
        price_per_km_override: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Services for dropdown
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('id, name')
                .order('name');
            if (servicesError) throw servicesError;
            setServices(servicesData || []);

            // Fetch Vehicle Types with service name
            const { data, error } = await supabase
                .from('vehicle_types')
                .select(`
                    *,
                    services:service_id (name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const formattedData = (data || []).map(item => ({
                ...item,
                service_name: item.services?.name || 'Unknown'
            }));
            
            setVehicleTypes(formattedData);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Gagal mengambil data.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item?: VehicleType) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                service_id: item.service_id,
                type_code: item.type_code,
                display_name: item.display_name,
                description: item.description || '',
                capacity: item.capacity || 4,
                base_price_override: item.base_price_override || 0,
                price_per_km_override: item.price_per_km_override || 0
            });
        } else {
            setEditingId(null);
            setFormData({
                service_id: services.length > 0 ? services[0].id : '',
                type_code: '',
                display_name: '',
                description: '',
                capacity: 4,
                base_price_override: 0,
                price_per_km_override: 0
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

        // Convert 0 to null for overrides if that's the desired convention, 
        // or just pass the numbers.
        const payload = {
            ...formData,
            base_price_override: formData.base_price_override > 0 ? formData.base_price_override : null,
            price_per_km_override: formData.price_per_km_override > 0 ? formData.price_per_km_override : null,
        };

        try {
            const action = editingId ? 'UPDATE' : 'CREATE';
            const res = await fetch('/api/vehicle-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    id: editingId,
                    typeData: payload
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            handleCloseModal();
            fetchData();
        } catch (error: any) {
            console.error('Error saving vehicle type:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus tipe kendaraan ini?')) return;

        try {
            const res = await fetch('/api/vehicle-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', id })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            fetchData();
        } catch (error: any) {
            console.error('Error deleting vehicle type:', error);
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
                    <h2 className="text-xl font-bold text-slate-800">Master Tipe Kendaraan</h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola variasi kendaraan (misal: Mobil XL, Motor Big Matic)</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Tipe
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600">Layanan</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Kode Tipe</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Nama Tampilan</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Kapasitas</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Tarif Dasar (Override)</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Tarif / KM (Override)</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicleTypes.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                                    Belum ada data tipe kendaraan.
                                </td>
                            </tr>
                        ) : (
                            vehicleTypes.map((item) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">{item.service_name}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-mono">{item.type_code}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 font-medium">
                                        {item.display_name}
                                        <div className="text-xs text-slate-500 font-normal">{item.description}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{item.capacity} Kursi</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.base_price_override ? `Rp ${item.base_price_override.toLocaleString('id-ID')}` : <span className="text-slate-400 text-xs italic">Default Layanan</span>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.price_per_km_override ? `Rp ${item.price_per_km_override.toLocaleString('id-ID')}` : <span className="text-slate-400 text-xs italic">Default Layanan</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="text-slate-400 hover:text-blue-600 p-2 transition-colors inline-block"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingId ? 'Edit Tipe Kendaraan' : 'Tambah Tipe Kendaraan'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Layanan Induk</label>
                                <select
                                    required
                                    value={formData.service_id}
                                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                    <option value="" disabled>Pilih Layanan</option>
                                    {services.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Kode Tipe</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.type_code}
                                        onChange={(e) => setFormData({ ...formData, type_code: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                        placeholder="Contoh: HEMAT, XL, BIG_MATIC"
                                    />
                                    <span className="text-xs text-slate-500 mt-1 block">Sesuai profil driver</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Tampilan</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.display_name}
                                        onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Contoh: Mobil Hemat"
                                    />
                                    <span className="text-xs text-slate-500 mt-1 block">Muncul di app user</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Deskripsi</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Contoh: 2 Baris (Max 4 org)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tarif Dasar (Override) Rp</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.base_price_override}
                                        onChange={(e) => setFormData({ ...formData, base_price_override: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-xs text-slate-500 mt-1 block">Isi 0 untuk pakai tarif default layanan</span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tarif/KM (Override) Rp</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.price_per_km_override}
                                        onChange={(e) => setFormData({ ...formData, price_per_km_override: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-xs text-slate-500 mt-1 block">Isi 0 untuk pakai tarif default layanan</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Kapasitas Kursi</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                </div>
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
