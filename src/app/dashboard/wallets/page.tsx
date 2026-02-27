'use client';

import { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Loader2,
    RefreshCw,
    UserCircle,
    Store,
    Car,
    Shield
} from 'lucide-react';

interface UserProfile {
    id: string;
    full_name: string;
    role: string;
    phone_number: string | null;
}

interface WalletType {
    id: string;
    balance: number;
    updated_at: string;
    user: UserProfile;
}

interface TransactionType {
    id: string;
    wallet_id: string;
    order_id: string | null;
    type: string;
    amount: number;
    description: string | null;
    created_at: string;
    wallet: {
        user: {
            full_name: string;
            role: string;
        }
    }
}

export default function WalletsPage() {
    const [activeTab, setActiveTab] = useState<'wallets' | 'transactions'>('wallets');
    const [wallets, setWallets] = useState<WalletType[]>([]);
    const [transactions, setTransactions] = useState<TransactionType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'TOPUP' | 'WITHDRAW'>('TOPUP');
    const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
    const [amountStr, setAmountStr] = useState('');
    const [description, setDescription] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchData(activeTab);
    }, [activeTab]);

    const fetchData = async (type: 'wallets' | 'transactions') => {
        setLoading(true);
        try {
            const res = await fetch(`/api/wallets?type=${type}`);
            const result = await res.json();
            if (res.ok && result.success) {
                if (type === 'wallets') {
                    setWallets(result.data);
                } else {
                    setTransactions(result.data);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (wallet: WalletType, action: 'TOPUP' | 'WITHDRAW') => {
        setSelectedWallet(wallet);
        setModalAction(action);
        setAmountStr('');
        setDescription('');
        setIsModalOpen(true);
    };

    const handleSubmitTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWallet) return;

        setIsProcessing(true);
        try {
            const res = await fetch('/api/wallets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletId: selectedWallet.id,
                    action: modalAction,
                    amount: Number(amountStr),
                    description: description || `Admin Manual ${modalAction}`
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert(`Berhasil melakukan ${modalAction} Rp ${amountStr}`);
                setIsModalOpen(false);
                fetchData(activeTab); // Refresh list
            } else {
                alert(`Gagal: ${data.error}`);
            }
        } catch (error) {
            console.error("Error submitting manual transaction", error);
            alert("Terjadi kesalahan sistem saat memproses transaksi.");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Shield className="w-4 h-4 text-red-500" />;
            case 'DRIVER': return <Car className="w-4 h-4 text-blue-500" />;
            case 'MERCHANT': return <Store className="w-4 h-4 text-purple-500" />;
            default: return <UserCircle className="w-4 h-4 text-slate-400" />;
        }
    };

    const filteredWallets = wallets.filter(w =>
        (w.user?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (w.user?.phone_number && w.user.phone_number.includes(searchQuery))
    );

    const filteredTrx = transactions.filter(t =>
        (t.wallet?.user?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-10rem)] flex flex-col relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-emerald-600" />
                            Dompet & Transaksi
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Pantau saldo digital pengguna dan riwayat arus kas sistem.</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchData(activeTab)}
                            className="p-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => { setSearchQuery(''); setActiveTab('wallets') }}
                            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'wallets' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Saldo Pengguna
                        </button>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveTab('transactions') }}
                            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'transactions' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            Riwayat Transaksi
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-x-auto bg-slate-50 p-6">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : activeTab === 'wallets' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredWallets.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500">
                                Tidak ada data dompet ditemukan.
                            </div>
                        ) : (
                            filteredWallets.map(wallet => (
                                <div key={wallet.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                {renderRoleIcon(wallet.user?.role || 'CUSTOMER')}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 line-clamp-1">{wallet.user?.full_name || 'Hamba Allah'}</h4>
                                                <p className="text-xs text-slate-500">{wallet.user?.phone_number || 'Tidak ada no HP'}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wider px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                            {wallet.user?.role || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Total Saldo Dompet</p>
                                        <p className={`text-2xl font-bold ${wallet.balance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                                            Rp {Number(wallet.balance).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleOpenModal(wallet, 'TOPUP')}
                                            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            <ArrowDownRight className="w-4 h-4 mr-1" /> Top-Up
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(wallet, 'WITHDRAW')}
                                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            <ArrowUpRight className="w-4 h-4 mr-1" /> Tarik
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                                    <th className="px-6 py-4 font-semibold text-slate-600">ID & Waktu</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Pengguna</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600">Jenis Trx</th>
                                    <th className="px-6 py-4 font-semibold text-slate-600 text-right">Nominal (Rp)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTrx.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada riwayat transaksi.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTrx.map(trx => (
                                        <tr key={trx.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs text-slate-400 mb-1">#{trx.id.split('-')[0]}</div>
                                                <div className="text-sm font-medium text-slate-700">
                                                    {new Date(trx.created_at).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">{trx.wallet?.user?.full_name || 'System'}</p>
                                                <p className="text-xs text-slate-500">{trx.wallet?.user?.role || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold tracking-wider">
                                                    {trx.type}
                                                </span>
                                                {trx.description && (
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-[200px]" title={trx.description}>{trx.description}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={`font-bold flex items-center justify-end ${Number(trx.amount) > 0 ? 'text-emerald-600' : 'text-red-500'
                                                    }`}>
                                                    {Number(trx.amount) > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                                                    {Math.abs(Number(trx.amount)).toLocaleString('id-ID')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form Transaksi */}
            {isModalOpen && selectedWallet && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className={`p-6 border-b ${modalAction === 'TOPUP' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <h3 className={`text-xl font-bold ${modalAction === 'TOPUP' ? 'text-emerald-800' : 'text-red-800'}`}>
                                {modalAction === 'TOPUP' ? 'Top-Up Saldo Dompet' : 'Tarik Saldo (Withdraw)'}
                            </h3>
                            <p className="text-sm mt-1 text-slate-600">
                                Pengguna: <span className="font-bold">{selectedWallet.user?.full_name}</span>
                            </p>
                            <p className="text-sm text-slate-600">
                                Sisa Saldo: <span className="font-bold">Rp {Number(selectedWallet.balance).toLocaleString('id-ID')}</span>
                            </p>
                        </div>

                        <form onSubmit={handleSubmitTransaction} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nominal (Rp) *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1000"
                                    value={amountStr}
                                    onChange={(e) => setAmountStr(e.target.value)}
                                    placeholder="Contoh: 50000"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Catatan / Deskripsi (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Contoh: Deposit Tunai Kantor"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50"
                                    disabled={isProcessing}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing || !amountStr}
                                    className={`flex-1 flex items-center justify-center px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${modalAction === 'TOPUP' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Proses'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
