'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, XCircle, Loader2, Calendar, MapPin, Car, User } from 'lucide-react';

interface TravelSchedule {
    id: string;
    route_id: string;
    vehicle_id: string;
    driver_id: string | null;
    departure_time: string;
    price_per_seat: number;
    status: string;
    notes: string | null;
    created_at: string;
    travel_routes: { origin: string; destination: string };
    travel_vehicles: { name: string; plate_number: string };
    profiles: { full_name: string } | null;
}

export default function TravelSchedulesPage() {
    const [schedules, setSchedules] = useState<TravelSchedule[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        route_id: '',
        vehicle_id: '',
        driver_id: '',
        departure_time: '',
        price_per_seat: 0,
        status: 'open',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Schedules with Joins
            const { data: schedData, error: schedError } = await supabase
                .from('travel_schedules')
                .select(`
                    *,
                    travel_routes(origin, destination),
                    travel_vehicles(name, plate_number),
                    profiles:driver_id(full_name)
                `)
                .order('departure_time', { ascending: true });

            if (schedError) throw schedError;
            setSchedules(schedData || []);

            // Fetch Routes for Dropdown
            const { data: routeData } = await supabase.from('travel_routes').select('id, origin, destination').eq('is_active', true);
            setRoutes(routeData || []);

            // Fetch Vehicles for Dropdown
            const { data: vehicleData } = await supabase.from('travel_vehicles').select('id, name, plate_number').eq('is_active', true);
            setVehicles(vehicleData || []);

            // Fetch Drivers for Dropdown
            const { data: driverData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'DRIVER')
                .eq('verification_status', 'VERIFIED');
            setDrivers(driverData || []);

        } catch (error) {
            console.error('Error fetching schedule data:', error);
            alert('Gagal mengambil data jadwal.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (schedule?: TravelSchedule) => {
        if (schedule) {
            setEditingId(schedule.id);
            setFormData({
                route_id: schedule.route_id,
                vehicle_id: schedule.vehicle_id,
                driver_id: schedule.driver_id || '',
                departure_time: new Date(schedule.departure_time).toISOString().slice(0, 16),
                price_per_seat: schedule.price_per_seat,
                status: schedule.status,
                notes: schedule.notes || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                route_id: routes[0]?.id || '',
                vehicle_id: vehicles[0]?.id || '',
                driver_id: drivers[0]?.id || '',
                departure_time: '',
                price_per_seat: 0,
                status: 'open',
                notes: ''
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
            
            // Clean driver_id if empty
            const submissionData = {
                ...formData,
                driver_id: formData.driver_id || null,
                departure_time: new Date(formData.departure_time).toISOString()
            };

            const res = await fetch('/api/travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    table: 'travel_schedules',
                    id: editingId,
                    data: submissionData
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            handleCloseModal();
            fetchData();
        } catch (error: any) {
            console.error('Error saving schedule:', error);
            alert(`Gagal menyimpan data: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus jadwal ini?')) return;

        try {
            const res = await fetch('/api/travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'DELETE', 
                    table: 'travel_schedules',
                    id 
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Terjadi kesalahan di server');

            fetchData();
        } catch (error: any) {
            console.error('Error deleting schedule:', error);
            alert(`Gagal menghapus data: ${error.message}`);
        }
    };

    const statusBadge = (status: string) => {
        const colors: any = {
            open: 'bg-green-100 text-green-800',
            full: 'bg-orange-100 text-orange-800',
            departed: 'bg-blue-100 text-blue-800',
            completed: 'bg-slate-100 text-slate-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status.toUpperCase()}
            </span>
        );
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
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-slate-800">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-blue-600" /> Manajemen Jadwal Travel
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Atur waktu keberangkatan, rute, dan penugasan supir</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Jadwal
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600">Jadwal & Rute</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Armada</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Supir</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Harga</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-800">
                        {schedules.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                    Belum ada jadwal keberangkatan.
                                </td>
                            </tr>
                        ) : (
                            schedules.map((s) => (
                                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            {new Date(s.departure_time).toLocaleString('id-ID', {
                                                weekday: 'short',
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-red-400" />
                                            {s.travel_routes.origin} → {s.travel_routes.destination}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium">{s.travel_vehicles.name}</div>
                                        <div className="text-xs text-slate-400">{s.travel_vehicles.plate_number}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium flex items-center gap-1">
                                            <User className="w-3 h-3 text-blue-400" />
                                            {s.profiles?.full_name || 'Belum Diatur'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-blue-600">
                                        Rp {s.price_per_seat.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {statusBadge(s.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(s)}
                                            className="text-slate-400 hover:text-blue-600 p-2 transition-colors inline-block"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(s.id)}
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
                                {editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Rute</label>
                                    <select
                                        required
                                        value={formData.route_id}
                                        onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                    >
                                        <option value="">Pilih Rute...</option>
                                        {routes.map(r => (
                                            <option key={r.id} value={r.id}>{r.origin} → {r.destination}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Armada</label>
                                    <select
                                        required
                                        value={formData.vehicle_id}
                                        onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                    >
                                        <option value="">Pilih Kendaraan...</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.name} ({v.plate_number})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tugaskan Supir</label>
                                <select
                                    value={formData.driver_id}
                                    onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                >
                                    <option value="">Pilih Supir...</option>
                                    {drivers.map(d => (
                                        <option key={d.id} value={d.id}>{d.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Keberangkatan</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.departure_time}
                                        onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Harga per Kursi (Rp)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price_per_seat}
                                        onChange={(e) => setFormData({ ...formData, price_per_seat: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status Jadwal</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                >
                                    <option value="open">OPEN (Bisa Dipesan)</option>
                                    <option value="full">FULL (Penuh)</option>
                                    <option value="departed">DEPARTED (Berangkat)</option>
                                    <option value="completed">COMPLETED (Selesai)</option>
                                    <option value="cancelled">CANCELLED (Dibatalkan)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                                    rows={2}
                                    placeholder="Contoh: Titik kumpul di depan Masjid Agung"
                                />
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
                                        'Simpan Jadwal'
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
