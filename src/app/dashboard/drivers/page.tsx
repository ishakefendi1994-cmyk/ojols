'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Eye, Car, Bike } from 'lucide-react';

interface DriverProfile {
    id: string;
    full_name: string;
    phone_number: string | null;
    vehicle_type: string | null;
    selfie_url: string | null;
    ktp_url: string | null;
    sim_url: string | null;
    vehicle_front_url: string | null;
    stnk_url: string | null;
    tnkb_url: string | null;
    is_verified: boolean;
    verification_status: string;
    rejection_reason: string | null;
    created_at: string;
}

export default function DriversVerificationPage() {
    const [drivers, setDrivers] = useState<DriverProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('PENDING');
    const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [activePhoto, setActivePhoto] = useState<string | null>(null);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [actionDriverId, setActionDriverId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDrivers();
    }, [filterStatus]);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/drivers/verify?status=${filterStatus}`);
            const result = await res.json();
            if (res.ok) setDrivers(result.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleVerify = async (id: string) => {
        if (!confirm('Verifikasi driver ini? Mereka akan bisa menerima order.')) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/drivers/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'VERIFY', id }),
            });
            if (res.ok) { fetchDrivers(); setSelectedDriver(null); }
            else alert('Gagal memverifikasi driver.');
        } finally { setIsSubmitting(false); }
    };

    const handleReject = async () => {
        if (!actionDriverId || !rejectReason.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/drivers/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'REJECT', id: actionDriverId, reason: rejectReason }),
            });
            if (res.ok) {
                fetchDrivers();
                setIsRejectModalOpen(false);
                setSelectedDriver(null);
                setRejectReason('');
            } else alert('Gagal menolak driver.');
        } finally { setIsSubmitting(false); }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            PENDING: 'bg-yellow-100 text-yellow-800',
            VERIFIED: 'bg-green-100 text-green-800',
            REJECTED: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Car className="w-6 h-6 text-blue-600" /> Verifikasi Mitra Driver
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Review dokumen KTP, SIM, dan foto diri driver baru</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                    {['PENDING', 'VERIFIED', 'REJECTED'].map((s) => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                            <th className="px-6 py-4 font-semibold text-slate-600">Driver</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Kendaraan</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Dokumen</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="py-12 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                                <p className="text-sm text-slate-500 mt-2">Memuat data driver...</p>
                            </td></tr>
                        ) : drivers.length === 0 ? (
                            <tr><td colSpan={5} className="py-8 text-center text-slate-400">
                                Tidak ada driver dengan status {filterStatus}.
                            </td></tr>
                        ) : drivers.map((d) => (
                            <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-800">{d.full_name}</div>
                                    <div className="text-xs text-slate-400">{d.phone_number || '-'}</div>
                                    <div className="text-xs text-slate-400">Daftar: {new Date(d.created_at).toLocaleDateString('id-ID')}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 text-sm">
                                        {d.vehicle_type === 'MOBIL' ? <Car className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                                        {d.vehicle_type || 'MOTOR'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: 'Selfie', url: d.selfie_url },
                                            { label: 'KTP', url: d.ktp_url },
                                            { label: 'SIM', url: d.sim_url },
                                            { label: 'Kendaraan', url: d.vehicle_front_url },
                                            { label: 'STNK', url: d.stnk_url },
                                            { label: 'Plat Nomor', url: d.tnkb_url }
                                        ].map(({ label, url }) => (
                                            url ? (
                                                <button key={label} onClick={() => { setActivePhoto(url); setIsPhotoModalOpen(true); }}
                                                    className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors">
                                                    <Eye className="w-2.5 h-2.5" /> {label}
                                                </button>
                                            ) : (
                                                <span key={label} className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-1 rounded">{label} ✗</span>
                                            )
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">{statusBadge(d.verification_status)}</td>
                                <td className="px-6 py-4 text-right">
                                    {d.verification_status === 'PENDING' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleVerify(d.id)} disabled={isSubmitting}
                                                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1 disabled:opacity-50">
                                                <CheckCircle className="w-3.5 h-3.5" /> Verifikasi
                                            </button>
                                            <button onClick={() => { setActionDriverId(d.id); setIsRejectModalOpen(true); }} disabled={isSubmitting}
                                                className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1">
                                                <XCircle className="w-3.5 h-3.5" /> Tolak
                                            </button>
                                        </div>
                                    )}
                                    {d.verification_status !== 'PENDING' && (
                                        <span className="text-xs text-slate-400 italic">
                                            {d.verification_status === 'REJECTED' && d.rejection_reason ? `Alasan: ${d.rejection_reason}` : '-'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Photo Preview Modal */}
            {isPhotoModalOpen && activePhoto && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsPhotoModalOpen(false)}>
                    <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsPhotoModalOpen(false)}
                            className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg z-10">
                            <XCircle className="w-6 h-6 text-slate-600" />
                        </button>
                        <img src={activePhoto} alt="Dokumen" className="w-full rounded-xl shadow-2xl" />
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-500" /> Tolak Verifikasi Driver
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Berikan alasan penolakan agar driver tahu apa yang perlu diperbaiki.</p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                            rows={3}
                            placeholder="Contoh: Foto KTP buram / tidak terbaca. Harap upload ulang dengan pencahayaan yang baik."
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button onClick={() => { setIsRejectModalOpen(false); setRejectReason(''); }}
                                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                                Batal
                            </button>
                            <button onClick={handleReject} disabled={isSubmitting || !rejectReason.trim()}
                                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50">
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Tolak Driver
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
