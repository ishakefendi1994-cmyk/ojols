'use client';

import { useState, useEffect } from 'react';
import {
    ClipboardCheck,
    Search,
    Loader2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Eye,
    ExternalLink,
    Clock,
    AlertCircle
} from 'lucide-react';

interface TopupRequest {
    id: string;
    user_id: string;
    amount: number;
    proof_url: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_note: string | null;
    created_at: string;
    user: {
        full_name: string;
        phone_number: string;
        role: string;
    };
}

export default function TopupsPage() {
    const [requests, setRequests] = useState<TopupRequest[]>([]);
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/topups?status=${statusFilter}`);
            const result = await res.json();
            if (res.ok && result.success) {
                setRequests(result.data);
            }
        } catch (error) {
            console.error("Error fetching topups:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
        const note = status === 'REJECTED' ? prompt("Alasan penolakan (Opsional):") : null;
        if (status === 'REJECTED' && note === null) return; // User cancelled prompt

        setIsProcessing(requestId);
        try {
            const res = await fetch('/api/topups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status, adminNote: note })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert(`Berhasil: Request telah ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}`);
                fetchRequests();
            } else {
                alert(`Gagal: ${data.error}`);
            }
        } catch (error) {
            console.error("Error updating topup status", error);
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsProcessing(null);
        }
    };

    const filteredRequests = requests.filter(r =>
        r.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.phone_number.includes(searchQuery)
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-10rem)] flex flex-col relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <ClipboardCheck className="w-6 h-6 text-blue-600" />
                            Persetujuan Top-up Saldo
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Verifikasi bukti transfer dan setujui penambahan saldo pengguna.</p>
                    </div>

                    <button
                        onClick={fetchRequests}
                        className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors self-start"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                {s === 'PENDING' ? 'Menunggu' : s === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau nomor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-x-auto p-6 bg-slate-50">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                                    <th className="px-6 py-4 font-semibold text-slate-600">Pengguna</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Nominal (Rp)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Bukti Bayar</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Waktu</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada permintaan top-up yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{req.user.full_name}</div>
                                                <div className="text-xs text-slate-500">{req.user.phone_number} • {req.user.role}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                Rp {Number(req.amount).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div
                                                    className="relative group cursor-pointer w-16 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden"
                                                    onClick={() => setSelectedImage(req.proof_url)}
                                                >
                                                    <img src={req.proof_url} alt="Bukti" className="w-full h-full object-cover group-hover:opacity-50 transition-opacity" />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Eye className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    {new Date(req.created_at).toLocaleString('id-ID', {
                                                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {req.status === 'PENDING' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleAction(req.id, 'APPROVED')}
                                                            disabled={!!isProcessing}
                                                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                            title="Approve"
                                                        >
                                                            {isProcessing === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'REJECTED')}
                                                            disabled={!!isProcessing}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 inline-block rounded ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {req.status}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Image Modal Preview */}
            {selectedImage && (
                <div className="fixed inset-0 bg-slate-950/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="Bukti Transfer Zoom" className="max-w-full max-h-[80vh] object-contain" />
                        <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
                            <span className="text-sm text-slate-500 font-medium">Bukti Transfer Pengguna</span>
                            <div className="flex gap-4">
                                <a href={selectedImage} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">
                                    <ExternalLink className="w-4 h-4" /> Buka Tab Baru
                                </a>
                                <button onClick={() => setSelectedImage(null)} className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-700">
                                    Tutup Pratinjau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
