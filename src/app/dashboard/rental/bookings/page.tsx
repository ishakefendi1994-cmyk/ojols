'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Search,
    User,
    Calendar,
    Clock,
    Car,
    MapPin,
    ArrowRight,
    Loader2,
    CheckCircle,
    XCircle,
    UserCheck,
    Send
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Driver {
    id: string;
    full_name: string;
}

interface RentalBooking {
    id: string;
    user_id: string;
    route_id: string;
    driver_id: string | null;
    pickup_date: string;
    pickup_time: string;
    car_description: string;
    total_price: number;
    app_fee: number;
    driver_share: number;
    payment_method: string;
    payment_status: string;
    status: string;
    created_at: string;
    customer: { full_name: string; phone_number: string };
    route: { origin: string; destination: string };
    driver: { full_name: string } | null;
}

export default function RentalBookingsPage() {
    const [bookings, setBookings] = useState<RentalBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<RentalBooking | null>(null);
    const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [routeDrivers, setRouteDrivers] = useState<string[]>([]);
    const [isPaymentConfirmModalOpen, setIsPaymentConfirmModalOpen] = useState(false);
    const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<RentalBooking | null>(null);

    useEffect(() => {
        fetchBookings();
        fetchDrivers();
    }, []);

    async function fetchBookings() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('rental_bookings')
                .select('*, customer:profiles!user_id(full_name, phone_number), route:rental_routes(origin, destination), driver:profiles!driver_id(full_name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchDrivers() {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'DRIVER')
                .eq('is_verified', true);
            if (error) throw error;
            setAvailableDrivers(data || []);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    }

    async function fetchRouteDrivers(routeId: string) {
        try {
            const { data, error } = await supabase
                .from('rental_route_drivers')
                .select('driver_id')
                .eq('route_id', routeId);
            if (error) throw error;
            setRouteDrivers(data?.map(d => d.driver_id) || []);
        } catch (error) {
            console.error('Error fetching route drivers:', error);
        }
    }

    async function handleAssignDriver() {
        if (!selectedBooking || !selectedDriverId) return;

        try {
            const { error } = await supabase
                .from('rental_bookings')
                .update({ 
                    driver_id: selectedDriverId,
                    status: 'assigned'
                })
                .eq('id', selectedBooking.id);

            if (error) throw error;

            // Trigger notification here if API available
            await supabase.from('notifications').insert({
                user_id: selectedDriverId,
                title: 'Tugas Sewa Driver Baru',
                body: `Anda ditugaskan untuk rute ${selectedBooking.route.origin} - ${selectedBooking.route.destination}`,
                type: 'RENTAL_ASSIGNMENT'
            });

            // 3. If already paid, process settlement to driver
            if (selectedBooking.payment_status === 'paid') {
                const { error: rpcError } = await supabase.rpc('process_rental_payment', {
                    p_booking_id: selectedBooking.id
                });
                if (rpcError) console.error('Error settling payment:', rpcError);
            }

            alert("Driver berhasil ditugaskan");

            setIsAssignModalOpen(false);
            fetchBookings();
        } catch (error) {
            console.error('Error assigning driver:', error);
            alert('Gagal menugaskan driver');
        }
    }

    async function updateBookingStatus(id: string, status: string) {
        try {
            const { error } = await supabase
                .from('rental_bookings')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
            fetchBookings();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    async function handleConfirmPayment(booking: RentalBooking, isManual: boolean = false) {
        try {
            setLoading(true);
            
            // 1. Process via RPC (which handles status update and optional wallet settlement)
            const { data, error: rpcError } = await supabase.rpc('process_rental_payment', {
                p_booking_id: booking.id,
                p_manual_settlement: isManual
            });

            if (rpcError) throw rpcError;

            alert(isManual 
                ? 'Pembayaran dikonfirmasi (Settlement manual/cash dilakukan)' 
                : 'Pembayaran dikonfirmasi & Saldo otomatis diproses');
            
            setIsPaymentConfirmModalOpen(false);
            setSelectedPaymentBooking(null);
            fetchBookings();
        } catch (error: any) {
            console.error('Error confirming payment:', error);
            alert('Gagal mengonfirmasi pembayaran: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    const filteredBookings = bookings.filter(b =>
        (b.customer?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.route?.origin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.route?.destination || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'searching': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Mencari Driver</span>;
            case 'assigned': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">Terjadwal</span>;
            case 'on_way': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Driver Menuju Lokasi</span>;
            case 'active': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Sedang Jalan</span>;
            case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Selesai</span>;
            default: return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">Dibatalkan</span>;
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Daftar Pesanan Sewa Driver</h1>
                    <p className="text-gray-500">Pantau dan kelola semua pesanan jasa sewa driver</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari nama pelanggan atau kota..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Memuat data pesanan...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                                    <th className="px-6 py-4 font-semibold">Pelanggan & Rute</th>
                                    <th className="px-6 py-4 font-semibold">Penjemputan</th>
                                    <th className="px-6 py-4 font-semibold">Info Mobil</th>
                                    <th className="px-6 py-4 font-semibold">Driver</th>
                                    <th className="px-6 py-4 font-semibold">Pembayaran</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900">{booking.customer?.full_name || 'Pelanggan'}</span>
                                                <span className="text-xs text-gray-500 mb-1">{booking.customer.phone_number}</span>
                                                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                                                    <span>{booking.route?.origin || '-'}</span>
                                                    <ArrowRight className="w-3 h-3" />
                                                    <span>{booking.route?.destination || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-gray-400" />
                                                    <span>{formatDate(booking.pickup_date)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-gray-400" />
                                                    <span>{booking.pickup_time.substring(0, 5)} WIB</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Car className="w-4 h-4" />
                                                <span className="truncate max-w-[120px]">{booking.car_description}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {booking.driver ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span>{booking.driver.full_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Belum ditentukan</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{formatCurrency(booking.total_price)}</span>
                                                <div className="flex flex-col gap-0.5 mt-1 border-t border-gray-100 pt-1">
                                                    <span className="text-[10px] text-gray-500 flex justify-between">
                                                        <span>Net Driver:</span>
                                                        <span className="font-semibold text-blue-600">{formatCurrency(booking.driver_share)}</span>
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 flex justify-between">
                                                        <span>Fee (10%):</span>
                                                        <span>{formatCurrency(booking.app_fee)}</span>
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase mt-1 ${
                                                    booking.payment_status === 'paid' ? 'text-green-600' : 'text-red-500'
                                                }`}>
                                                    {booking.payment_method} - {booking.payment_status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {booking.status === 'searching' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            fetchRouteDrivers(booking.route_id);
                                                            setIsAssignModalOpen(true);
                                                        }}
                                                        className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                                                        title="Tentukan Driver"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                        className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                                                        title="Selesaikan"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {booking.payment_status === 'pending' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPaymentBooking(booking);
                                                            setIsPaymentConfirmModalOpen(true);
                                                        }}
                                                        className="p-2 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded-lg transition-colors"
                                                        title="Konfirmasi Pembayaran"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {booking.status !== 'cancelled' && (
                                                    <button
                                                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                                        title="Batalkan"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Assign Driver */}
            {isAssignModalOpen && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <UserCheck className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Tentukan Driver</h2>
                                <p className="text-sm text-gray-500">Pilih driver untuk pesanan sewa ini</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Pelanggan</span>
                                <span className="font-semibold">{selectedBooking.customer?.full_name || 'Pelanggan'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Rute</span>
                                <span className="font-semibold">{selectedBooking.route?.origin || '-'} → {selectedBooking.route?.destination || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Driver Terverifikasi</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedDriverId}
                                    onChange={(e) => setSelectedDriverId(e.target.value)}
                                >
                                    <option value="">-- Pilih Driver --</option>
                                    {availableDrivers
                                        .filter(d => routeDrivers.length === 0 || routeDrivers.includes(d.id))
                                        .map(driver => (
                                            <option key={driver.id} value={driver.id}>{driver.full_name}</option>
                                        ))
                                    }
                                </select>
                                {routeDrivers.length > 0 && (
                                    <p className="text-[10px] text-blue-600 mt-1">* Menampilkan driver yang terdaftar di rute ini</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAssignDriver}
                                    disabled={!selectedDriverId}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    Konfirmasi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Pembayaran & Settlement */}
            {isPaymentConfirmModalOpen && selectedPaymentBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-amber-100 rounded-xl">
                                <CheckCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Validasi Pembayaran</h2>
                                <p className="text-sm text-gray-500">Pilih metode penyelesaian (settlement)</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Metode Pembayaran User</span>
                                    <span className="font-bold uppercase text-blue-600">{selectedPaymentBooking.payment_method}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Transaksi</span>
                                    <span className="font-bold">{formatCurrency(selectedPaymentBooking.total_price)}</span>
                                </div>
                                <div className="border-t border-gray-200 my-2 pt-2">
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Hasil Bersih Driver (90%)</span>
                                        <span className="font-bold">{formatCurrency(selectedPaymentBooking.driver_share)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span>Potongan Fee (10%)</span>
                                        <span>{formatCurrency(selectedPaymentBooking.app_fee)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleConfirmPayment(selectedPaymentBooking, false)}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Masukkan ke Saldo Wallet Driver
                            </button>
                            
                            <button
                                onClick={() => handleConfirmPayment(selectedPaymentBooking, true)}
                                className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                            >
                                Tandai Lunas (Bayar Cash Offline)
                            </button>

                            <button
                                onClick={() => {
                                    setIsPaymentConfirmModalOpen(false);
                                    setSelectedPaymentBooking(null);
                                }}
                                className="w-full py-2 text-gray-400 text-sm hover:text-gray-600"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
