'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Plus, 
    Pencil, 
    Trash2, 
    Search,
    MapPin,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface RentalRoute {
    id: string;
    origin: string;
    destination: string;
    base_price: number;
    is_active: boolean;
}

export default function RentalRoutesPage() {
    const [routes, setRoutes] = useState<RentalRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState<RentalRoute | null>(null);
    const [formData, setFormData] = useState({
        origin: '',
        destination: '',
        base_price: 0,
        is_active: true,
        driver_ids: [] as string[]
    });
    const [availableDrivers, setAvailableDrivers] = useState<{id: string, full_name: string}[]>([]);
    const [driverSearchQuery, setDriverSearchQuery] = useState('');

    useEffect(() => {
        fetchRoutes();
        fetchDrivers();
    }, []);

    async function fetchDrivers() {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('role', 'DRIVER')
            .eq('is_verified', true);
        if (data) setAvailableDrivers(data);
    }

    async function fetchRoutes() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('rental_routes')
                .select('*, rental_route_drivers(driver_id)')
                .order('origin');

            if (error) throw error;
            const formatted = (data || []).map(r => ({
                ...r,
                driver_ids: r.rental_route_drivers?.map((rd: any) => rd.driver_id) || []
            }));
            setRoutes(formatted);
        } catch (error) {
            console.error('Error fetching routes:', error);
            alert('Gagal mengambil data rute');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            let routeId = editingRoute?.id;
            
            const payload = {
                origin: formData.origin,
                destination: formData.destination,
                base_price: formData.base_price,
                is_active: formData.is_active
            };

            if (editingRoute) {
                const { error } = await supabase
                    .from('rental_routes')
                    .update(payload)
                    .eq('id', editingRoute.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('rental_routes')
                    .insert([payload])
                    .select();
                if (error) throw error;
                routeId = data[0].id;
            }

            // Sync Drivers
            if (routeId) {
                // Delete old
                await supabase.from('rental_route_drivers').delete().eq('route_id', routeId);
                // Insert new
                if (formData.driver_ids.length > 0) {
                    const relations = formData.driver_ids.map(dId => ({
                        route_id: routeId,
                        driver_id: dId
                    }));
                    await supabase.from('rental_route_drivers').insert(relations);
                }
            }

            setIsModalOpen(false);
            setEditingRoute(null);
            setFormData({ origin: '', destination: '', base_price: 0, is_active: true, driver_ids: [] });
            fetchRoutes();
        } catch (error) {
            console.error('Error saving route:', error);
            alert('Gagal menyimpan rute');
        }
    }

    async function deleteRoute(id: string) {
        if (!confirm('Anda yakin ingin menghapus rute ini?')) return;
        try {
            const { error } = await supabase
                .from('rental_routes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchRoutes();
        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Gagal menghapus rute');
        }
    }

    const filteredRoutes = routes.filter(route =>
        route.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.destination.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Rute (Konsolidasi)</h1>
                    <p className="text-gray-500">Atur rute dan tarif dasar untuk jasa sewa driver & travel</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRoute(null);
                        setFormData({ origin: '', destination: '', base_price: 0, is_active: true, driver_ids: [] });
                        setDriverSearchQuery('');
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Rute
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari rute asal atau tujuan..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Memuat data rute...</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                                <th className="px-6 py-4 font-semibold">Rute Perjalanan</th>
                                <th className="px-6 py-4 font-semibold">Harga Dasar</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRoutes.map((route) => (
                                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-800">{route.origin}</span>
                                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                                <span className="font-semibold text-gray-800">{route.destination}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-blue-600">
                                            {formatCurrency(route.base_price)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            route.is_active 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {route.is_active ? 'Aktif' : 'Non-aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingRoute(route);
                                                    setFormData({
                                                        origin: route.origin,
                                                        destination: route.destination,
                                                        base_price: route.base_price,
                                                        is_active: route.is_active,
                                                        //@ts-ignore
                                                        driver_ids: route.driver_ids || []
                                                    });
                                                    setDriverSearchQuery('');
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteRoute(route.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingRoute ? 'Edit Rute Sewa' : 'Tambah Rute Sewa'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kota Asal</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.origin}
                                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kota Tujuan</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Dasar (Rp)</label>
                                <input
                                    required
                                    type="number"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Rute Aktif</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Driver Tersedia ({formData.driver_ids.length})</label>
                                
                                {/* Driver Search */}
                                <div className="relative mb-2">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input 
                                        type="text"
                                        placeholder="Cari nama driver..."
                                        className="w-full pl-8 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={driverSearchQuery}
                                        onChange={(e) => setDriverSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                    {availableDrivers
                                        .filter(d => d.full_name.toLowerCase().includes(driverSearchQuery.toLowerCase()))
                                        .map(driver => (
                                        <label key={driver.id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                                checked={formData.driver_ids.includes(driver.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...formData.driver_ids, driver.id]
                                                        : formData.driver_ids.filter(id => id !== driver.id);
                                                    setFormData({ ...formData, driver_ids: ids });
                                                }}
                                            />
                                            <span className="text-sm text-gray-700">{driver.full_name}</span>
                                        </label>
                                    ))}
                                    {availableDrivers.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">Tidak ada driver terverifikasi</p>
                                    )}
                                    {availableDrivers.length > 0 && availableDrivers.filter(d => d.full_name.toLowerCase().includes(driverSearchQuery.toLowerCase())).length === 0 && (
                                        <p className="text-xs text-gray-400 italic text-center py-2">Driver tidak ditemukan</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Simpan Rute
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
