'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, MapPin } from 'lucide-react';

interface TravelRoute {
    id: string;
    origin: string;
    destination: string;
    distance_km: number;
    is_active: boolean;
    created_at: string;
}

export default function TravelRoutesPage() {
    const [routes, setRoutes] = useState<TravelRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        distance_km: 0,
        is_active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('travel_routes')
                .select('*')
                .order('origin', { ascending: true });

            if (error) throw error;
            setRoutes(data || []);
        } catch (error) {
            console.error('Error fetching routes:', error);
            alert('Gagal mengambil data rute.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (route?: TravelRoute) => {
        if (route) {
            setEditingId(route.id);
            setFormData({
                origin: route.origin,
                destination: route.destination,
                distance_km: route.distance_km,
                is_active: route.is_active
            });
        } else {
            setEditingId(null);
            setFormData({
                origin: '',
                destination: '',
                distance_km: 0,
                is_active: true
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
            const res = await fetch('/api/travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    table: 'travel_routes',
                    id: editingId,
                    data: formData
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            handleCloseModal();
            fetchRoutes();
        } catch (error: any) {
            console.error('Error saving route:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus rute ini?')) return;

        try {
            const res = await fetch('/api/travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'DELETE', 
                    table: 'travel_routes',
                    id 
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            fetchRoutes();
        } catch (error: any) {
            console.error('Error deleting route:', error);
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
            <div className="p-6 border-b border-slate-200 flex justify-between items-center text-slate-800">
                <div>
                    <h2 className="text-xl font-bold">Manajemen Rute Travel</h2>
                    <p className="text-sm text-slate-500 mt-1">Kelola daftar kota asal dan tujuan travel</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Rute
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600">Asal</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Tujuan</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Jarak (KM)</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-800">
                        {routes.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                    Belum ada data rute. Silakan tambah baru.
                                </td>
                            </tr>
                        ) : (
                            routes.map((route) => (
                                <tr key={route.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{route.origin}</td>
                                    <td className="px-6 py-4 font-medium">{route.destination}</td>
                                    <td className="px-6 py-4">{route.distance_km} KM</td>
                                    <td className="px-6 py-4 text-center">
                                        {route.is_active ? (
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
                                            onClick={() => handleOpenModal(route)}
                                            className="text-slate-400 hover:text-blue-600 p-2 transition-colors inline-block"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(route.id)}
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
                                {editingId ? 'Edit Rute' : 'Tambah Rute Baru'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kota Asal</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800"
                                    placeholder="Contoh: Bangko"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kota Tujuan</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800"
                                    placeholder="Contoh: Jambi"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Estimasi Jarak (KM)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.distance_km}
                                    onChange={(e) => setFormData({ ...formData, distance_km: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-slate-800"
                                />
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
                                    Rute ini Aktif
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
                                        'Simpan Rute'
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
