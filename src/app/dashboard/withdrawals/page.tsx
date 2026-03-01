'use client';

import { useState, useEffect } from 'react';
import {
    Banknote,
    Search,
    Loader2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Eye,
    ExternalLink,
    Clock,
    User,
    Building2,
    CreditCard
} from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

interface WithdrawRequest {
    id: string;
    user_id: string;
    amount: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    proof_url: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    admin_note: string | null;
    created_at: string;
    user: {
        full_name: string;
        phone_number: string;
        role: string;
    };
}

export default function WithdrawalsPage() {
    const [requests, setRequests] = useState<WithdrawRequest[]>([]);
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Modal data for approval
    const [approvalModalOpen, setApprovalModalOpen] = useState<string | null>(null);
    const [proofUrl, setProofUrl] = useState('');

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/withdrawals?status=${statusFilter}`);
            const result = await res.json();
            if (res.ok && result.success) {
                setRequests(result.data);
            }
        } catch (error) {
            console.error("Error fetching withdrawals:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (requestId: string) => {
        const note = prompt("Alasan penolakan (Opsional):");
        if (note === null) return;

        setIsProcessing(requestId);
        try {
            const res = await fetch('/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: 'REJECTED', adminNote: note })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert("Berhasil: Pengajuan penarikan telah ditolak.");
                fetchRequests();
            } else {
                alert(`Gagal: ${data.error}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleApprove = async () => {
        if (!approvalModalOpen || !proofUrl) {
            alert("Harap unggah bukti transfer terlebih dahulu!");
            return;
        }

        const requestId = approvalModalOpen;
        setIsProcessing(requestId);
        try {
            const res = await fetch('/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: 'APPROVED', proofUrl })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert("Berhasil: Pengajuan penarikan telah disetujui & bukti transfer tersimpan.");
                setApprovalModalOpen(null);
                setProofUrl('');
                fetchRequests();
            } else {
                alert(`Gagal: ${data.error}`);
            }
        } catch (error) {
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
                            <Banknote className="w-6 h-6 text-emerald-600" />
                            Pengajuan Penarikan Saldo (Withdraw)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Review dan kirim bukti transfer untuk pengajuan withdraw mitra.</p>
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
                                className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${statusFilter === s ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
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
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                                    <th className="px-6 py-4 font-semibold text-slate-600">Mitra</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Nominal</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Info Rekening</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Waktu</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada permintaan penarikan yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{req.user.full_name}</div>
                                                <div className="text-xs text-slate-500">{req.user.phone_number} • {req.user.role}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-emerald-700">
                                                    Rp {Number(req.amount).toLocaleString('id-ID')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <div className="flex items-center gap-1 font-medium text-slate-700">
                                                        <Building2 className="w-3 h-3 text-slate-400" /> {req.bank_name}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <CreditCard className="w-3 h-3" /> {req.account_number}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <User className="w-3 h-3" /> a/n {req.account_name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-slate-600 flex items-center gap-1">
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
                                                            onClick={() => setApprovalModalOpen(req.id)}
                                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-bold flex items-center gap-1"
                                                        >
                                                            MODAL KIRIM
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={!!isProcessing}
                                                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                            {req.status}
                                                        </div>
                                                        {req.proof_url && (
                                                            <button
                                                                onClick={() => setSelectedImage(req.proof_url)}
                                                                className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-0.5"
                                                            >
                                                                <Eye className="w-3 h-3" /> Lihat Bukti
                                                            </button>
                                                        )}
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

            {/* Approval Modal (Transfer Proof Upload) */}
            {approvalModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Bukti Transfer</h3>
                            <button onClick={() => setApprovalModalOpen(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Anda menyetujui penarikan ini. Harap upload bukti transfer bank sebagai konfirmasi kepada mitra.</p>

                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center">
                                {proofUrl ? (
                                    <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                                        <img src={proofUrl} alt="Bukti Transfer" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setProofUrl('')}
                                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-500"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-4 flex flex-col items-center">
                                        <Banknote className="w-12 h-12 text-slate-300 mb-2" />
                                        <CldUploadWidget
                                            uploadPreset="ojek_online"
                                            onSuccess={(result: any) => {
                                                if (result.info && result.info.secure_url) {
                                                    setProofUrl(result.info.secure_url);
                                                }
                                            }}
                                            options={{ maxFiles: 1, multiple: false }}
                                        >
                                            {({ open }) => (
                                                <button
                                                    onClick={() => open()}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700"
                                                >
                                                    Pilih Foto Bukti...
                                                </button>
                                            )}
                                        </CldUploadWidget>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleApprove}
                                disabled={!proofUrl || !!isProcessing}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing === approvalModalOpen ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                KONFIRMASI & SELESAIKAN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-slate-950/80 z-[80] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="Bukti Transfer Zoom" className="max-w-full max-h-[80vh] object-contain" />
                        <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
                            <span className="text-sm text-slate-500 font-medium">Bukti Transfer Admin</span>
                            <div className="flex gap-4">
                                <a href={selectedImage} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-bold text-blue-600">
                                    <ExternalLink className="w-4 h-4" /> Buka Tab Baru
                                </a>
                                <button onClick={() => setSelectedImage(null)} className="text-sm font-bold text-slate-600">Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
