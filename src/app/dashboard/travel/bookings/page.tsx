'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
    Search, 
    Ticket, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    QrCode, 
    Calendar, 
    User, 
    Phone, 
    CreditCard, 
    Banknote,
    Clock,
    MapPin
} from 'lucide-react';

interface TravelBooking {
    id: string;
    user_id: string;
    schedule_id: string;
    seat_number: number;
    passenger_name: string;
    passenger_phone: string;
    payment_method: string;
    payment_status: string;
    total_price: number;
    qr_code: string;
    ticket_status: string;
    created_at: string;
    used_at: string | null;
    profiles: { full_name: string } | null;
    travel_schedules: {
        departure_time: string;
        travel_routes: { origin: string; destination: string };
    };
}

export default function TravelBookingsPage() {
    const [bookings, setBookings] = useState<TravelBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [qrInput, setQrInput] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('travel_bookings')
                .select(`
                    *,
                    profiles:user_id(full_name),
                    travel_schedules:schedule_id(
                        departure_time,
                        travel_routes:route_id(origin, destination)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            alert('Gagal mengambil data pesanan.');
        } finally {
            setLoading(false);
        }
    };

    const handleValidateTicket = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!qrInput.trim()) return;

        setIsValidating(true);
        try {
            // 1. Find booking by QR Code
            const { data: booking, error: findError } = await supabase
                .from('travel_bookings')
                .select('id, ticket_status, passenger_name')
                .eq('qr_code', qrInput)
                .single();

            if (findError || !booking) {
                alert('Tiket tidak ditemukan! Periksa kembali kode QR.');
                return;
            }

            if (booking.ticket_status === 'used') {
                alert(`Tiket ini SUDAH TERPAKAI oleh ${booking.passenger_name}.`);
                return;
            }

            if (booking.ticket_status === 'expired') {
                alert('Tiket ini sudah kadaluarsa.');
                return;
            }

            // 2. Mark as used
            const res = await fetch('/api/travel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE',
                    table: 'travel_bookings',
                    id: booking.id,
                    data: { 
                        ticket_status: 'used',
                        used_at: new Date().toISOString()
                    }
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || 'Gagal update status tiket');

            alert(`BERHASIL! Tiket atas nama ${booking.passenger_name} sekarang berstatus TERPAKAI.`);
            setQrInput('');
            fetchBookings();
        } catch (error: any) {
            console.error('Error validating ticket:', error);
            alert(`Terjadi kesalahan: ${error.message}`);
        } finally {
            setIsValidating(false);
        }
    };

    const filteredBookings = bookings.filter(b => 
        b.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.qr_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'unused': return 'bg-green-100 text-green-800';
            case 'used': return 'bg-slate-100 text-slate-500 line-through';
            case 'expired': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
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
        <div className="space-y-6">
            {/* Ticket Validation Card */}
            <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                        <QrCode className="w-6 h-6 text-blue-400" /> Validasi E-Tiket Travel
                    </h2>
                    <p className="text-slate-400 text-sm mb-6">Input Kode Tiket atau Scan QR Code dari aplikasi pelanggan untuk validasi keberangkatan</p>
                    
                    <form onSubmit={handleValidateTicket} className="flex gap-3 max-w-md">
                        <input 
                            type="text"
                            placeholder="Masukkan Kode Tiket (UUID)..."
                            value={qrInput}
                            onChange={(e) => setQrInput(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                        />
                        <button 
                            type="submit"
                            disabled={isValidating || !qrInput.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                        >
                            {isValidating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Validasi Tiket'}
                        </button>
                    </form>
                </div>
                {/* Decorative background icon */}
                <QrCode className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* Header & Search */}
                <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-800">
                    <div>
                        <h2 className="text-xl font-bold">Daftar Pemesanan</h2>
                        <p className="text-sm text-slate-500 mt-1">Daftar semua tiket travel yang sudah dipesan</p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Cari nama atau kode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                                <th className="px-6 py-4 font-semibold text-slate-600">Penumpang</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Jadwal Travel</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Metode & Bayar</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Tiket</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Kode</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-800">
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Tidak ada data pemesanan yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((b) => (
                                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold flex items-center gap-2">
                                                {b.passenger_name}
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                                                    Kursi {b.seat_number}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {b.passenger_phone || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-1 font-medium">
                                                <MapPin className="w-3 h-3 text-red-400" />
                                                {b.travel_schedules.travel_routes.origin} → {b.travel_schedules.travel_routes.destination}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(b.travel_schedules.departure_time).toLocaleString('id-ID', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-1 font-bold text-blue-600">
                                                {b.payment_method === 'saldo' ? <CreditCard className="w-3 h-3" /> : <Banknote className="w-3 h-3" />}
                                                Rp {b.total_price.toLocaleString('id-ID')}
                                            </div>
                                            <div className="mt-1">
                                                {b.payment_status === 'paid' ? (
                                                    <span className="text-[10px] font-bold text-green-600 uppercase">Lunas</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-orange-500 uppercase">Pending</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(b.ticket_status)}`}>
                                                {b.ticket_status === 'unused' ? 'Aktif' : b.ticket_status}
                                            </span>
                                            {b.used_at && (
                                                <div className="text-[9px] text-slate-400 mt-1">
                                                    {new Date(b.used_at).toLocaleTimeString('id-ID')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="text-[10px] font-mono text-slate-400 max-w-[100px] truncate ml-auto" title={b.qr_code}>
                                                {b.qr_code}
                                            </div>
                                            <button 
                                                onClick={() => { setQrInput(b.qr_code); scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                className="text-[10px] text-blue-600 font-bold hover:underline mt-1"
                                            >
                                                Input Manual
                                            </button>
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
