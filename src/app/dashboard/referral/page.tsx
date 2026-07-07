'use client';

import { useState, useEffect } from 'react';
import {
    Gift,
    Settings,
    Users,
    Banknote,
    RefreshCw,
    XCircle,
    Eye,
    CheckCircle2,
    Search,
    Loader2,
    ExternalLink,
    Building2,
    CreditCard,
    User,
    Clock,
    Award
} from 'lucide-react';
import { CldUploadWidget } from 'next-cloudinary';

interface ReferralSetting {
    referrer_reward: string;
    referee_reward: string;
    min_withdrawal: string;
}

interface ReferralWithdrawal {
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
        email: string;
    };
}

interface LeaderboardUser {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    role: string;
    referral_code: string;
    referral_balance: number;
    referral_count: number;
}

export default function ReferralDashboardPage() {
    const [activeTab, setActiveTab] = useState<'settings' | 'withdrawals' | 'leaderboard'>('withdrawals');
    const [settings, setSettings] = useState<ReferralSetting>({
        referrer_reward: '5000',
        referee_reward: '2000',
        min_withdrawal: '50000'
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Withdrawals states
    const [withdrawals, setWithdrawals] = useState<ReferralWithdrawal[]>([]);
    const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [withdrawLoading, setWithdrawLoading] = useState(true);
    const [withdrawSearch, setWithdrawSearch] = useState('');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [approvalModalOpen, setApprovalModalOpen] = useState<string | null>(null);
    const [proofUrl, setProofUrl] = useState('');

    // Leaderboard states
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);
    const [leaderboardSearch, setLeaderboardSearch] = useState('');

    // Fetch referral settings
    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/referral/settings');
            const data = await res.json();
            if (res.ok && data.success && data.settings) {
                setSettings({
                    referrer_reward: data.settings.referrer_reward || '5000',
                    referee_reward: data.settings.referee_reward || '2000',
                    min_withdrawal: data.settings.min_withdrawal || '50000'
                });
            }
        } catch (error) {
            console.error("Error fetching referral settings:", error);
        }
    };

    // Save referral settings
    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const res = await fetch('/api/referral/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert("Konfigurasi referral berhasil disimpan!");
            } else {
                alert(`Gagal menyimpan: ${data.error}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan sistem saat menyimpan konfigurasi.");
        } finally {
            setIsSavingSettings(false);
        }
    };

    // Fetch withdrawals
    const fetchWithdrawals = async () => {
        setWithdrawLoading(true);
        try {
            const res = await fetch(`/api/referral/withdrawals?status=${statusFilter}`);
            const data = await res.json();
            if (res.ok && data.success) {
                setWithdrawals(data.data);
            }
        } catch (error) {
            console.error("Error fetching referral withdrawals:", error);
        } finally {
            setWithdrawLoading(false);
        }
    };

    // Fetch leaderboard
    const fetchLeaderboard = async () => {
        setLeaderboardLoading(true);
        try {
            const res = await fetch('/api/referral/stats');
            const data = await res.json();
            if (res.ok && data.success) {
                setLeaderboard(data.data);
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'withdrawals') {
            fetchWithdrawals();
        } else if (activeTab === 'leaderboard') {
            fetchLeaderboard();
        }
    }, [activeTab, statusFilter]);

    // Handle withdrawal reject
    const handleReject = async (requestId: string) => {
        const note = prompt("Alasan penolakan (Opsional):");
        if (note === null) return;

        setIsProcessing(requestId);
        try {
            const res = await fetch('/api/referral/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: 'REJECTED', adminNote: note })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert("Berhasil: Pengajuan penarikan referral telah ditolak & koin dikembalikan.");
                fetchWithdrawals();
            } else {
                alert(`Gagal: ${data.error}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsProcessing(null);
        }
    };

    // Handle withdrawal approve
    const handleApprove = async () => {
        if (!approvalModalOpen || !proofUrl) {
            alert("Harap unggah bukti transfer terlebih dahulu!");
            return;
        }

        const requestId = approvalModalOpen;
        setIsProcessing(requestId);
        try {
            const res = await fetch('/api/referral/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status: 'APPROVED', proofUrl })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert("Berhasil: Pengajuan penarikan referral telah disetujui.");
                setApprovalModalOpen(null);
                setProofUrl('');
                fetchWithdrawals();
            } else {
                alert(`Gagal: ${data.error}`);
            }
        } catch (error) {
            alert("Terjadi kesalahan sistem.");
        } finally {
            setIsProcessing(null);
        }
    };

    // Filter withdrawals
    const filteredWithdrawals = withdrawals.filter(r =>
        r.user?.full_name?.toLowerCase().includes(withdrawSearch.toLowerCase()) ||
        r.user?.phone_number?.includes(withdrawSearch)
    );

    // Filter leaderboard
    const filteredLeaderboard = leaderboard.filter(u =>
        u.full_name?.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
        u.referral_code?.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
        u.phone_number?.includes(leaderboardSearch)
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-10rem)] flex flex-col relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Gift className="w-6 h-6 text-emerald-600 animate-pulse" />
                            Program Referral & Bagi Koin
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Atur pembagian koin referral, pantau penarikan dana, dan lihat leaderboard referral user.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {activeTab === 'withdrawals' && (
                            <button
                                onClick={fetchWithdrawals}
                                className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                title="Refresh Withdrawals"
                            >
                                <RefreshCw className={`w-5 h-5 ${withdrawLoading ? 'animate-spin text-emerald-600' : ''}`} />
                            </button>
                        )}
                        {activeTab === 'leaderboard' && (
                            <button
                                onClick={fetchLeaderboard}
                                className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                title="Refresh Leaderboard"
                            >
                                <RefreshCw className={`w-5 h-5 ${leaderboardLoading ? 'animate-spin text-emerald-600' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6 flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('withdrawals')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'withdrawals'
                                ? 'border-emerald-600 text-emerald-700 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Banknote className="w-4 h-4" />
                        Pengajuan Withdraw ({statusFilter === 'PENDING' ? 'Menunggu' : statusFilter === 'APPROVED' ? 'Disetujui' : 'Ditolak'})
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'leaderboard'
                                ? 'border-emerald-600 text-emerald-700 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Leaderboard & Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                            activeTab === 'settings'
                                ? 'border-emerald-600 text-emerald-700 font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Settings className="w-4 h-4" />
                        Konfigurasi Referral
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 bg-slate-50">
                {/* 1. Tab Configuration */}
                {activeTab === 'settings' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm mt-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Settings className="w-8 h-8 text-emerald-600" />
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Ubah Pengaturan Referral</h3>
                                <p className="text-xs text-slate-500">Nilai nominal dalam rupiah (misalnya 5000 = Rp 5.000)</p>
                            </div>
                        </div>

                        <form onSubmit={saveSettings} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Reward Penyebar Kode (Referrer Reward)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold text-sm">Rp</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={settings.referrer_reward}
                                        onChange={(e) => setSettings({ ...settings, referrer_reward: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                                        required
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">Diberikan kepada pemilik kode referral saat kodenya digunakan.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Reward Pengisi Kode (Referee Reward)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold text-sm">Rp</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={settings.referee_reward}
                                        onChange={(e) => setSettings({ ...settings, referee_reward: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                                        required
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">Diberikan kepada pendaftar baru yang menggunakan kode referral orang lain.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Minimal Penarikan (Min Withdrawal)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold text-sm">Rp</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={settings.min_withdrawal}
                                        onChange={(e) => setSettings({ ...settings, min_withdrawal: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                                        required
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">Jumlah nominal koin referral minimum agar user dapat mengajukan withdraw.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingSettings}
                                className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSavingSettings && <Loader2 className="w-5 h-5 animate-spin" />}
                                Simpan Konfigurasi
                            </button>
                        </form>
                    </div>
                )}

                {/* 2. Tab Withdrawals */}
                {activeTab === 'withdrawals' && (
                    <div className="space-y-4">
                        {/* Filters for withdrawals */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                                {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`flex-1 sm:flex-none px-6 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                            statusFilter === s
                                                ? 'bg-white text-emerald-700 shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {s === 'PENDING' ? 'Menunggu' : s === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama atau nomor HP..."
                                    value={withdrawSearch}
                                    onChange={(e) => setWithdrawSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {/* List */}
                        {withdrawLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                                            <th className="px-6 py-4 font-bold text-slate-600">Pengguna</th>
                                            <th className="px-6 py-4 font-bold text-slate-600">Nominal Tarik</th>
                                            <th className="px-6 py-4 font-bold text-slate-600">Informasi Bank</th>
                                            <th className="px-6 py-4 font-bold text-slate-600">Waktu Pengajuan</th>
                                            <th className="px-6 py-4 font-bold text-slate-600 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredWithdrawals.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                    Tidak ada pengajuan penarikan referral ditemukan.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredWithdrawals.map((req) => (
                                                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{req.user?.full_name || 'Tanpa Nama'}</div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {req.user?.phone_number || '-'} • {req.user?.email || '-'}
                                                        </div>
                                                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-50 text-blue-700">
                                                            {req.user?.role || 'USER'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-emerald-700 text-sm">
                                                            Rp {Number(req.amount).toLocaleString('id-ID')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-0.5 text-slate-700">
                                                            <div className="flex items-center gap-1 font-medium">
                                                                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {req.bank_name}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> {req.account_number}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <User className="w-3.5 h-3.5 text-slate-400" /> a/n {req.account_name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-slate-600 flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                                                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors font-bold"
                                                                >
                                                                    Setujui
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(req.id)}
                                                                    disabled={!!isProcessing}
                                                                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-bold disabled:opacity-50"
                                                                >
                                                                    Tolak
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-end gap-1">
                                                                <div className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                                    req.status === 'APPROVED'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                    {req.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                                                                </div>
                                                                {req.admin_note && (
                                                                    <div className="text-[10px] text-slate-500 italic max-w-xs text-right">
                                                                        "{req.admin_note}"
                                                                    </div>
                                                                )}
                                                                {req.proof_url && (
                                                                    <button
                                                                        onClick={() => setSelectedImage(req.proof_url)}
                                                                        className="text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center gap-0.5 mt-1"
                                                                    >
                                                                        <Eye className="w-3 h-3" /> Lihat Bukti Transfer
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
                )}

                {/* 3. Tab Leaderboard / Statistics */}
                {activeTab === 'leaderboard' && (
                    <div className="space-y-4">
                        {/* Search field */}
                        <div className="flex justify-end bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari user, kode, hp..."
                                    value={leaderboardSearch}
                                    onChange={(e) => setLeaderboardSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        {leaderboardLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                                            <th className="px-6 py-4 font-bold text-slate-600 w-16 text-center">Peringkat</th>
                                            <th className="px-6 py-4 font-bold text-slate-600">Pengguna</th>
                                            <th className="px-6 py-4 font-bold text-slate-600">Kode Referral</th>
                                            <th className="px-6 py-4 font-bold text-slate-600 text-center">Jumlah Teman Diajak</th>
                                            <th className="px-6 py-4 font-bold text-slate-600 text-right">Saldo Referral</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                        {filteredLeaderboard.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                    Belum ada aktivitas referral yang terdata.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredLeaderboard.map((user, idx) => (
                                                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 text-center">
                                                        {idx === 0 ? (
                                                            <div className="flex justify-center"><Award className="w-6 h-6 text-yellow-500" /></div>
                                                        ) : idx === 1 ? (
                                                            <div className="flex justify-center"><Award className="w-6 h-6 text-slate-400" /></div>
                                                        ) : idx === 2 ? (
                                                            <div className="flex justify-center"><Award className="w-6 h-6 text-amber-600" /></div>
                                                        ) : (
                                                            <span className="font-bold text-slate-400">{idx + 1}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-800">{user.full_name}</div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {user.phone_number || '-'} • {user.email || '-'}
                                                        </div>
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[8px] font-bold rounded bg-slate-100 text-slate-600">
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-mono font-bold text-slate-600 text-sm">
                                                        {user.referral_code}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-800 text-sm">
                                                        {user.referral_count} orang
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 text-sm">
                                                        Rp {user.referral_balance.toLocaleString('id-ID')}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Approval Modal (Transfer Proof Upload) */}
            {approvalModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Bukti Transfer Referral</h3>
                            <button
                                onClick={() => setApprovalModalOpen(null)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs text-slate-500">
                                Pengajuan withdraw ini akan disetujui. Unggah bukti transfer bank untuk menyelesaikan verifikasi bagi user.
                            </p>

                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col items-center">
                                {proofUrl ? (
                                    <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                                        <img src={proofUrl} alt="Bukti Transfer" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setProofUrl('')}
                                            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-500 cursor-pointer"
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
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 cursor-pointer"
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
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs"
                            >
                                {isProcessing === approvalModalOpen ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-5 h-5" />
                                )}
                                KONFIRMASI & SELESAIKAN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-slate-950/80 z-[80] flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img src={selectedImage} alt="Bukti Transfer Zoom" className="max-w-full max-h-[80vh] object-contain" />
                        <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium">Bukti Transfer Admin</span>
                            <div className="flex gap-4">
                                <a
                                    href={selectedImage}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700"
                                >
                                    <ExternalLink className="w-4 h-4" /> Buka Tab Baru
                                </a>
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
