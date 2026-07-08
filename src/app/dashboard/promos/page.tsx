'use client';

import { useState, useEffect } from 'react';
import { Tags, Plus, Pencil, Trash2, X, Search, Loader2, Calendar, Percent, CheckCircle, XCircle } from 'lucide-react';

interface PromoCode {
    id: string;
    code: string;
    discount_amount: number;
    description: string | null;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
}

export default function PromosPage() {
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        code: '',
        discount_amount: '',
        description: '',
        is_active: true,
        expires_at: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/promos');
            if (res.ok) {
                const data = await res.json();
                setPromos(data);
            }
        } catch (err) {
            console.error("Error fetching promo codes:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (promo?: PromoCode) => {
        if (promo) {
            setEditingId(promo.id);
            setForm({
                code: promo.code,
                discount_amount: String(promo.discount_amount),
                description: promo.description || '',
                is_active: promo.is_active,
                expires_at: promo.expires_at ? new Date(promo.expires_at).toISOString().split('T')[0] : ''
            });
        } else {
            setEditingId(null);
            setForm({
                code: '',
                discount_amount: '',
                description: '',
                is_active: true,
                expires_at: ''
            });
        }
        setIsOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId ? { ...form, id: editingId } : form;

            const res = await fetch('/api/promos', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setIsOpen(false);
                fetchPromos();
            } else {
                const errData = await res.json();
                alert(`Gagal: ${errData.error}`);
            }
        } catch (err) {
            alert("Terjadi kesalahan sistem.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Hapus kode promo ini secara permanen?")) return;
        try {
            const res = await fetch(`/api/promos?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchPromos();
            } else {
                const errData = await res.json();
                alert(`Gagal menghapus: ${errData.error}`);
            }
        } catch (err) {
            alert("Terjadi kesalahan sistem.");
        }
    };

    const toggleStatus = async (promo: PromoCode) => {
        try {
            const res = await fetch('/api/promos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: promo.id, is_active: !promo.is_active })
            });
            if (res.ok) fetchPromos();
        } catch (err) {
            console.error("Error toggling status:", err);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const filteredPromos = promos.filter(p =>
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-10rem)] flex flex-col relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Tags className="w-6 h-6 text-emerald-600 animate-pulse" />
                            Manajemen Kode Promo (Voucher)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Buat, edit, dan atur kupon diskon perjalanan/ojol untuk pelanggan Anda.
                        </p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-sm shadow-md"
                    >
                        <Plus className="w-5 h-5" />
                        Buat Promo Baru
                    </button>
                </div>

                {/* Filters */}
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari kode promo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 p-6 bg-slate-50">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs">
                                    <th className="px-6 py-4 font-bold text-slate-600">Kode Promo</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">Nominal Potongan</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">Deskripsi</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">Masa Berlaku</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-slate-600 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredPromos.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada kode promo ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPromos.map((p) => {
                                        const isExpired = p.expires_at ? new Date(p.expires_at) < new Date() : false;
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-bold text-slate-800 text-sm px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 uppercase">
                                                        {p.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                                                        <Percent className="w-4 h-4 text-emerald-500" />
                                                        {formatCurrency(p.discount_amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                                                    {p.description || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {p.expires_at ? (
                                                        <div className="flex items-center gap-1.5 text-slate-600">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className={isExpired ? "text-red-500 font-bold" : ""}>
                                                                {new Date(p.expires_at).toLocaleDateString('id-ID', {
                                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                                })}
                                                                {isExpired && " (Kedaluwarsa)"}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">Selamanya</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => toggleStatus(p)}
                                                        className={`px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px] cursor-pointer ${
                                                            p.is_active && !isExpired
                                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                        }`}
                                                    >
                                                        {p.is_active && !isExpired ? 'Aktif' : 'Nonaktif'}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenModal(p)}
                                                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">
                                {editingId ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kode Promo</label>
                                <input
                                    type="text"
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    placeholder="Contoh: RIDEGO"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nominal Diskon (Rp)</label>
                                <input
                                    type="number"
                                    value={form.discount_amount}
                                    onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                                    placeholder="Contoh: 5000"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Tulis deskripsi promo di sini..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Masa Berlaku (Tanggal Kedaluwarsa)</label>
                                <input
                                    type="date"
                                    value={form.expires_at}
                                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Kosongkan jika ingin promo berlaku selamanya.</p>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                                    Aktifkan Kode Promo Ini
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs mt-6"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Simpan Kode Promo
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
